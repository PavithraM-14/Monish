import Ticket from '../models/Ticket.js';
import Machine from '../models/Machine.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';

// Helper to log activities
async function logActivity(user, action, entityId, details, entityType = 'WORK_ORDER') {
  try {
    await Activity.create({
      user: user.name,
      userId: user._id,
      role: (user.role || 'ENGINEER').toUpperCase(),
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

export const getTickets = async (req, res) => {
  try {
    const { machineId, status, priority, assignedTo, search, myOrders, dueToday } = req.query;
    const filter = {};

    if (machineId && machineId !== 'all') {
      filter.machineId = machineId;
    }

    if (status && status !== 'all') {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        filter.status = status;
      }
    }

    if (priority && priority !== 'all') {
      filter.priority = { $regex: new RegExp(`^${priority}$`, 'i') };
    }

    // Role-based filtering or myOrders query
    const userRole = (req.user?.role || '').toUpperCase();
    if (myOrders === 'true' || userRole === 'ENGINEER') {
      // If user is engineer and specifically viewing their queue
      if (userRole === 'ENGINEER' && req.query.all !== 'true') {
        filter.$or = [
          { assignedTo: req.user.name },
          { assignedToId: req.user._id },
          { assignedToEmail: req.user.email },
        ];
      }
    } else if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo;
    }

    if (dueToday === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      filter.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search) {
      filter.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { machineId: { $regex: search, $options: 'i' } },
        { assignedTo: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const machine = await Machine.findOne({ machineId: ticket.machineId });
    res.json({ ticket, machine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const {
      machineId,
      title,
      description,
      assignedTo,
      assignedToId,
      priority,
      dueDate,
      adminInstructions,
      anomalyId,
      issueId,
      note,
    } = req.body;

    if (!machineId) {
      return res.status(400).json({ error: 'machineId is required' });
    }

    // Auto-generate WO-0001 format
    const count = await Ticket.countDocuments();
    const ticketId = `WO-${String(count + 1).padStart(4, '0')}`;

    let resolvedAssignedTo = assignedTo || 'Unassigned';
    let resolvedAssignedToId = assignedToId || null;
    let resolvedAssignedToEmail = '';

    if (assignedToId) {
      const engineer = await User.findById(assignedToId);
      if (engineer) {
        resolvedAssignedTo = engineer.name;
        resolvedAssignedToEmail = engineer.email;
      }
    } else if (assignedTo && assignedTo !== 'Unassigned') {
      const engineer = await User.findOne({ name: assignedTo });
      if (engineer) {
        resolvedAssignedToId = engineer._id;
        resolvedAssignedToEmail = engineer.email;
      }
    }

    const initialStatus = resolvedAssignedTo !== 'Unassigned' ? 'ASSIGNED' : 'OPEN';
    const notesList = [];
    if (note) notesList.push(`[${new Date().toISOString().substring(11, 19)}] ${note}`);

    const timelineItem = {
      timestamp: new Date(),
      action: 'Work Order Created',
      user: req.user.name,
      role: req.user.role,
      note: `Created and assigned to ${resolvedAssignedTo}`,
    };

    const ticket = new Ticket({
      ticketId,
      machineId,
      title: title || `Preventive Maintenance on ${machineId}`,
      description: description || '',
      assignedTo: resolvedAssignedTo,
      assignedToId: resolvedAssignedToId,
      assignedToEmail: resolvedAssignedToEmail,
      status: initialStatus,
      priority: priority ? priority.toUpperCase() : 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 48 * 60 * 60 * 1000),
      adminInstructions: adminInstructions || '',
      progress: 0,
      notes: notesList,
      activityTimeline: [timelineItem],
      anomalyId: anomalyId || null,
      issueId: issueId || null,
    });

    await ticket.save();

    // Increment activeOrdersCount on User if assigned
    if (resolvedAssignedToId) {
      await User.findByIdAndUpdate(resolvedAssignedToId, { $inc: { activeOrdersCount: 1 } });
    }

    await logActivity(
      req.user,
      `Created Work Order ${ticketId}`,
      ticketId,
      `Assigned to ${resolvedAssignedTo} for machine ${machineId}`
    );

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, adminInstructions, note } = req.body;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    if (title) ticket.title = title;
    if (description !== undefined) ticket.description = description;
    if (priority) ticket.priority = priority.toUpperCase();
    if (dueDate) ticket.dueDate = new Date(dueDate);
    if (adminInstructions !== undefined) ticket.adminInstructions = adminInstructions;

    if (note) {
      ticket.notes.push(`[${new Date().toLocaleTimeString()} by ${req.user.name}] ${note}`);
      ticket.activityTimeline.push({
        timestamp: new Date(),
        action: 'Note Added',
        user: req.user.name,
        role: req.user.role,
        note,
      });
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== WORK ORDER LIFECYCLE ACTIONS ====================

// 1. ASSIGN (Admin)
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedToId, adminInstructions } = req.body;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    let engineerName = assignedTo;
    let engineerId = assignedToId;
    let engineerEmail = '';

    if (assignedToId) {
      const eng = await User.findById(assignedToId);
      if (eng) {
        engineerName = eng.name;
        engineerEmail = eng.email;
      }
    } else if (assignedTo) {
      const eng = await User.findOne({ name: assignedTo });
      if (eng) {
        engineerId = eng._id;
        engineerEmail = eng.email;
      }
    }

    ticket.assignedTo = engineerName;
    ticket.assignedToId = engineerId;
    ticket.assignedToEmail = engineerEmail;
    ticket.status = 'ASSIGNED';
    if (adminInstructions) ticket.adminInstructions = adminInstructions;

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Work Order Assigned',
      user: req.user.name,
      role: req.user.role,
      note: `Assigned to ${engineerName}. Instructions: ${adminInstructions || 'None'}`,
    });

    await ticket.save();
    await logActivity(req.user, `Assigned ${ticket.ticketId}`, ticket.ticketId, `Assigned to ${engineerName}`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. ACCEPT (Engineer)
export const acceptTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'ACCEPTED';
    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Work Order Accepted',
      user: req.user.name,
      role: req.user.role,
      note: `Engineer acknowledged assignment and scheduled execution.`,
    });

    await ticket.save();
    await logActivity(req.user, `Accepted ${ticket.ticketId}`, ticket.ticketId, `Accepted by ${req.user.name}`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. START (Engineer)
export const startTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'IN_PROGRESS';
    if (ticket.progress === 0) ticket.progress = 15;

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Maintenance Started',
      user: req.user.name,
      role: req.user.role,
      note: `Technician commenced active on-site service & diagnostics.`,
    });

    await ticket.save();
    await logActivity(req.user, `Started Maintenance on ${ticket.machineId}`, ticket.ticketId, `Commenced work on ${ticket.machineId}`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. UPDATE PROGRESS & FINDINGS (Engineer)
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, findings, note, status } = req.body;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    if (progress !== undefined) ticket.progress = Math.min(100, Math.max(0, Number(progress)));
    if (findings !== undefined) ticket.findings = findings;
    if (status && ['IN_PROGRESS', 'TESTING'].includes(status)) {
      ticket.status = status;
    }

    if (note) {
      ticket.notes.push(`[${new Date().toLocaleTimeString()}] ${note}`);
    }

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Progress Updated',
      user: req.user.name,
      role: req.user.role,
      note: `Progress: ${ticket.progress}% | ${findings ? 'Findings: ' + findings.substring(0, 80) : note || 'Routine progress update'}`,
    });

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. SUBMIT RESOLUTION (Engineer)
export const submitResolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, findings, note } = req.body;

    if (!resolution || resolution.trim() === '') {
      return res.status(400).json({ error: 'Resolution summary is required before submission.' });
    }

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'RESOLUTION_SUBMITTED';
    ticket.progress = 100;
    ticket.resolution = resolution;
    if (findings) ticket.findings = findings;
    if (note) ticket.notes.push(`[${new Date().toLocaleTimeString()} Completion] ${note}`);

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Resolution Submitted',
      user: req.user.name,
      role: req.user.role,
      note: `Resolution: ${resolution}`,
    });

    await ticket.save();
    await logActivity(req.user, `Submitted Resolution for ${ticket.ticketId}`, ticket.ticketId, `Resolution submitted for admin review`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. APPROVE (Admin)
export const approveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'APPROVED';
    ticket.reviewedAt = new Date();
    ticket.approvedAt = new Date();
    if (note) ticket.notes.push(`[Admin Approval] ${note}`);

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Work Order Approved',
      user: req.user.name,
      role: req.user.role,
      note: note || 'Admin reviewed and approved engineer resolution.',
    });

    await ticket.save();

    // Restore machine status to Optimal if no other active critical work orders
    const remainingOrders = await Ticket.countDocuments({
      machineId: ticket.machineId,
      status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'REWORK'] },
      _id: { $ne: ticket._id },
    });

    if (remainingOrders === 0) {
      await Machine.updateOne(
        { machineId: ticket.machineId },
        { $set: { status: 'Optimal', healthScore: 98, riskLevel: 'Low' } }
      );
    }

    await logActivity(req.user, `Approved Work Order ${ticket.ticketId}`, ticket.ticketId, `Approved maintenance for ${ticket.machineId}`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. REQUEST REWORK / REJECT (Admin)
export const reworkTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, instructions } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rework reason/instructions are required.' });
    }

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'REWORK';
    ticket.progress = 60; // Rollback progress to rework state
    ticket.adminInstructions = instructions || reason;
    ticket.notes.push(`[Admin Rework Requested] ${reason}`);

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Rework Requested',
      user: req.user.name,
      role: req.user.role,
      note: `Rework reason: ${reason}`,
    });

    await ticket.save();
    await logActivity(req.user, `Requested Rework on ${ticket.ticketId}`, ticket.ticketId, `Reason: ${reason}`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. CLOSE WORK ORDER (Admin)
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const ticket = await Ticket.findOne({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
    if (!ticket) return res.status(404).json({ error: 'Work order not found' });

    ticket.status = 'CLOSED';
    ticket.closedAt = new Date();
    if (note) ticket.notes.push(`[Closed] ${note}`);

    ticket.activityTimeline.push({
      timestamp: new Date(),
      action: 'Work Order Closed',
      user: req.user.name,
      role: req.user.role,
      note: note || 'Work order archived and closed.',
    });

    await ticket.save();

    // Decrement active orders count on user
    if (ticket.assignedToId) {
      await User.findByIdAndUpdate(ticket.assignedToId, { $inc: { activeOrdersCount: -1 } });
    }

    await logActivity(req.user, `Closed Work Order ${ticket.ticketId}`, ticket.ticketId, `Archived and closed.`);

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findOneAndDelete({
      $or: [{ ticketId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({ message: `Work order ${ticket.ticketId} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTicketStats = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const filter = {};

    if (userRole === 'ENGINEER') {
      filter.$or = [
        { assignedTo: req.user.name },
        { assignedToId: req.user._id },
        { assignedToEmail: req.user.email },
      ];
    }

    const total = await Ticket.countDocuments(filter);
    const open = await Ticket.countDocuments({ ...filter, status: { $in: ['OPEN', 'Open'] } });
    const assigned = await Ticket.countDocuments({ ...filter, status: 'ASSIGNED' });
    const accepted = await Ticket.countDocuments({ ...filter, status: 'ACCEPTED' });
    const inProgress = await Ticket.countDocuments({ ...filter, status: { $in: ['IN_PROGRESS', 'TESTING', 'In Progress'] } });
    const resolutionSubmitted = await Ticket.countDocuments({ ...filter, status: 'RESOLUTION_SUBMITTED' });
    const rework = await Ticket.countDocuments({ ...filter, status: 'REWORK' });
    const approved = await Ticket.countDocuments({ ...filter, status: 'APPROVED' });
    const closed = await Ticket.countDocuments({ ...filter, status: { $in: ['CLOSED', 'Resolved'] } });

    // Due today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dueToday = await Ticket.countDocuments({
      ...filter,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['APPROVED', 'CLOSED', 'Resolved'] },
    });

    const highPriority = await Ticket.countDocuments({
      ...filter,
      priority: { $in: ['HIGH', 'CRITICAL', 'High', 'Critical'] },
      status: { $nin: ['APPROVED', 'CLOSED', 'Resolved'] },
    });

    res.json({
      total,
      open,
      assigned,
      accepted,
      inProgress,
      resolutionSubmitted,
      rework,
      approved,
      closed,
      dueToday,
      highPriority,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
