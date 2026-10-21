import Activity from '../models/Activity.js';

export const getActivities = async (req, res) => {
  try {
    const { limit = 20, entityType } = req.query;
    const filter = {};
    if (entityType && entityType !== 'all') {
      filter.entityType = entityType;
    }

    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
