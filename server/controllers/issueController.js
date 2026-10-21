import IssueIntimation from '../models/IssueIntimation.js';
import Ticket from '../models/Ticket.js';
import Machine from '../models/Machine.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

export const getIssues = async (req, res) => {
  try {
    const { machineId, status, severity, reportedBy } = req.query;
    const filter = {};

    if (machineId && machineId !== 'all') filter.machineId = machineId;
    if (status && status !== 'all') {
      if (status === 'CONVERTED_TO_WO' || status === 'CONVERTED_TO_WORK_ORDER') {
        filter.status = { $in: ['CONVERTED_TO_WO', 'CONVERTED_TO_WORK_ORDER'] };
      } else {
        filter.status = status;
      }
    }
    if (severity && severity !== 'all') filter.severity = severity.toUpperCase();
    if (reportedBy && reportedBy !== 'all') filter.reportedBy = reportedBy;

    const issues = await IssueIntimation.find(filter).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await IssueIntimation.findOne({
      $or: [{ issueId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!issue) return res.status(404).json({ error: 'Issue intimation not found' });
    const machine = await Machine.findOne({ machineId: issue.machineId });

    res.json({ issue, machine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createIssue = async (req, res) => {
  try {
    const {
      machineId,
      issueType,
      severity,
      description,
      observedSymptoms,
      recommendedAction,
    } = req.body;

    if (!machineId || !description) {
      return res.status(400).json({ error: 'machineId and description are required' });
    }

    const count = await IssueIntimation.countDocuments();
    const issueId = `ISS-${String(count + 1).padStart(4, '0')}`;

    const issue = new IssueIntimation({
      issueId,
      machineId,
      reportedBy: req.user.name,
      reportedById: req.user._id,
      issueType: issueType || 'Mechanical Failure',
      severity: severity ? severity.toUpperCase() : 'MEDIUM',
      description,
      observedSymptoms: observedSymptoms || '',
      recommendedAction: recommendedAction || '',
      status: 'REPORTED',
    });

    await issue.save();

    await Activity.create({
      user: req.user.name,
      userId: req.user._id,
      role: (req.user.role || 'ENGINEER').toUpperCase(),
      action: `Reported Issue ${issueId} on ${machineId}`,
      entityType: 'ISSUE',
      entityId: issueId,
      details: `${issueType} (${severity || 'MEDIUM'}): ${description.substring(0, 100)}`,
      timestamp: new Date(),
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const acknowledgeIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await IssueIntimation.findOne({
      $or: [{ issueId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    issue.status = 'ACKNOWLEDGED';
    issue.acknowledgedBy = req.user.name;
    issue.acknowledgedAt = new Date();
    await issue.save();

    await Activity.create({
      user: req.user.name,
      userId: req.user._id,
      role: 'ADMIN',
      action: `Acknowledged Issue ${issue.issueId}`,
      entityType: 'ISSUE',
      entityId: issue.issueId,
      details: `Acknowledged report for ${issue.machineId}`,
      timestamp: new Date(),
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const convertToWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToId, adminInstructions, priority, dueDate } = req.body;

    const issue = await IssueIntimation.findOne({
      $or: [{ issueId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Generate Work Order
    const count = await Ticket.countDocuments();
    const ticketId = `WO-${String(count + 1).padStart(4, '0')}`;

    let resolvedAssignedTo = assignedTo || issue.reportedBy;
    let resolvedAssignedToId = assignedToId || issue.reportedById;
    let resolvedAssignedToEmail = '';

    if (assignedToId) {
      const eng = await User.findById(assignedToId);
      if (eng) {
        resolvedAssignedTo = eng.name;
        resolvedAssignedToEmail = eng.email;
      }
    }

    const ticket = new Ticket({
      ticketId,
      machineId: issue.machineId,
      title: `[Issue Report ${issue.issueId}] ${issue.issueType}`,
      description: `${issue.description}\n\nSymptoms: ${issue.observedSymptoms}\nRecommendation: ${issue.recommendedAction}`,
      assignedTo: resolvedAssignedTo,
      assignedToId: resolvedAssignedToId,
      assignedToEmail: resolvedAssignedToEmail,
      priority: priority ? priority.toUpperCase() : issue.severity,
      status: resolvedAssignedTo !== 'Unassigned' ? 'ASSIGNED' : 'OPEN',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 48 * 60 * 60 * 1000),
      adminInstructions: adminInstructions || `Dispatched from Issue Intimation ${issue.issueId}`,
      issueId: issue.issueId,
      notes: [`Converted from Issue Intimation ${issue.issueId} by ${req.user.name}`],
      activityTimeline: [
        {
          timestamp: new Date(),
          action: 'Work Order Created from Issue Intimation',
          user: req.user.name,
          role: 'ADMIN',
          note: `Dispatched from ${issue.issueId} and assigned to ${resolvedAssignedTo}`,
        },
      ],
    });

    await ticket.save();

    issue.status = 'CONVERTED_TO_WORK_ORDER';
    issue.workOrderId = ticketId;
    await issue.save();

    await Activity.create({
      user: req.user.name,
      userId: req.user._id,
      role: 'ADMIN',
      action: `Converted Issue ${issue.issueId} to ${ticketId}`,
      entityType: 'WORK_ORDER',
      entityId: ticketId,
      details: `Generated work order ${ticketId} assigned to ${resolvedAssignedTo}`,
      timestamp: new Date(),
    });

    res.json({ issue, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const issue = await IssueIntimation.findOne({
      $or: [{ issueId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    issue.status = 'RESOLVED';
    issue.resolvedAt = new Date();
    if (note) issue.notes.push(note);
    await issue.save();

    await Activity.create({
      user: req.user.name,
      userId: req.user._id,
      role: 'ADMIN',
      action: `Resolved Issue ${issue.issueId}`,
      entityType: 'ISSUE',
      entityId: issue.issueId,
      details: `Marked issue as resolved: ${note || 'Inspection verified'}`,
      timestamp: new Date(),
    });

    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
