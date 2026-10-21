"""
PredictaMaint - Remaining Useful Life (RUL) & Health Degradation Estimator
Estimates component degradation velocity and predicts Remaining Useful Life (hours)
for each machine in the manufacturing fleet.
Updates machine documents directly in MongoDB with:
- rulHours: Remaining operating hours before threshold breach
- healthScore: 0-100 composite health index
- riskLevel: Low, Moderate, Elevated, Critical
- primaryDegradingSensor: Sensor showing highest wear acceleration
"""

import os
import sys
import time
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

class RULEstimator:
    def __init__(self, mongo_uri=MONGO_URI):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.get_database()
        print(f"[RULEstimator] Connected to MongoDB database: {self.db.name}")

    def calculate_machine_rul(self, machine):
        m_id = machine["machineId"]
        thresholds = machine.get("thresholds", {
            "vibration": 5.0,
            "temperature": 80.0,
            "current": 25.0,
            "pressure": 10.0
        })

        # Base nominal operating lifespan by machine type (in operating hours)
        type_base_rul = {
            "CNC Milling": 4500,
            "Hydraulic Press": 5200,
            "Centrifugal Pump": 3800,
            "Rotary Compressor": 4200,
            "Robotic Arm": 6000,
            "Belt Conveyor": 4800,
            "Injection Molder": 5000,
            "Exhaust Blower": 5500
        }
        nominal_rul = type_base_rul.get(machine.get("type"), 4500)

        # 1. Fetch recent telemetry (last 50 readings)
        cursor = self.db.telemetry.find({"machineId": m_id}).sort("timestamp", -1).limit(50)
        readings = list(cursor)
        
        if not readings:
            # No data yet: default to nominal healthy
            return {
                "rulHours": nominal_rul,
                "healthScore": 100,
                "riskLevel": "Low",
                "primaryDegradingSensor": "None",
                "lastEstimated": datetime.now(timezone.utc)
            }

        readings.reverse()
        df = pd.DataFrame(readings)

        # 2. Check active & recent anomalies for this machine
        recent_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        anomalies_count = self.db.anomalies.count_documents({
            "machineId": m_id,
            "timestamp": {"$gte": recent_cutoff}
        })
        critical_count = self.db.anomalies.count_documents({
            "machineId": m_id,
            "severity": "critical",
            "timestamp": {"$gte": recent_cutoff}
        })
        high_count = self.db.anomalies.count_documents({
            "machineId": m_id,
            "severity": "high",
            "timestamp": {"$gte": recent_cutoff}
        })

        # 3. Analyze sensor degradation ratios and slopes
        sensor_stresses = {}
        for sensor in ["vibration", "temperature", "current", "pressure"]:
            if sensor in df.columns and sensor in thresholds:
                curr_mean = df[sensor].tail(10).mean()
                thresh = float(thresholds[sensor])
                # Stress ratio: 1.0 means at threshold limit
                ratio = curr_mean / thresh if thresh > 0 else 0.5
                sensor_stresses[sensor] = ratio

        # Determine primary degrading sensor
        primary_sensor = max(sensor_stresses, key=sensor_stresses.get) if sensor_stresses else "vibration"
        max_stress = sensor_stresses.get(primary_sensor, 0.5)

        # 4. Compute Health Score (0 - 100)
        # Deductions:
        # - Exceeding 70% threshold starts reducing score
        # - Each critical anomaly penalizes 25 points
        # - Each high anomaly penalizes 12 points
        # - Each medium/low anomaly penalizes 3 points
        penalty = 0.0
        if max_stress > 0.7:
            penalty += (max_stress - 0.7) * 90.0

        penalty += (critical_count * 22.0)
        penalty += (high_count * 10.0)
        penalty += (max(0, anomalies_count - critical_count - high_count) * 2.5)

        health_score = max(5.0, min(100.0, 100.0 - penalty))
        health_score = round(health_score, 1)

        # 5. Compute RUL Hours
        # Non-linear degradation curve:
        # RUL scales proportionally with health score
        rul_factor = (health_score / 100.0) ** 1.35
        rul_hours = int(nominal_rul * rul_factor)

        # Cap minimum realistic RUL if in critical state
        if critical_count > 0 or max_stress > 1.15:
            rul_hours = min(rul_hours, int(nominal_rul * 0.08)) # Less than 8% lifespan remaining (~300h)

        # Assign Risk Level
        if health_score >= 85:
            risk_level = "Low"
        elif health_score >= 65:
            risk_level = "Moderate"
        elif health_score >= 40:
            risk_level = "Elevated"
        else:
            risk_level = "Critical"

        return {
            "rulHours": rul_hours,
            "healthScore": health_score,
            "riskLevel": risk_level,
            "primaryDegradingSensor": primary_sensor,
            "lastEstimated": datetime.now(timezone.utc)
        }

    def run_cycle(self):
        """Update RUL metrics for all machines in database"""
        machines = list(self.db.machines.find({}))
        if not machines:
            return 0

        updated = 0
        for mach in machines:
            m_id = mach["machineId"]
            metrics = self.calculate_machine_rul(mach)
            
            # Update machine document with RUL and Health Score
            self.db.machines.update_one(
                {"_id": mach["_id"]},
                {
                    "$set": {
                        "rul": metrics["rulHours"],
                        "healthScore": metrics["healthScore"],
                        "riskLevel": metrics["riskLevel"],
                        "primaryDegradingSensor": metrics["primaryDegradingSensor"],
                        "lastRulEvaluation": metrics["lastEstimated"]
                    }
                }
            )
            updated += 1

        return updated

    def run(self, interval=10, cycles=None):
        print("=" * 65)
        print("⏱️ PredictaMaint Remaining Useful Life (RUL) Estimator Started")
        print(f"🔬 Multi-sensor degradation & stress decay analysis every {interval}s")
        print("=" * 65)

        step = 0
        try:
            while True:
                step += 1
                updated = self.run_cycle()
                ts_str = datetime.now().strftime("%H:%M:%S")
                print(f"[{ts_str}] Cycle {step}: Updated RUL & Health Index for {updated} fleet units.")

                if cycles and step >= cycles:
                    print(f"[RULEstimator] Completed {cycles} estimation cycles.")
                    break

                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[RULEstimator] Stopped by user.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PredictaMaint RUL Estimator")
    parser.add_argument("--interval", type=int, default=10, help="Estimation interval in seconds (default: 10)")
    parser.add_argument("--cycles", type=int, default=None, help="Number of cycles to run")
    args = parser.parse_args()

    estimator = RULEstimator()
    estimator.run(interval=args.interval, cycles=args.cycles)
