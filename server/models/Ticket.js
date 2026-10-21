import mongoose from 'mongoose';

const activityTimelineItemSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'USER',
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
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
    title: {
      type: String,
      default: 'Machine Preventive Maintenance Work Order',
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
      index: true,
    },
    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedToEmail: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'TESTING',
        'RESOLUTION_SUBMITTED',
        'REWORK',
        'APPROVED',
        'CLOSED',
        // Also support legacy for backwards compatibility
        'Open',
        'In Progress',
        'Resolved',
      ],
      default: 'OPEN',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'Low', 'Medium', 'High', 'Critical'],
      default: 'MEDIUM',
      index: true,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Default 48h
    },
    adminInstructions: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    findings: {
      type: String,
      default: '',
    },
    resolution: {
      type: String,
      default: '',
    },
    notes: {
      type: [String],
      default: [],
    },
    activityTimeline: {
      type: [activityTimelineItemSchema],
      default: [],
    },
    anomalyId: {
      type: String,
      default: null,
    },
    issueId: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
