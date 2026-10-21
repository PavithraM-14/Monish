import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    installDate: {
      type: Date,
      default: Date.now,
    },
    thresholds: {
      vibration: { type: Number, default: 5.0 }, // mm/s
      temperature: { type: Number, default: 80.0 }, // °C
      current: { type: Number, default: 25.0 }, // A
      pressure: { type: Number, default: 10.0 }, // bar
    },
    status: {
      type: String,
      enum: ['Optimal', 'Warning', 'Critical', 'Offline'],
      default: 'Optimal',
    },
    rul: {
      type: Number, // Remaining useful life in operating hours
      default: 4500,
    },
    healthScore: {
      type: Number, // 0 - 100%
      default: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'Elevated', 'Critical'],
      default: 'Low',
    },
    primaryDegradingSensor: {
      type: String,
      default: 'None',
    },
    lastRulEvaluation: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Machine = mongoose.model('Machine', machineSchema);
export default Machine;
