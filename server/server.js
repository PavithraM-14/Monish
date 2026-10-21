import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import machineRoutes from './routes/machines.js';
import telemetryRoutes from './routes/telemetry.js';
import anomalyRoutes from './routes/anomalies.js';
import ticketRoutes from './routes/tickets.js';
import issueRoutes from './routes/issues.js';
import activityRoutes from './routes/activities.js';
import reportRoutes from './routes/reports.js';
import chatRoutes from './routes/chat.js';
import { ensureTelemetryTimeSeriesCollection } from './models/Telemetry.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/predictamaint';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatRoutes);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    groqConfigured: !!(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq_api_key')),
  });
});

// Database Connection & Server Launch
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`✅ Connected to MongoDB: ${MONGO_URI}`);
    await ensureTelemetryTimeSeriesCollection(mongoose.connection);

    app.listen(PORT, () => {
      console.log(`🚀 PredictaMaint Server running on port ${PORT}`);
      console.log(`📡 Ingestion API ready at http://localhost:${PORT}/api/telemetry`);
      console.log(`🤖 AI Diagnostics ready at http://localhost:${PORT}/api/chat`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
