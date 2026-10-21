import Telemetry from '../models/Telemetry.js';
import Machine from '../models/Machine.js';

export const ingestTelemetry = async (req, res) => {
  try {
    const { machineId, timestamp, vibration, temperature, current, pressure, rpm } = req.body;

    if (!machineId || vibration === undefined || temperature === undefined) {
      return res.status(400).json({ error: 'machineId, vibration, and temperature are required' });
    }

    const reading = new Telemetry({
      machineId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      vibration: Number(vibration),
      temperature: Number(temperature),
      current: Number(current || 0),
      pressure: Number(pressure || 0),
      rpm: Number(rpm || 0),
    });

    await reading.save();
    res.status(201).json({ message: 'Telemetry reading recorded', id: reading._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const ingestBatchTelemetry = async (req, res) => {
  try {
    const { readings } = req.body;

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'readings array is required and must not be empty' });
    }

    const docs = readings.map((r) => ({
      machineId: r.machineId,
      timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
      vibration: Number(r.vibration),
      temperature: Number(r.temperature),
      current: Number(r.current || 0),
      pressure: Number(r.pressure || 0),
      rpm: Number(r.rpm || 0),
    }));

    await Telemetry.insertMany(docs);
    res.status(201).json({ message: `Successfully ingested ${docs.length} telemetry readings` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTelemetry = async (req, res) => {
  try {
    const { machineId, range, startDate, endDate, limit = 60, sort = 'desc' } = req.query;

    const filter = {};
    if (machineId && machineId !== 'all') {
      filter.machineId = machineId;
    }

    // Time filtering
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    } else if (range) {
      const now = Date.now();
      let durationMs = 60 * 60 * 1000; // default 1h
      if (range === '15m') durationMs = 15 * 60 * 1000;
      else if (range === '1h') durationMs = 60 * 60 * 1000;
      else if (range === '6h') durationMs = 6 * 60 * 60 * 1000;
      else if (range === '24h') durationMs = 24 * 60 * 60 * 1000;
      else if (range === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
      else if (range === '30d') durationMs = 30 * 24 * 60 * 60 * 1000;

      filter.timestamp = { $gte: new Date(now - durationMs) };
    }

    const sortOrder = sort === 'asc' ? 1 : -1;
    const queryLimit = Math.min(Number(limit) || 100, 2000);

    const readings = await Telemetry.find(filter)
      .sort({ timestamp: sortOrder })
      .limit(queryLimit);

    // If sorting was desc, reverse for charts if requested in query
    if (req.query.reverse === 'true' && sortOrder === -1) {
      readings.reverse();
    }

    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLatestFleetTelemetry = async (req, res) => {
  try {
    const machines = await Machine.find({}, 'machineId name type status thresholds rul healthScore');

    const latestList = await Promise.all(
      machines.map(async (m) => {
        const latest = await Telemetry.findOne({ machineId: m.machineId }).sort({ timestamp: -1 });
        return {
          machine: m,
          telemetry: latest || null,
        };
      })
    );

    res.json(latestList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const exportTelemetryCSV = async (req, res) => {
  try {
    const { machineId, range, limit = 1000 } = req.query;
    const filter = {};
    if (machineId && machineId !== 'all') {
      filter.machineId = machineId;
    }

    if (range) {
      const now = Date.now();
      let durationMs = 24 * 60 * 60 * 1000;
      if (range === '1h') durationMs = 60 * 60 * 1000;
      if (range === '6h') durationMs = 6 * 60 * 60 * 1000;
      if (range === '7d') durationMs = 7 * 24 * 60 * 60 * 1000;
      filter.timestamp = { $gte: new Date(now - durationMs) };
    }

    const readings = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    // Build CSV string
    const headers = ['Timestamp', 'Machine ID', 'Vibration (mm/s)', 'Temperature (°C)', 'Current (A)', 'Pressure (bar)', 'RPM'];
    const rows = readings.map((r) => [
      new Date(r.timestamp).toISOString(),
      r.machineId,
      r.vibration,
      r.temperature,
      r.current,
      r.pressure,
      r.rpm,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=telemetry_${machineId || 'fleet'}_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
