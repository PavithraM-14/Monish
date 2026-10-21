import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    user: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'ENGINEER', 'admin', 'engineer', 'SYSTEM'],
      default: 'ENGINEER',
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['WORK_ORDER', 'ISSUE', 'ANOMALY', 'MACHINE', 'SYSTEM'],
      default: 'WORK_ORDER',
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
