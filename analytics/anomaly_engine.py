"""
PredictaMaint - Anomaly Detection Engine
Computes rolling window statistical metrics (mean, std dev, z-scores) and threshold checks
across incoming machine telemetry streams.
Generates explainable anomaly alerts (severity: low, medium, high, critical)
and automatically generates maintenance tickets for high/critical anomalies.
"""

import os
import sys
import time
import math
import argparse
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

# Configure stdout for Windows console UTF-8 compatibility
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/predictamaint")

# Standard sensor types to monitor
SENSORS = ["vibration", "temperature", "current", "pressure", "rpm"]

class AnomalyEngine:
    def __init__(self, mongo_uri=MONGO_URI):
        self.mongo_uri = mongo_uri
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database()
        print(f"[AnomalyEngine] Connected to MongoDB database: {self.db.name}")

    def fetch_recent_telemetry(self, machine_id, window_limit=60):
        """Fetch the latest N telemetry readings for a machine"""
        cursor = self.db.telemetry.find(
            {"machineId": machine_id}
        ).sort("timestamp", -1).limit(window_limit)
        readings = list(cursor)
        readings.reverse()  # Chronological order
        return readings

    def get_machine_thresholds(self, machine_id):
        """Fetch machine defined thresholds from MongoDB"""
        mach = self.db.machines.find_one({"machineId": machine_id})
        if mach and "thresholds" in mach:
            return mach["thresholds"]
        # Default safety thresholds if not found
        return {
            "vibration": 5.0,
            "temperature": 80.0,
            "current": 25.0,
            "pressure": 10.0
        }

    def evaluate_reading(self, reading, history, thresholds):
        """
        Evaluate single reading against rolling baseline history and defined thresholds.
        Returns list of detected anomalies.
        """
        if len(history) < 5:
            # Not enough historical baseline points yet
            return []

        df = pd.DataFrame(history)
        anomalies = []
        machine_id = reading["machineId"]
        ts = reading["timestamp"]

        for sensor in ["vibration", "temperature", "current", "pressure"]:
            if sensor not in df.columns or sensor not in reading:
                continue

            current_val = float(reading[sensor])
            series = df[sensor].astype(float)
            mean = series.mean()
            std = series.std()

            # Prevent zero-division on flat sensor values
            if std < 1e-4:
                std = 0.05

            z_score = (current_val - mean) / std
            threshold = thresholds.get(sensor, 9999.0)
            threshold_ratio = current_val / threshold if threshold > 0 else 1.0

            # Determine anomaly condition
            # Z-score > 2.5 or exceeding threshold
            is_anomaly = False
            severity = "low"
            score = round(abs(z_score), 2)

            if current_val >= threshold * 1.25 or z_score >= 4.0:
                is_anomaly = True
                severity = "critical"
            elif current_val >= threshold or z_score >= 3.0:
                is_anomaly = True
                severity = "high"
            elif current_val >= threshold * 0.9 or z_score >= 2.5:
                is_anomaly = True
                severity = "medium"
            elif z_score >= 2.0:
                is_anomaly = True
                severity = "low"

            if is_anomaly:
                # Build rich explainability string
                unit = {
                    "vibration": "mm/s",
                    "temperature": "°C",
                    "current": "A",
                    "pressure": "bar"
                }.get(sensor, "")

                fault_hypothesis = ""
                if sensor == "vibration":
                    fault_hypothesis = "Probable mechanical unbalance, shaft misalignment, or roller bearing race spalling."
                elif sensor == "temperature":
                    fault_hypothesis = "Abnormal thermal buildup, potential lubrication failure or heat exchanger blockage."
                elif sensor == "current":
                    fault_hypothesis = "Motor stator winding overload, voltage supply imbalance, or mechanical binding."
                elif sensor == "pressure":
                    if current_val < mean:
                        fault_hypothesis = "Sub-nominal pressure: potential hydraulic line leak or suction cavitation."
                    else:
                        fault_hypothesis = "Over-pressure condition: relief valve restriction or downstream pipe blockage."

                explanation = (
                    f"{sensor.capitalize()} reading of {current_val}{unit} exceeded baseline mean "
                    f"({round(mean, 2)}{unit}) with z-score of {score}σ (Limit: {threshold}{unit}). "
                    f"{fault_hypothesis}"
                )

                anomaly_doc = {
                    "machineId": machine_id,
                    "timestamp": ts,
                    "sensor": sensor,
                    "severity": severity,
                    "score": score,
                    "value": current_val,
                    "mean": round(float(mean), 2),
                    "threshold": float(threshold),
                    "explanation": explanation,
                    "status": "open"
                }
                anomalies.append(anomaly_doc)

        return anomalies

    def process_machine(self, machine_id):
        """Analyze latest telemetry for a machine and persist anomalies & tickets"""
        history = self.fetch_recent_telemetry(machine_id, window_limit=40)
        if not history:
            return []

        latest_reading = history[-1]
        thresholds = self.get_machine_thresholds(machine_id)
        
        # Don't re-analyze the exact same reading timestamp
        already_checked = self.db.anomalies.find_one({
            "machineId": machine_id,
            "timestamp": latest_reading["timestamp"]
        })
        if already_checked:
            return []

        baseline_history = history[:-1] if len(history) > 1 else history
        flagged = self.evaluate_reading(latest_reading, baseline_history, thresholds)

        for anom in flagged:
            # Check if recently flagged same anomaly in last 30 seconds to prevent alert flood
            recent_duplicate = self.db.anomalies.find_one({
                "machineId": anom["machineId"],
                "sensor": anom["sensor"],
                "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(seconds=25)}
            })
            if recent_duplicate:
                continue

            # Insert anomaly into MongoDB
            res = self.db.anomalies.insert_one(anom)
            anomaly_id = str(res.inserted_id)

            print(f"[AnomalyEngine] 🚨 FLAGGED [{anom['severity'].upper()}] on {anom['machineId']} ({anom['sensor']}): {anom['explanation'][:80]}...")

            # Update machine status if high/critical
            if anom["severity"] in ["high", "critical"]:
                self.db.machines.update_one(
                    {"machineId": anom["machineId"]},
                    {"$set": {"status": "Critical" if anom["severity"] == "critical" else "Warning"}}
                )

                # Auto-generate maintenance ticket for high/critical anomalies
                self.auto_create_ticket(anom, anomaly_id)

        return flagged

    def auto_create_ticket(self, anomaly, anomaly_id):
        """Auto-create ticket if there isn't already an open ticket for this machine and sensor"""
        existing_ticket = self.db.tickets.find_one({
            "machineId": anomaly["machineId"],
            "status": {"$in": ["Open", "In Progress"]}
        })

        if existing_ticket:
            # Append note to existing ticket
            self.db.tickets.update_one(
                {"_id": existing_ticket["_id"]},
                {"$push": {"notes": f"[{datetime.now().strftime('%H:%M:%S')}] Follow-up alert: {anomaly['explanation']}"}}
            )
            return

        ticket_count = self.db.tickets.count_documents({})
        ticket_id = f"WO-{ticket_count + 1:04d}"
        priority = "CRITICAL" if anomaly["severity"] == "critical" else "HIGH"

        new_ticket = {
            "ticketId": ticket_id,
            "machineId": anomaly["machineId"],
            "title": f"Auto-Generated Alert Response: {anomaly['sensor'].capitalize()} Anomaly",
            "description": anomaly["explanation"],
            "anomalyId": anomaly_id,
            "assignedTo": "Unassigned",
            "status": "OPEN",
            "priority": priority,
            "progress": 0,
            "notes": [f"Auto-generated by PredictaMaint Anomaly Engine: {anomaly['explanation']}"],
            "activityTimeline": [
                {
                    "timestamp": datetime.now(timezone.utc),
                    "action": "Work Order Auto-Generated",
                    "user": "PredictaMaint AI Anomaly Engine",
                    "role": "SYSTEM",
                    "note": f"Triggered by {anomaly['severity']} {anomaly['sensor']} reading ({anomaly.get('score', 0)}σ)"
                }
            ],
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        self.db.tickets.insert_one(new_ticket)
        print(f"[AnomalyEngine] 🎫 Created Maintenance Ticket {ticket_id} for {anomaly['machineId']} [Priority: {priority}]")

    def run_cycle(self):
        """Run single detection sweep across all machines in MongoDB"""
        machines = list(self.db.machines.find({}, {"machineId": 1}))
        if not machines:
            # Fallback to distinct machineIds in telemetry collection
            machine_ids = self.db.telemetry.distinct("machineId")
        else:
            machine_ids = [m["machineId"] for m in machines]

        detected_count = 0
        for m_id in machine_ids:
            anomalies = self.process_machine(m_id)
            detected_count += len(anomalies)

        return detected_count

    def run(self, interval=5, cycles=None):
        print("=" * 65)
        print("🧠 PredictaMaint Statistical Anomaly Detection Engine Started")
        print(f"📊 Rolling Z-score & Physical Threshold Analysis at {interval}s interval")
        print("=" * 65)
        
        step = 0
        try:
            while True:
                step += 1
                found = self.run_cycle()
                ts_str = datetime.now().strftime("%H:%M:%S")
                if found > 0:
                    print(f"[{ts_str}] Cycle {step}: {found} new anomalies identified and stored.")
                
                if cycles and step >= cycles:
                    print(f"[AnomalyEngine] Completed {cycles} analysis cycles.")
                    break
                    
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[AnomalyEngine] Stopped by user.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PredictaMaint Anomaly Detection Engine")
    parser.add_argument("--interval", type=int, default=5, help="Analysis cycle interval in seconds (default: 5)")
    parser.add_argument("--cycles", type=int, default=None, help="Number of cycles to run")
    args = parser.parse_args()

    engine = AnomalyEngine()
    engine.run(interval=args.interval, cycles=args.cycles)
