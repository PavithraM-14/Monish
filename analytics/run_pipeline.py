"""
PredictaMaint - Unified Pipeline Runner
Runs the Telemetry Simulator, Anomaly Engine, and RUL Estimator concurrently
in coordinated background threads with a single command.
Ideal for viva demonstration and testing!
"""

import time
import threading
import sys

# Configure stdout for Windows console UTF-8 compatibility
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from simulate_telemetry import TelemetrySimulator
from anomaly_engine import AnomalyEngine
from rul_estimator import RULEstimator

def run_simulator():
    sim = TelemetrySimulator()
    sim.run(interval=4)

def run_anomaly():
    time.sleep(2) # Let simulator seed first readings
    engine = AnomalyEngine()
    engine.run(interval=5)

def run_rul():
    time.sleep(4)
    estimator = RULEstimator()
    estimator.run(interval=8)

if __name__ == "__main__":
    print("=" * 65)
    print("🏭 PREDICTAMAINT UNIFIED ANALYTICS & SIMULATION PIPELINE")
    print("Starting Telemetry Streamer, Statistical Anomaly Engine & RUL Estimator...")
    print("=" * 65)

    t1 = threading.Thread(target=run_simulator, daemon=True)
    t2 = threading.Thread(target=run_anomaly, daemon=True)
    t3 = threading.Thread(target=run_rul, daemon=True)

    t1.start()
    t2.start()
    t3.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Pipeline] Shutting down unified analytics pipeline.")
        sys.exit(0)
