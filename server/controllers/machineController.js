import Machine from '../models/Machine.js';
import Anomaly from '../models/Anomaly.js';
import Ticket from '../models/Ticket.js';
import Telemetry from '../models/Telemetry.js';

export const getMachines = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { machineId: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const machines = await Machine.find(filter).sort({ machineId: 1 });
    res.json(machines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMachineStats = async (req, res) => {
  try {
    const total = await Machine.countDocuments();
    const optimal = await Machine.countDocuments({ status: 'Optimal' });
    const warning = await Machine.countDocuments({ status: 'Warning' });
    const critical = await Machine.countDocuments({ status: 'Critical' });
    const offline = await Machine.countDocuments({ status: 'Offline' });

    // Aggregate average RUL and average healthScore
    const agg = await Machine.aggregate([
      {
        $group: {
          _id: null,
          avgRul: { $avg: '$rul' },
          avgHealth: { $avg: '$healthScore' },
        },
      },
    ]);

    const activeAlerts = await Anomaly.countDocuments({
      status: { $in: ['open', 'acknowledged'] },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const openWorkOrders = await Ticket.countDocuments({
      status: { $in: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'TESTING', 'REWORK', 'Open', 'In Progress'] },
    });

    const awaitingReview = await Ticket.countDocuments({
      status: 'RESOLUTION_SUBMITTED',
    });

    const completedMaintenance = await Ticket.countDocuments({
      status: { $in: ['APPROVED', 'CLOSED', 'Resolved'] },
    });

    const atRisk = await Machine.countDocuments({
      $or: [{ status: { $in: ['Warning', 'Critical'] } }, { healthScore: { $lt: 70 } }],
    });

    // Percentages
    const healthyPercent = total > 0 ? Math.round((optimal / total) * 100) : 100;
    const warningPercent = total > 0 ? Math.round((warning / total) * 100) : 0;
    const criticalPercent = total > 0 ? Math.round((critical / total) * 100) : 0;

    // Fleet Uptime percentage based on health and non-critical machines
    const uptimePercent = total > 0 ? Math.round(((total - critical) / total) * 98.4 * 10) / 10 : 100;

    res.json({
      total,
      optimal,
      healthy: optimal,
      warning,
      critical,
      offline,
      healthyPercent,
      warningPercent,
      criticalPercent,
      uptimePercent,
      activeAlerts,
      openTickets: openWorkOrders,
      openWorkOrders,
      awaitingReview,
      completedMaintenance,
      machinesAtRisk: atRisk,
      avgRulHours: agg.length > 0 ? Math.round(agg[0].avgRul || 0) : 0,
      avgHealthScore: agg.length > 0 ? Math.round((agg[0].avgHealth || 100) * 10) / 10 : 100,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMachineById = async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findOne({
      $or: [{ machineId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    // Fetch latest anomalies, tickets, and recent telemetry reading
    const anomalies = await Anomaly.find({ machineId: machine.machineId })
      .sort({ timestamp: -1 })
      .limit(10);

    const tickets = await Ticket.find({ machineId: machine.machineId })
      .sort({ createdAt: -1 })
      .limit(5);

    const latestTelemetry = await Telemetry.findOne({ machineId: machine.machineId })
      .sort({ timestamp: -1 });

    res.json({
      machine,
      anomalies,
      tickets,
      latestTelemetry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createMachine = async (req, res) => {
  try {
    const { machineId, name, type, location, installDate, thresholds } = req.body;
    if (!machineId || !name || !type || !location) {
      return res.status(400).json({ error: 'machineId, name, type, and location are required.' });
    }

    const existing = await Machine.findOne({ machineId });
    if (existing) {
      return res.status(400).json({ error: `Machine ID "${machineId}" already exists.` });
    }

    const machine = new Machine({
      machineId,
      name,
      type,
      location,
      installDate: installDate || new Date(),
      thresholds: thresholds || {
        vibration: 5.0,
        temperature: 80.0,
        current: 25.0,
        pressure: 10.0,
      },
      status: 'Optimal',
      rul: 4500,
      healthScore: 100,
      riskLevel: 'Low',
    });

    await machine.save();
    res.status(201).json(machine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const machine = await Machine.findOneAndUpdate(
      { $or: [{ machineId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json(machine);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findOneAndDelete({
      $or: [{ machineId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    res.json({ message: `Machine ${machine.machineId} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
