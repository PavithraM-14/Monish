import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    vibration: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    current: {
      type: Number,
      required: true,
    },
    pressure: {
      type: Number,
      required: true,
    },
    rpm: {
      type: Number,
      required: true,
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'machineId',
      granularity: 'seconds',
    },
    timestamps: false,
    versionKey: false,
  }
);

/**
 * Ensures the telemetry collection is created as a native MongoDB time-series collection
 */
export async function ensureTelemetryTimeSeriesCollection(connection) {
  try {
    const collections = await connection.db.listCollections({ name: 'telemetries' }).toArray();
    const legacyCollections = await connection.db.listCollections({ name: 'telemetry' }).toArray();

    // Check either name
    if (collections.length === 0 && legacyCollections.length === 0) {
      await connection.db.createCollection('telemetries', {
        timeseries: {
          timeField: 'timestamp',
          metaField: 'machineId',
          granularity: 'seconds',
        },
      });
      console.log('✅ MongoDB native Time-Series collection "telemetries" created.');
    }
  } catch (err) {
    // If collection already exists or time-series creation is handled by mongoose
    console.log('ℹ️ Telemetry collection status:', err.message);
  }
}

const Telemetry = mongoose.model('Telemetry', telemetrySchema);
export default Telemetry;
