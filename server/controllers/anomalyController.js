import Anomaly from '../models/Anomaly.js';
import Machine from '../models/Machine.js';

export const getAnomalies = async (req, res) => {
  try {
    const { machineId, severity, status, limit = 50 } = req.query;
    const filter = {};

    if (machineId && machineId !== 'all') {
      filter.machineId = machineId;
    }
    if (severity && severity !== 'all') {
      filter.severity = severity;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const anomalies = await Anomaly.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnomalyStats = async (req, res) => {
  try {
    const total = await Anomaly.countDocuments();
    const open = await Anomaly.countDocuments({ status: 'open' });
    const acknowledged = await Anomaly.countDocuments({ status: 'acknowledged' });
    const resolved = await Anomaly.countDocuments({ status: 'resolved' });

    const critical = await Anomaly.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } });
    const high = await Anomaly.countDocuments({ severity: 'high', status: { $ne: 'resolved' } });
    const medium = await Anomaly.countDocuments({ severity: 'medium', status: { $ne: 'resolved' } });
    const low = await Anomaly.countDocuments({ severity: 'low', status: { $ne: 'resolved' } });

    // Breakdown by sensor
    const sensorBreakdown = await Anomaly.aggregate([
      { $group: { _id: '$sensor', count: { $sum: 1 } } },
    ]);

    res.json({
      total,
      open,
      acknowledged,
      resolved,
      activeBySeverity: {
        critical,
        high,
        medium,
        low,
      },
      sensorBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAnomalyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Status must be open, acknowledged, or resolved' });
    }

    const anomaly = await Anomaly.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }

    // If resolving critical/high anomaly, re-check if machine has any other active critical anomalies
    if (status === 'resolved') {
      const remainingCritical = await Anomaly.countDocuments({
        machineId: anomaly.machineId,
        status: { $in: ['open', 'acknowledged'] },
        severity: 'critical',
      });

      const remainingWarning = await Anomaly.countDocuments({
        machineId: anomaly.machineId,
        status: { $in: ['open', 'acknowledged'] },
        severity: { $in: ['medium', 'high'] },
      });

      let newStatus = 'Optimal';
      if (remainingCritical > 0) newStatus = 'Critical';
      else if (remainingWarning > 0) newStatus = 'Warning';

      await Machine.updateOne({ machineId: anomaly.machineId }, { $set: { status: newStatus } });
    }

    res.json(anomaly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAnomaly = async (req, res) => {
  try {
    const { machineId, sensor, severity, score, explanation, value, mean, threshold } = req.body;

    if (!machineId || !sensor || !explanation) {
      return res.status(400).json({ error: 'machineId, sensor, and explanation are required' });
    }

    const anomaly = new Anomaly({
      machineId,
      timestamp: new Date(),
      sensor,
      severity: severity || 'medium',
      score: score || 2.0,
      value,
      mean,
      threshold,
      explanation,
      status: 'open',
    });

    await anomaly.save();
    res.status(201).json(anomaly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
