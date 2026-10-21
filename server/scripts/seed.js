import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Machine from '../models/Machine.js';
import User from '../models/User.js';
import Telemetry, { ensureTelemetryTimeSeriesCollection } from '../models/Telemetry.js';
import Anomaly from '../models/Anomaly.js';
import Ticket from '../models/Ticket.js';
import IssueIntimation from '../models/IssueIntimation.js';
import Activity from '../models/Activity.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/predictamaint';

const initialMachines = [
  {
    machineId: 'MCH-001',
    name: 'CNC Milling Center Alpha',
    type: 'CNC Milling',
    location: 'Bay 1 - Precision Machining',
    installDate: new Date('2023-03-15'),
    thresholds: { vibration: 4.5, temperature: 75.0, current: 22.0, pressure: 8.5 },
    status: 'Optimal',
    rul: 4320,
    healthScore: 96,
    riskLevel: 'Low',
    primaryDegradingSensor: 'vibration',
  },
  {
    machineId: 'MCH-002',
    name: 'Hydraulic Stamping Press 500T',
    type: 'Hydraulic Press',
    location: 'Bay 2 - Heavy Forming',
    installDate: new Date('2022-08-10'),
    thresholds: { vibration: 6.0, temperature: 85.0, current: 40.0, pressure: 220.0 },
    status: 'Optimal',
    rul: 4850,
    healthScore: 92,
    riskLevel: 'Low',
    primaryDegradingSensor: 'pressure',
  },
  {
    machineId: 'MCH-003',
    name: 'Centrifugal Slurry Pump C-3',
    type: 'Centrifugal Pump',
    location: 'Bay 3 - Fluid Systems',
    installDate: new Date('2023-01-20'),
    thresholds: { vibration: 5.8, temperature: 78.0, current: 25.0, pressure: 6.5 },
    status: 'Warning',
    rul: 1120,
    healthScore: 68,
    riskLevel: 'Moderate',
    primaryDegradingSensor: 'vibration',
  },
  {
    machineId: 'MCH-004',
    name: 'Rotary Screw Compressor RC-1',
    type: 'Rotary Compressor',
    location: 'Utility Plant Room',
    installDate: new Date('2021-11-05'),
    thresholds: { vibration: 5.2, temperature: 98.0, current: 30.0, pressure: 10.5 },
    status: 'Critical',
    rul: 420,
    healthScore: 54,
    riskLevel: 'Critical',
    primaryDegradingSensor: 'temperature',
  },
  {
    machineId: 'MCH-005',
    name: '6-Axis Robotic Welder R-6',
    type: 'Robotic Arm',
    location: 'Assembly Line 4',
    installDate: new Date('2024-02-14'),
    thresholds: { vibration: 3.2, temperature: 65.0, current: 15.0, pressure: 7.0 },
    status: 'Optimal',
    rul: 5800,
    healthScore: 98,
    riskLevel: 'Low',
    primaryDegradingSensor: 'current',
  },
  {
    machineId: 'MCH-006',
    name: 'Heavy Conveyor Drive CV-12',
    type: 'Belt Conveyor',
    location: 'Logistics & Dispatch',
    installDate: new Date('2022-05-18'),
    thresholds: { vibration: 4.0, temperature: 70.0, current: 18.0, pressure: 4.5 },
    status: 'Optimal',
    rul: 4100,
    healthScore: 91,
    riskLevel: 'Low',
    primaryDegradingSensor: 'vibration',
  },
  {
    machineId: 'MCH-007',
    name: 'Injection Molding Press 250T',
    type: 'Injection Molder',
    location: 'Bay 4 - Plastics Line',
    installDate: new Date('2023-09-01'),
    thresholds: { vibration: 4.8, temperature: 218.0, current: 45.0, pressure: 165.0 },
    status: 'Optimal',
    rul: 4600,
    healthScore: 94,
    riskLevel: 'Low',
    primaryDegradingSensor: 'temperature',
  },
  {
    machineId: 'MCH-008',
    name: 'Industrial Exhaust Blower EB-4',
    type: 'Exhaust Blower',
    location: 'Roof Deck Ventilation',
    installDate: new Date('2022-12-08'),
    thresholds: { vibration: 5.0, temperature: 76.0, current: 24.0, pressure: 3.2 },
    status: 'Optimal',
    rul: 5100,
    healthScore: 93,
    riskLevel: 'Low',
    primaryDegradingSensor: 'vibration',
  },
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    await ensureTelemetryTimeSeriesCollection(mongoose.connection);

    console.log('Clearing existing database collections...');
    try {
      await mongoose.connection.db.collection('issueintimations').drop();
    } catch (e) {}
    await Machine.deleteMany({});
    await User.deleteMany({});
    await Anomaly.deleteMany({});
    await Ticket.deleteMany({});
    await Telemetry.deleteMany({});
    await IssueIntimation.deleteMany({});
    await Activity.deleteMany({});

    console.log('Seeding Operational Roles (ADMIN & ENGINEER)...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@123', salt);
    const engineerPass = await bcrypt.hash('Engineer@123', salt);
    const viewerPass = await bcrypt.hash('Viewer@123', salt);

    const adminUser = await User.create({
      name: 'Sarah Connor',
      email: 'admin@predictamaint.com',
      passwordHash: adminPass,
      role: 'ADMIN',
      department: 'Central Operations Control',
      shift: 'Day Operations',
    });

    const engineerUser = await User.create({
      name: 'Marcus Vance',
      email: 'engineer@predictamaint.com',
      passwordHash: engineerPass,
      role: 'ENGINEER',
      department: 'Mechanical Maintenance & Diagnostics',
      shift: 'Shift A (Bay 1-4)',
      activeOrdersCount: 4,
    });

    const viewerUser = await User.create({
      name: 'Elena Rostova',
      email: 'viewer@predictamaint.com',
      passwordHash: viewerPass,
      role: 'VIEWER',
      department: 'Plant Monitoring',
      shift: 'General',
    });

    console.log('✅ Seeded Users: ADMIN and ENGINEER.');

    console.log('Seeding Fleet Machines...');
    const machines = await Machine.insertMany(initialMachines);
    console.log(`✅ Seeded ${machines.length} fleet machines.`);

    console.log('Generating initial historical telemetry readings...');
    const now = Date.now();
    const telemetryBatch = [];

    for (const m of initialMachines) {
      const baseVib = m.thresholds.vibration * 0.55;
      const baseTemp = m.thresholds.temperature * 0.7;
      const baseCurr = m.thresholds.current * 0.6;
      const basePress = m.thresholds.pressure * 0.7;

      for (let i = 30; i >= 0; i--) {
        const timePoint = new Date(now - i * 15 * 1000);
        let vib = baseVib + (Math.random() - 0.5) * 0.4;
        let temp = baseTemp + (Math.random() - 0.5) * 2.0;

        // Introduce warning trend on MCH-003
        if (m.machineId === 'MCH-003' && i < 10) {
          vib = m.thresholds.vibration + 0.6 + Math.random() * 0.5;
        }

        // Introduce critical temp trend on MCH-004
        if (m.machineId === 'MCH-004' && i < 8) {
          temp = m.thresholds.temperature + 4.0 + Math.random() * 2.0;
        }

        telemetryBatch.push({
          machineId: m.machineId,
          timestamp: timePoint,
          vibration: Math.round(vib * 100) / 100,
          temperature: Math.round(temp * 10) / 10,
          current: Math.round((baseCurr + (Math.random() - 0.5)) * 10) / 10,
          pressure: Math.round((basePress + (Math.random() - 0.5) * 0.3) * 10) / 10,
          rpm: Math.round(1750 + (Math.random() - 0.5) * 40),
        });
      }
    }

    await Telemetry.insertMany(telemetryBatch);
    console.log(`✅ Seeded ${telemetryBatch.length} initial telemetry points.`);

    console.log('Seeding initial anomalies...');
    const sampleAnomaly1 = await Anomaly.create({
      machineId: 'MCH-003',
      timestamp: new Date(now - 12 * 60 * 1000),
      sensor: 'vibration',
      severity: 'high',
      score: 3.42,
      value: 6.4,
      mean: 3.8,
      threshold: 5.8,
      explanation: 'Vibration reading of 6.4mm/s exceeded baseline mean (3.8mm/s) with z-score of 3.42σ. Probable mechanical unbalance or bearing race spalling.',
      status: 'open',
    });

    const sampleAnomaly2 = await Anomaly.create({
      machineId: 'MCH-004',
      timestamp: new Date(now - 4 * 60 * 1000),
      sensor: 'temperature',
      severity: 'critical',
      score: 4.15,
      value: 104.2,
      mean: 82.0,
      threshold: 98.0,
      explanation: 'Temperature surged past critical limit (104.2°C vs 98.0°C limit). Oil cooler bypass or mechanical friction suspected.',
      status: 'open',
    });

    console.log('Seeding Work Orders across complete lifecycle...');
    const tickets = [
      {
        ticketId: 'WO-0001',
        machineId: 'MCH-003',
        title: 'Centrifugal Slurry Pump Bearing Inspection & Realignment',
        description: 'Vibration readings exceeded 5.8 mm/s safety threshold. Execute laser shaft alignment and inspect drive-end spherical roller bearings.',
        assignedTo: 'Marcus Vance',
        assignedToId: engineerUser._id,
        assignedToEmail: 'engineer@predictamaint.com',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 45,
        dueDate: new Date(now + 24 * 60 * 60 * 1000),
        adminInstructions: 'Check oil contamination and replace bearing pack if race scoring exceeds 0.2mm.',
        findings: 'Initial dial indicator check shows 0.18mm radial runout on pump impeller shaft.',
        resolution: '',
        notes: [
          `[${new Date(now - 3600000).toLocaleTimeString()}] Work order issued following anomaly detection.`,
          `[${new Date(now - 1800000).toLocaleTimeString()} Marcus Vance] Shaft guards removed. Dial gauges mounted.`,
        ],
        activityTimeline: [
          {
            timestamp: new Date(now - 3600000),
            action: 'Work Order Created',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Dispatched due to vibration anomaly',
          },
          {
            timestamp: new Date(now - 2700000),
            action: 'Work Order Accepted',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Acknowledged assignment and gathered laser alignment tools.',
          },
          {
            timestamp: new Date(now - 1800000),
            action: 'Maintenance Started',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Physical inspection underway at Bay 3.',
          },
        ],
        anomalyId: sampleAnomaly1._id.toString(),
      },
      {
        ticketId: 'WO-0002',
        machineId: 'MCH-004',
        title: 'Rotary Compressor Thermal Runaway Investigation',
        description: 'Discharge temperature breached 104°C critical limit. Check oil heat exchanger and thermostatic valve.',
        assignedTo: 'Marcus Vance',
        assignedToId: engineerUser._id,
        assignedToEmail: 'engineer@predictamaint.com',
        priority: 'CRITICAL',
        status: 'ASSIGNED',
        progress: 0,
        dueDate: new Date(now + 12 * 60 * 60 * 1000),
        adminInstructions: 'URGENT: High thermal trip risk. Do not restart machine until thermostatic valve is validated.',
        findings: '',
        resolution: '',
        notes: ['Urgent dispatch from Central Operations.'],
        activityTimeline: [
          {
            timestamp: new Date(now - 900000),
            action: 'Work Order Created',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Assigned as CRITICAL priority to Marcus Vance',
          },
        ],
        anomalyId: sampleAnomaly2._id.toString(),
      },
      {
        ticketId: 'WO-0003',
        machineId: 'MCH-001',
        title: 'CNC Milling Center Spindle Lubrication & Filter Replacement',
        description: 'Routine 4,000-hour spindle lubrication flush and micron filter cartridge replacement.',
        assignedTo: 'Marcus Vance',
        assignedToId: engineerUser._id,
        assignedToEmail: 'engineer@predictamaint.com',
        priority: 'MEDIUM',
        status: 'RESOLUTION_SUBMITTED',
        progress: 100,
        dueDate: new Date(now + 36 * 60 * 60 * 1000),
        adminInstructions: 'Log used oil sample for lab spectrochemical analysis.',
        findings: 'Old oil showed slight particulate clouding. Filter element replaced without resistance.',
        resolution: 'Flushed spindle lubrication reservoir with ISO VG 32 oil. Installed new 5-micron suction filter. Ran spindle at 3,200 RPM for 20 minutes; vibration steady at 1.8 mm/s.',
        notes: [
          'Maintenance started at 08:30.',
          'Fluid test completed at 10:45.',
          'Resolution submitted for Admin review.',
        ],
        activityTimeline: [
          {
            timestamp: new Date(now - 7200000),
            action: 'Work Order Created',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Routine scheduled PM',
          },
          {
            timestamp: new Date(now - 5400000),
            action: 'Work Order Accepted',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Scheduled for morning shift',
          },
          {
            timestamp: new Date(now - 3600000),
            action: 'Maintenance Started',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Reservoir drained',
          },
          {
            timestamp: new Date(now - 900000),
            action: 'Resolution Submitted',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Awaiting Admin Review and sign-off',
          },
        ],
      },
      {
        ticketId: 'WO-0004',
        machineId: 'MCH-002',
        title: 'Hydraulic Press Main Cylinder Pressure Seal Replacement',
        description: 'Pressure decay noted during clamping cycle. Replace polyurethane rod seals.',
        assignedTo: 'Marcus Vance',
        assignedToId: engineerUser._id,
        assignedToEmail: 'engineer@predictamaint.com',
        priority: 'HIGH',
        status: 'APPROVED',
        progress: 100,
        dueDate: new Date(now - 24 * 60 * 60 * 1000),
        adminInstructions: 'Pressure test cylinder up to 210 bar before releasing to production.',
        findings: 'Rod seal was degraded along outer perimeter. Replaced with Viton backup rings.',
        resolution: 'Hydrostatic pressure held at 200 bar for 30 minutes with zero leakage. Approved by Sarah Connor.',
        reviewedAt: new Date(now - 3600000),
        approvedAt: new Date(now - 3600000),
        notes: ['Work completed and verified under test load.'],
        activityTimeline: [
          {
            timestamp: new Date(now - 86400000),
            action: 'Work Order Created',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Seal kit ordered',
          },
          {
            timestamp: new Date(now - 43200000),
            action: 'Resolution Submitted',
            user: 'Marcus Vance',
            role: 'ENGINEER',
            note: 'Seals replaced and tested',
          },
          {
            timestamp: new Date(now - 3600000),
            action: 'Work Order Approved',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Reviewed test certificate and approved for operations.',
          },
        ],
      },
      {
        ticketId: 'WO-0005',
        machineId: 'MCH-006',
        title: 'Belt Conveyor Drive Motor Tensioning & Belt Inspection',
        description: 'Check V-belt deflection and calibrate tension meter to manufacturer specifications.',
        assignedTo: 'Marcus Vance',
        assignedToId: engineerUser._id,
        assignedToEmail: 'engineer@predictamaint.com',
        priority: 'LOW',
        status: 'CLOSED',
        progress: 100,
        dueDate: new Date(now - 48 * 60 * 60 * 1000),
        adminInstructions: 'Verify guard interlock switches.',
        findings: 'Belt elongation 1.2%. Retensioned motor carriage.',
        resolution: 'Belt tension brought within 15-18mm deflection limit at 45N force. Running smoothly.',
        reviewedAt: new Date(now - 40000000),
        approvedAt: new Date(now - 40000000),
        closedAt: new Date(now - 38000000),
        notes: ['Completed, signed off and archived.'],
        activityTimeline: [
          {
            timestamp: new Date(now - 90000000),
            action: 'Work Order Created',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Conveyor maintenance',
          },
          {
            timestamp: new Date(now - 40000000),
            action: 'Work Order Approved',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Work approved',
          },
          {
            timestamp: new Date(now - 38000000),
            action: 'Work Order Closed',
            user: 'Sarah Connor',
            role: 'ADMIN',
            note: 'Archived to historical records',
          },
        ],
      },
    ];

    await Ticket.insertMany(tickets);
    console.log(`✅ Seeded ${tickets.length} sample Work Orders across all lifecycle states.`);

    console.log('Seeding Issue Intimations reported by engineers...');
    const sampleIssues = [
      {
        issueId: 'ISS-0001',
        machineId: 'MCH-007',
        reportedBy: 'Marcus Vance',
        reportedById: engineerUser._id,
        issueType: 'Thermal Overheating',
        severity: 'MEDIUM',
        description: 'Barrel zone 3 heater band cycling rapidly. Thermal readings fluctuating +/- 12°C around setpoint.',
        observedSymptoms: 'Intermittent thermocouple lead contact or solid state relay degradation.',
        recommendedAction: 'Replace thermocouple wiring harness and calibrate PID controller.',
        status: 'REPORTED',
      },
      {
        issueId: 'ISS-0002',
        machineId: 'MCH-005',
        reportedBy: 'Marcus Vance',
        reportedById: engineerUser._id,
        issueType: 'Mechanical Failure',
        severity: 'LOW',
        description: 'Axis 4 harmonic drive showing slight backlash during fast positioning moves.',
        observedSymptoms: 'Minor audible click when reversing direction under load.',
        recommendedAction: 'Inspect belt tensioner on J4 wrist motor during next planned downtime.',
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'Sarah Connor',
        acknowledgedAt: new Date(now - 7200000),
      },
    ];

    await IssueIntimation.insertMany(sampleIssues);
    console.log(`✅ Seeded ${sampleIssues.length} sample Issue Intimations.`);

    console.log('Seeding Real Activity Log records...');
    const activities = [
      {
        timestamp: new Date(now - 15 * 60 * 1000),
        user: 'Marcus Vance',
        userId: engineerUser._id,
        role: 'ENGINEER',
        action: 'Submitted Resolution for WO-0003',
        entityType: 'WORK_ORDER',
        entityId: 'WO-0003',
        details: 'Flushed spindle lubrication reservoir with ISO VG 32 oil.',
      },
      {
        timestamp: new Date(now - 45 * 60 * 1000),
        user: 'Sarah Connor',
        userId: adminUser._id,
        role: 'ADMIN',
        action: 'Assigned Work Order WO-0002',
        entityType: 'WORK_ORDER',
        entityId: 'WO-0002',
        details: 'Assigned CRITICAL priority order to Marcus Vance for MCH-004.',
      },
      {
        timestamp: new Date(now - 75 * 60 * 1000),
        user: 'Marcus Vance',
        userId: engineerUser._id,
        role: 'ENGINEER',
        action: 'Reported Issue ISS-0001 on MCH-007',
        entityType: 'ISSUE',
        entityId: 'ISS-0001',
        details: 'Thermal Overheating: Barrel zone 3 heater band cycling rapidly.',
      },
      {
        timestamp: new Date(now - 120 * 60 * 1000),
        user: 'Marcus Vance',
        userId: engineerUser._id,
        role: 'ENGINEER',
        action: 'Started Maintenance on MCH-003',
        entityType: 'WORK_ORDER',
        entityId: 'WO-0001',
        details: 'Commenced dial runout checks on slurry pump shaft.',
      },
      {
        timestamp: new Date(now - 180 * 60 * 1000),
        user: 'Sarah Connor',
        userId: adminUser._id,
        role: 'ADMIN',
        action: 'Approved Work Order WO-0004',
        entityType: 'WORK_ORDER',
        entityId: 'WO-0004',
        details: 'Verified cylinder hydrostatic pressure seal test on MCH-002.',
      },
    ];

    await Activity.insertMany(activities);
    console.log(`✅ Seeded ${activities.length} activity records.`);

    console.log('\n=============================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('DEMO ACCOUNTS:');
    console.log('  ADMIN:    admin@predictamaint.com    / Admin@123');
    console.log('  ENGINEER: engineer@predictamaint.com / Engineer@123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
