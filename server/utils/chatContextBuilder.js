import Machine from '../models/Machine.js';
import Telemetry from '../models/Telemetry.js';
import Anomaly from '../models/Anomaly.js';
import Ticket from '../models/Ticket.js';

/**
 * Extracts candidate machine IDs from user question text
 */
export function extractMachineFromText(text) {
  if (!text) return null;

  // Direct match: MCH-001, mch-003, MCH004
  const codeMatch = text.match(/MCH-?(\d{1,3})/i);
  if (codeMatch) {
    const num = String(codeMatch[1]).padStart(3, '0');
    return `MCH-${num}`;
  }

  // Common phrases: "machine 3", "unit 4", "machine #2"
  const phraseMatch = text.match(/(?:machine|unit|equipment|mch)\s*#?\s*(\d{1,2})/i);
  if (phraseMatch) {
    const num = String(phraseMatch[1]).padStart(3, '0');
    return `MCH-${num}`;
  }

  // Name keyword heuristics
  const lower = text.toLowerCase();
  if (lower.includes('milling') || lower.includes('cnc')) return 'MCH-001';
  if (lower.includes('press') || lower.includes('stamping')) return 'MCH-002';
  if (lower.includes('pump') || lower.includes('slurry')) return 'MCH-003';
  if (lower.includes('compressor')) return 'MCH-004';
  if (lower.includes('robot') || lower.includes('welder')) return 'MCH-005';
  if (lower.includes('conveyor') || lower.includes('belt')) return 'MCH-006';
  if (lower.includes('molding') || lower.includes('plastics')) return 'MCH-007';
  if (lower.includes('blower') || lower.includes('exhaust') || lower.includes('fan')) return 'MCH-008';

  return null;
}

/**
 * Builds grounded database context for the LLM
 */
export async function buildChatContext(intent, targetMachineId) {
  let contextText = '';
  let sourcesUsed = '';

  // 1. Specific Machine Context
  if (targetMachineId) {
    const machine = await Machine.findOne({ machineId: targetMachineId });

    if (machine) {
      // Last 10 telemetry readings
      const telemetry = await Telemetry.find({ machineId: targetMachineId })
        .sort({ timestamp: -1 })
        .limit(10);

      // Active anomalies
      const anomalies = await Anomaly.find({
        machineId: targetMachineId,
        status: { $in: ['open', 'acknowledged'] },
      }).sort({ timestamp: -1 }).limit(5);

      // Open tickets
      const tickets = await Ticket.find({
        machineId: targetMachineId,
        status: { $in: ['Open', 'In Progress'] },
      }).sort({ createdAt: -1 });

      contextText += `=== TARGET MACHINE: ${machine.machineId} (${machine.name}) ===\n`;
      contextText += `Type: ${machine.type} | Location: ${machine.location}\n`;
      contextText += `Operating Status: ${machine.status} | Health Score: ${machine.healthScore}% | Risk Level: ${machine.riskLevel}\n`;
      contextText += `Estimated Remaining Useful Life (RUL): ${machine.rul} operating hours\n`;
      contextText += `Degrading Component / Sensor: ${machine.primaryDegradingSensor}\n`;
      contextText += `Safety Thresholds: Vibration: ${machine.thresholds?.vibration} mm/s, Temp: ${machine.thresholds?.temperature}°C, Current: ${machine.thresholds?.current}A, Pressure: ${machine.thresholds?.pressure} bar\n\n`;

      if (telemetry.length > 0) {
        contextText += `--- RECENT TELEMETRY (Last ${telemetry.length} readings, latest first) ---\n`;
        telemetry.forEach((t, i) => {
          contextText += `[${t.timestamp.toISOString().substring(11, 19)}] Vib: ${t.vibration} mm/s | Temp: ${t.temperature}°C | Current: ${t.current}A | Press: ${t.pressure} bar | RPM: ${t.rpm}\n`;
        });
        contextText += '\n';
      } else {
        contextText += `No recent telemetry streamed yet for this machine.\n\n`;
      }

      if (anomalies.length > 0) {
        contextText += `--- ACTIVE ANOMALIES (${anomalies.length} found) ---\n`;
        anomalies.forEach((a) => {
          contextText += `• [${a.severity.toUpperCase()}] Sensor: ${a.sensor} (Score: ${a.score}σ) - Value: ${a.value} (Mean: ${a.mean}, Threshold: ${a.threshold})\n  Explanation: ${a.explanation}\n`;
        });
        contextText += '\n';
      } else {
        contextText += `No active unaddressed anomalies for ${machine.machineId}.\n\n`;
      }

      if (tickets.length > 0) {
        contextText += `--- OPEN MAINTENANCE TICKETS (${tickets.length}) ---\n`;
        tickets.forEach((t) => {
          contextText += `• Ticket ${t.ticketId} [${t.priority}]: Status: ${t.status}, Assigned to: ${t.assignedTo}\n  Notes: ${t.notes.join(' | ')}\n`;
        });
      }

      sourcesUsed = `Machine ${machine.machineId} (${machine.name}), last ${telemetry.length} readings, ${anomalies.length} active alerts, ${tickets.length} tickets`;
      return { contextText, sourcesUsed, machine };
    }
  }

  // 2. Fleet Overview Context (if no single machine or fleet_risk intent)
  const machines = await Machine.find({}).sort({ healthScore: 1 });
  const criticalAnomalies = await Anomaly.find({
    status: { $in: ['open', 'acknowledged'] },
  }).sort({ timestamp: -1 }).limit(8);

  const openTickets = await Ticket.find({
    status: { $in: ['Open', 'In Progress'] },
  }).sort({ createdAt: -1 }).limit(6);

  contextText += `=== FLEET OVERVIEW (${machines.length} Total Machines) ===\n`;
  const atRisk = machines.filter((m) => m.status !== 'Optimal' || m.healthScore < 80);

  if (atRisk.length > 0) {
    contextText += `Machines Requiring Attention (${atRisk.length}):\n`;
    atRisk.forEach((m) => {
      contextText += `• ${m.machineId}: ${m.name} (${m.type}) - Status: ${m.status}, Health: ${m.healthScore}%, RUL: ${m.rul}h, Risk: ${m.riskLevel}, Degrading: ${m.primaryDegradingSensor}\n`;
    });
  } else {
    contextText += `All machines currently running in Optimal nominal operating condition.\n`;
  }
  contextText += '\n';

  if (criticalAnomalies.length > 0) {
    contextText += `--- RECENT FLEET ALERTS (${criticalAnomalies.length}) ---\n`;
    criticalAnomalies.forEach((a) => {
      contextText += `• [${a.severity.toUpperCase()}] ${a.machineId} (${a.sensor}): ${a.explanation}\n`;
    });
    contextText += '\n';
  }

  if (openTickets.length > 0) {
    contextText += `--- OPEN WORK ORDERS (${openTickets.length}) ---\n`;
    openTickets.forEach((t) => {
      contextText += `• ${t.ticketId} on ${t.machineId} [${t.priority}]: ${t.status} (Assigned: ${t.assignedTo})\n`;
    });
  }

  sourcesUsed = `Fleet telemetry database (${machines.length} units, ${criticalAnomalies.length} active alerts, ${openTickets.length} open tickets)`;
  return { contextText, sourcesUsed, machine: null };
}
