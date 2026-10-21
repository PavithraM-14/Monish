import mongoose from 'mongoose';

const issueIntimationSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    reportedBy: {
      type: String,
      required: true,
    },
    reportedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issueType: {
      type: String,
      required: true,
      enum: [
        'Mechanical Failure',
        'Electrical & Wiring',
        'Thermal Overheating',
        'Hydraulic / Pressure Leak',
        'Sensor Drift / Malfunction',
        'Bearing Wear & Vibration',
        'Lubrication Required',
        'Motor Stator Overload',
        'Other',
      ],
      default: 'Mechanical Failure',
    },
    severity: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'Low', 'Medium', 'High', 'Critical'],
      default: 'MEDIUM',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    observedSymptoms: {
      type: String,
      default: '',
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['REPORTED', 'ACKNOWLEDGED', 'CONVERTED_TO_WORK_ORDER', 'RESOLVED'],
      default: 'REPORTED',
      index: true,
    },
    workOrderId: {
      type: String,
      default: null,
    },
    acknowledgedBy: {
      type: String,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const IssueIntimation = mongoose.model('IssueIntimation', issueIntimationSchema);
export default IssueIntimation;
