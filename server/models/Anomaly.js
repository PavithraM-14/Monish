import mongoose from 'mongoose';

const anomalySchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    sensor: {
      type: String,
      required: true,
      enum: ['vibration', 'temperature', 'current', 'pressure', 'rpm', 'general'],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    score: {
      type: Number, // Z-score or anomaly confidence
      required: true,
    },
    value: {
      type: Number,
    },
    mean: {
      type: Number,
    },
    threshold: {
      type: Number,
    },
    explanation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'resolved'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Anomaly = mongoose.model('Anomaly', anomalySchema);
export default Anomaly;
