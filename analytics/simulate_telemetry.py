"""
PredictaMaint - Industrial Sensor Telemetry Simulator
Simulates multi-sensor streaming telemetry for a fleet of manufacturing machines.
Sensors: vibration (mm/s), temperature (°C), current (A), pressure (bar), rpm.
Supports normal operational noise, gradual wear trends, and dynamic anomaly injection.
Outputs to MongoDB time-series collection and/or Express ingestion API.
"""

import os
import sys
import time
import math
import random
import argparse
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

# Configure stdout for Windows console UTF-8 compatibility
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'server', '.env'))
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/predictamaint")
API_URL = os.getenv("API_URL", "http://localhost:5000/api/telemetry")

# Fleet specifications with realistic baseline physical operating ranges
FLEET_SPEC = [
    {
        "machineId": "MCH-001",
        "name": "CNC Milling Center Alpha",
        "type": "CNC Milling",
        "location": "Bay 1 - Precision Machining",
        "base": {"vibration": 2.2, "temperature": 52.0, "current": 14.5, "pressure": 6.2, "rpm": 3200},
        "variance": {"vibration": 0.25, "temperature": 1.5, "current": 0.8, "pressure": 0.2, "rpm": 40},
        "thresholds": {"vibration": 4.5, "temperature": 75.0, "current": 22.0, "pressure": 8.5}
    },
    {
        "machineId": "MCH-002",
        "name": "Hydraulic Stamping Press 500T",
        "type": "Hydraulic Press",
        "location": "Bay 2 - Heavy Forming",
        "base": {"vibration": 3.4, "temperature": 64.0, "current": 28.0, "pressure": 180.0, "rpm": 920},
        "variance": {"vibration": 0.35, "temperature": 2.0, "current": 1.5, "pressure": 5.0, "rpm": 25},
        "thresholds": {"vibration": 6.0, "temperature": 85.0, "current": 40.0, "pressure": 220.0}
    },
    {
        "machineId": "MCH-003",
        "name": "Centrifugal Slurry Pump C-3",
        "type": "Centrifugal Pump",
        "location": "Bay 3 - Fluid Systems",
        "base": {"vibration": 3.8, "temperature": 58.0, "current": 17.5, "pressure": 4.5, "rpm": 1750},
        "variance": {"vibration": 0.4, "temperature": 1.8, "current": 1.0, "pressure": 0.3, "rpm": 30},
        "thresholds": {"vibration": 5.8, "temperature": 78.0, "current": 25.0, "pressure": 6.5}
    },
    {
        "machineId": "MCH-004",
        "name": "Rotary Screw Compressor RC-1",
        "type": "Rotary Compressor",
        "location": "Utility Plant Room",
        "base": {"vibration": 2.9, "temperature": 82.0, "current": 21.5, "pressure": 8.2, "rpm": 2980},
        "variance": {"vibration": 0.3, "temperature": 2.2, "current": 1.2, "pressure": 0.4, "rpm": 35},
        "thresholds": {"vibration": 5.2, "temperature": 98.0, "current": 30.0, "pressure": 10.5}
    },
    {
        "machineId": "MCH-005",
        "name": "6-Axis Robotic Welder R-6",
        "type": "Robotic Arm",
        "location": "Assembly Line 4",
        "base": {"vibration": 1.4, "temperature": 43.0, "current": 8.5, "pressure": 5.0, "rpm": 1400},
        "variance": {"vibration": 0.15, "temperature": 1.0, "current": 0.6, "pressure": 0.15, "rpm": 20},
        "thresholds": {"vibration": 3.2, "temperature": 65.0, "current": 15.0, "pressure": 7.0}
    },
    {
        "machineId": "MCH-006",
        "name": "Heavy Conveyor Drive CV-12",
        "type": "Belt Conveyor",
        "location": "Logistics & Dispatch",
        "base": {"vibration": 2.1, "temperature": 47.0, "current": 11.0, "pressure": 3.0, "rpm": 1180},
        "variance": {"vibration": 0.2, "temperature": 1.2, "current": 0.7, "pressure": 0.1, "rpm": 15},
        "thresholds": {"vibration": 4.0, "temperature": 70.0, "current": 18.0, "pressure": 4.5}
    },
    {
        "machineId": "MCH-007",
        "name": "Injection Molding Press 250T",
        "type": "Injection Molder",
        "location": "Bay 4 - Plastics Line",
        "base": {"vibration": 2.6, "temperature": 190.0, "current": 32.0, "pressure": 135.0, "rpm": 1780},
        "variance": {"vibration": 0.3, "temperature": 3.0, "current": 1.8, "pressure": 4.0, "rpm": 25},
        "thresholds": {"vibration": 4.8, "temperature": 218.0, "current": 45.0, "pressure": 165.0}
    },
    {
        "machineId": "MCH-008",
        "name": "Industrial Exhaust Blower EB-4",
        "type": "Exhaust Blower",
        "location": "Roof Deck Ventilation",
        "base": {"vibration": 3.1, "temperature": 54.0, "current": 15.2, "pressure": 2.0, "rpm": 2220},
        "variance": {"vibration": 0.3, "temperature": 1.6, "current": 0.9, "pressure": 0.1, "rpm": 30},
        "thresholds": {"vibration": 5.0, "temperature": 76.0, "current": 24.0, "pressure": 3.2}
    }
]

# Fault scenarios for demonstration
FAULT_MODES = {
    "bearing_fault": {
        "description": "Bearing spall & inner race wear inducing severe vibration spikes",
        "sensor": "vibration",
        "multiplier": 2.3,
        "rpm_mod": -80
    },
    "overheating": {
        "description": "Cooling jacket blockage causing rapid thermal accumulation",
        "sensor": "temperature",
        "multiplier": 1.45,
        "current_mod": 4.5
    },
    "motor_overload": {
        "description": "Mechanical binding or motor phase imbalance driving excessive current draw",
        "sensor": "current",
        "multiplier": 1.75,
        "temp_mod": 12.0
    },
    "hydraulic_leak": {
        "description": "Seal blowout or pump cavitation causing pressure drop and erratic ripple",
        "sensor": "pressure",
        "multiplier": 0.45,
        "vib_mod": 1.5
    },
    "pressure_surge": {
        "description": "Discharge valve constriction triggering abnormal pressure buildup",
        "sensor": "pressure",
        "multiplier": 1.55,
        "current_mod": 5.0
    }
}

class TelemetrySimulator:
    def __init__(self, use_api=False):
        self.use_api = use_api
        self.step = 0
        self.active_faults = {}  # { machineId: { mode: "...", remaining: int } }
        self.mongo_client = None
        self.db = None
        
        # Connect to Mongo if not using HTTP API exclusively
        try:
            self.mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
            self.mongo_client.server_info()
            self.db = self.mongo_client.get_database()
            print(f"[Simulator] Connected directly to MongoDB at {MONGO_URI}")
        except Exception as e:
            print(f"[Simulator] MongoDB direct connection unavailable: {e}. Defaulting to HTTP API endpoint.")
            self.use_api = True

    def inject_fault(self, machine_id, fault_mode, duration_cycles=15):
        if fault_mode in FAULT_MODES:
            self.active_faults[machine_id] = {
                "mode": fault_mode,
                "remaining": duration_cycles,
                "info": FAULT_MODES[fault_mode]
            }
            print(f"[Simulator] ⚠️ INJECTED FAULT on {machine_id}: {fault_mode} ({FAULT_MODES[fault_mode]['description']}) for {duration_cycles} cycles")

    def generate_reading(self, spec):
        m_id = spec["machineId"]
        base = spec["base"]
        var = spec["variance"]
        
        # Sine wave modulation for cyclical factory shifts
        wave = math.sin(self.step / 10.0) * 0.05
        
        # Base gaussian readings
        vib = max(0.1, random.gauss(base["vibration"] * (1 + wave), var["vibration"]))
        temp = max(15.0, random.gauss(base["temperature"] * (1 + wave * 0.5), var["temperature"]))
        curr = max(0.5, random.gauss(base["current"] * (1 + wave), var["current"]))
        press = max(0.1, random.gauss(base["pressure"], var["pressure"]))
        rpm = max(100.0, random.gauss(base["rpm"], var["rpm"]))
        
        # Apply active fault if present
        if m_id in self.active_faults:
            fault = self.active_faults[m_id]
            mode = fault["mode"]
            fault_def = FAULT_MODES[mode]
            
            if fault_def["sensor"] == "vibration":
                vib *= fault_def["multiplier"] + random.uniform(0.1, 0.4)
                if "rpm_mod" in fault_def:
                    rpm += fault_def["rpm_mod"]
            elif fault_def["sensor"] == "temperature":
                temp *= fault_def["multiplier"] + random.uniform(0.02, 0.08)
                if "current_mod" in fault_def:
                    curr += fault_def["current_mod"]
            elif fault_def["sensor"] == "current":
                curr *= fault_def["multiplier"]
                if "temp_mod" in fault_def:
                    temp += fault_def["temp_mod"]
            elif fault_def["sensor"] == "pressure":
                press *= fault_def["multiplier"]
                if "vib_mod" in fault_def:
                    vib += fault_def["vib_mod"]
                if "current_mod" in fault_def:
                    curr += fault_def["current_mod"]
            
            fault["remaining"] -= 1
            if fault["remaining"] <= 0:
                print(f"[Simulator] Fault resolved/cleared on {m_id} ({mode})")
                del self.active_faults[m_id]

        # Occasionally (every 25-40 steps) randomly inject a transient fault on one machine for realistic demo
        elif self.step > 5 and random.random() < 0.04 and len(self.active_faults) == 0:
            chosen_fault = random.choice(list(FAULT_MODES.keys()))
            self.inject_fault(m_id, chosen_fault, duration_cycles=random.randint(8, 16))

        reading = {
            "machineId": m_id,
            "timestamp": datetime.now(timezone.utc),
            "vibration": round(float(vib), 3),
            "temperature": round(float(temp), 2),
            "current": round(float(curr), 2),
            "pressure": round(float(press), 2),
            "rpm": round(float(rpm), 1)
        }
        return reading

    def send_batch(self, readings):
        # Format for Mongo insertion
        if not self.use_api and self.db is not None:
            try:
                self.db.telemetry.insert_many(readings)
                return True
            except Exception as e:
                print(f"[Simulator] Direct Mongo insert failed: {e}. Falling back to API.")

        # HTTP API Fallback / Ingestion Endpoint
        try:
            payload = []
            for r in readings:
                item = dict(r)
                if isinstance(item["timestamp"], datetime):
                    item["timestamp"] = item["timestamp"].isoformat()
                payload.append(item)
                
            res = requests.post(f"{API_URL}/batch", json={"readings": payload}, timeout=3)
            return res.status_code in (200, 201)
        except Exception as e:
            print(f"[Simulator] HTTP API post error: {e}")
            return False

    def run(self, interval=5, cycles=None):
        print("=" * 65)
        print("🚀 PredictaMaint Fleet Telemetry Simulator Started")
        print(f"📡 Simulating {len(FLEET_SPEC)} machines at {interval}s interval")
        print(f"🎯 Target: {'HTTP API (' + API_URL + ')' if self.use_api else 'MongoDB Direct + Ingestion API'}")
        print("=" * 65)
        
        # For initial demonstration, inject an initial developing bearing fault on MCH-003
        self.inject_fault("MCH-003", "bearing_fault", duration_cycles=12)

        cycle_count = 0
        try:
            while True:
                self.step += 1
                cycle_count += 1
                readings = [self.generate_reading(spec) for spec in FLEET_SPEC]
                
                success = self.send_batch(readings)
                ts_str = datetime.now().strftime("%H:%M:%S")
                status_icon = "🟢" if success else "🔴"
                
                # Show sample reading in log
                sample = readings[2] # MCH-003
                fault_tag = " [FAULT ACTIVE]" if "MCH-003" in self.active_faults else ""
                print(f"[{ts_str}] Cycle {self.step:04d} {status_icon} Generated {len(readings)} readings | MCH-003: Vib={sample['vibration']}mm/s, Temp={sample['temperature']}°C, Curr={sample['current']}A{fault_tag}")
                
                if cycles and cycle_count >= cycles:
                    print(f"[Simulator] Reached requested limit of {cycles} cycles. Completed.")
                    break
                    
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n[Simulator] Stopped by user.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PredictaMaint Telemetry Simulator")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between telemetry bursts (default: 5)")
    parser.add_argument("--cycles", type=int, default=None, help="Number of cycles to run (default: infinite)")
    parser.add_argument("--api-only", action="store_true", help="Force posting to Express HTTP API instead of Mongo")
    parser.add_argument("--inject", type=str, nargs=2, metavar=("MACHINE_ID", "FAULT_MODE"), 
                        help="Inject specific fault, e.g. --inject MCH-001 bearing_fault")
    args = parser.parse_args()

    simulator = TelemetrySimulator(use_api=args.api_only)
    if args.inject:
        simulator.inject_fault(args.inject[0], args.inject[1], duration_cycles=20)
    simulator.run(interval=args.interval, cycles=args.cycles)
