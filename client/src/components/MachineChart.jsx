import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';

export default function MachineChart({ telemetry = [], thresholds = {}, machineName = '' }) {
  const [activeSensor, setActiveSensor] = useState('all');

  // Format timestamp for chart X-axis
  const chartData = telemetry.map((d) => ({
    ...d,
    timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const sensorsConfig = {
    vibration: { name: 'Vibration (mm/s)', color: '#06b6d4', threshold: thresholds.vibration, unit: 'mm/s' },
    temperature: { name: 'Temperature (°C)', color: '#f59e0b', threshold: thresholds.temperature, unit: '°C' },
    current: { name: 'Current (A)', color: '#8b5cf6', threshold: thresholds.current, unit: 'A' },
    pressure: { name: 'Pressure (bar)', color: '#3b82f6', threshold: thresholds.pressure, unit: 'bar' },
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Real-Time Multi-Sensor Telemetry Stream
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {machineName ? `Monitoring ${machineName}` : 'Live Sensor Dynamics'} &bull; Polling every 5s
          </p>
        </div>

        {/* Sensor selector tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-input)', padding: '4px', borderRadius: '8px' }}>
          {['all', 'vibration', 'temperature', 'current', 'pressure'].map((s) => (
            <button
              key={s}
              onClick={() => setActiveSensor(s)}
              style={{
                background: activeSensor === s ? '#2563eb' : 'transparent',
                color: activeSensor === s ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        {chartData.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            Awaiting streaming telemetry data from simulator...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2a3f" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#2b3952',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  fontSize: '0.82rem',
                }}
                labelStyle={{ color: '#93c5fd', fontWeight: 600, marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />

              {/* Show Vibration */}
              {(activeSensor === 'all' || activeSensor === 'vibration') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration (mm/s)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {thresholds.vibration && activeSensor === 'vibration' && (
                    <ReferenceLine
                      y={thresholds.vibration}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `Limit: ${thresholds.vibration} mm/s`, fill: '#f87171', fontSize: 11 }}
                    />
                  )}
                </>
              )}

              {/* Show Temperature */}
              {(activeSensor === 'all' || activeSensor === 'temperature') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature (°C)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {thresholds.temperature && activeSensor === 'temperature' && (
                    <ReferenceLine
                      y={thresholds.temperature}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `Limit: ${thresholds.temperature}°C`, fill: '#f87171', fontSize: 11 }}
                    />
                  )}
                </>
              )}

              {/* Show Current */}
              {(activeSensor === 'all' || activeSensor === 'current') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="Current (A)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {thresholds.current && activeSensor === 'current' && (
                    <ReferenceLine
                      y={thresholds.current}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `Limit: ${thresholds.current}A`, fill: '#f87171', fontSize: 11 }}
                    />
                  )}
                </>
              )}

              {/* Show Pressure */}
              {(activeSensor === 'all' || activeSensor === 'pressure') && (
                <>
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    name="Pressure (bar)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {thresholds.pressure && activeSensor === 'pressure' && (
                    <ReferenceLine
                      y={thresholds.pressure}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `Limit: ${thresholds.pressure} bar`, fill: '#f87171', fontSize: 11 }}
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
