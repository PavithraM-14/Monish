import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Cpu,
  Wrench,
  CheckCircle,
  Layers,
  Clock,
  User,
} from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useMachines } from '../hooks/useMachines';
import { telemetryApi } from '../api/telemetryApi';
import { ticketsApi } from '../api/ticketsApi';
import { activitiesApi } from '../api/activitiesApi';
import { useAuth } from '../context/AuthContext';

export default function LogExplorer({ initialTab = 'telemetry' }) {
  const { user, isAdmin, isEngineer } = useAuth();
  const { data: machines = [] } = useMachines();

  const [activeTab, setActiveTab] = useState(
    initialTab === 'COMPLETED' ? 'maintenance' : initialTab
  );

  useEffect(() => {
    if (initialTab === 'COMPLETED') {
      setActiveTab('maintenance');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Tab 1: Telemetry State
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');
  const [limit, setLimit] = useState(100);

  const { data: telemetry = [], isLoading: telemetryLoading, refetch: refetchTelemetry } = useTelemetry({
    machineId: selectedMachine,
    range: timeRange,
    limit,
    sort: 'desc',
  });

  // Tab 2: Maintenance Records State
  const [completedOrders, setCompletedOrders] = useState([]);
  const [maintLoading, setMaintLoading] = useState(false);

  // Tab 3: System Audit Log State
  const [activities, setActivities] = useState([]);
  const [actLoading, setActLoading] = useState(false);

  const loadCompletedMaintenance = async () => {
    setMaintLoading(true);
    try {
      const allTickets = await ticketsApi.getTickets({ status: 'CLOSED' });
      const approvedTickets = await ticketsApi.getTickets({ status: 'APPROVED' });
      setCompletedOrders([...approvedTickets, ...allTickets]);
    } catch (err) {
      console.error('Failed to load completed maintenance records:', err.message);
    } finally {
      setMaintLoading(false);
    }
  };

  const loadActivities = async () => {
    setActLoading(true);
    try {
      const data = await activitiesApi.getActivities({ limit: 100 });
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err.message);
    } finally {
      setActLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'maintenance') {
      loadCompletedMaintenance();
    } else if (activeTab === 'audit') {
      loadActivities();
    }
  }, [activeTab]);

  const handleExportCSV = () => {
    const exportUrl = telemetryApi.getExportUrl({
      machineId: selectedMachine,
      range: timeRange,
      limit: 1000,
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {isAdmin ? 'Historical Explorer & Audit Registry' : 'My Historical Maintenance Records'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Filter raw high-frequency sensor telemetry, inspected maintenance sign-offs, and compliance activity logs
          </p>
        </div>

        {activeTab === 'telemetry' && (
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export Dataset (CSV)</span>
          </button>
        )}
      </div>

      {/* Explorer Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            background: activeTab === 'telemetry' ? '#1677ff' : 'var(--bg-secondary)',
            color: activeTab === 'telemetry' ? '#ffffff' : 'var(--text-muted)',
            border: `1px solid ${activeTab === 'telemetry' ? '#1677ff' : 'var(--border-color)'}`,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Cpu size={15} />
          <span>Telemetry Stream Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            background: activeTab === 'maintenance' ? '#1677ff' : 'var(--bg-secondary)',
            color: activeTab === 'maintenance' ? '#ffffff' : 'var(--text-muted)',
            border: `1px solid ${activeTab === 'maintenance' ? '#1677ff' : 'var(--border-color)'}`,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Wrench size={15} />
          <span>Completed Maintenance History</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('audit')}
            style={{
              background: activeTab === 'audit' ? '#1677ff' : 'var(--bg-secondary)',
              color: activeTab === 'audit' ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${activeTab === 'audit' ? '#1677ff' : 'var(--border-color)'}`,
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={15} />
            <span>Operational Audit Trail</span>
          </button>
        )}
      </div>

      {/* TAB 1: TELEMETRY STREAM */}
      {activeTab === 'telemetry' && (
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Machine ID:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
              >
                <option value="all">All Fleet Equipment</option>
                {machines.map((m) => (
                  <option key={m.machineId} value={m.machineId}>
                    {m.machineId} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Horizon:</span>
              {['15m', '1h', '6h', '24h', '7d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  style={{
                    background: timeRange === r ? '#1677ff' : 'var(--bg-card)',
                    color: timeRange === r ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Limit:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={50}>50 points</option>
                <option value={100}>100 points</option>
                <option value={250}>250 points</option>
                <option value={500}>500 points</option>
              </select>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => refetchTelemetry()}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Table */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Retrieved <strong>{telemetry.length}</strong> time-series telemetry records
              </span>
              <span style={{ fontSize: '0.75rem', color: '#20c997' }}>
                Active Telemetry Collector
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 18px' }}>Timestamp (UTC)</th>
                  <th style={{ padding: '12px 18px' }}>Machine ID</th>
                  <th style={{ padding: '12px 18px' }}>Vibration (mm/s)</th>
                  <th style={{ padding: '12px 18px' }}>Temperature (°C)</th>
                  <th style={{ padding: '12px 18px' }}>Current (A)</th>
                  <th style={{ padding: '12px 18px' }}>Pressure (bar)</th>
                  <th style={{ padding: '12px 18px' }}>RPM</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {telemetryLoading ? 'Ingesting telemetry records...' : 'Waiting for telemetry data... (Collector is active)'}
                    </td>
                  </tr>
                ) : (
                  telemetry.map((r, i) => (
                    <tr
                      key={r._id || i}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s ease' }}
                    >
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#9aa9bc' }}>
                        {new Date(r.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                        {r.machineId}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: '#00d4ff', fontWeight: 600 }}>
                        {r.vibration.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: '#ffb020', fontWeight: 600 }}>
                        {r.temperature.toFixed(1)}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: '#8b5cf6', fontWeight: 600 }}>
                        {r.current.toFixed(1)}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: '#1677ff', fontWeight: 600 }}>
                        {r.pressure.toFixed(1)}
                      </td>
                      <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                        {Math.round(r.rpm)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETED MAINTENANCE RECORDS */}
      {activeTab === 'maintenance' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Audited Completed Maintenance &amp; Signed Off Work Orders ({completedOrders.length})
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={loadCompletedMaintenance}>
              <RefreshCw size={13} />
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Work Order ID</th>
                <th style={{ padding: '14px 18px' }}>Machine</th>
                <th style={{ padding: '14px 18px' }}>Maintenance Scope</th>
                <th style={{ padding: '14px 18px' }}>Technician</th>
                <th style={{ padding: '14px 18px' }}>Resolution Summary</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Approved Date</th>
              </tr>
            </thead>
            <tbody>
              {maintLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading maintenance records...
                  </td>
                </tr>
              ) : completedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No completed maintenance logs found.
                  </td>
                </tr>
              ) : (
                completedOrders.map((t) => (
                  <tr key={t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                      {t.ticketId}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600 }}>{t.machineId}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>{t.title}</td>
                    <td style={{ padding: '14px 18px' }}>{t.assignedTo}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', maxWidth: '260px' }}>
                      {t.resolution || 'Inspection and routine servicing concluded.'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`status-pill status-${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Immutable System Activity Audit Trail ({activities.length} Entries)
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={loadActivities}>
              <RefreshCw size={13} />
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Timestamp</th>
                <th style={{ padding: '14px 18px' }}>User / Actor</th>
                <th style={{ padding: '14px 18px' }}>Action Category</th>
                <th style={{ padding: '14px 18px' }}>Target Entity</th>
                <th style={{ padding: '14px 18px' }}>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {actLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading audit stream...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#9aa9bc' }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {a.actorName}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: 'rgba(22, 119, 255, 0.15)',
                          color: '#00d4ff',
                        }}
                      >
                        {a.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {a.targetId || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {a.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
