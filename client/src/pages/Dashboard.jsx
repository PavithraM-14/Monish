import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  TrendingDown,
  Cpu,
  Layers,
  Wrench,
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import MachineChart from '../components/MachineChart';
import { useMachineStats, useMachines } from '../hooks/useMachines';
import { useTelemetry } from '../hooks/useTelemetry';
import { useAnomalies, useUpdateAnomalyStatus } from '../hooks/useAnomalies';
import { useAuth } from '../context/AuthContext';
import { activitiesApi } from '../api/activitiesApi';

export default function Dashboard({
  onNavigateToMachines,
  onNavigateToTickets,
  onNavigateToIssues,
  onNavigateToHistory,
  onNavigateToMachine,
  onOpenCreateTicket,
}) {
  const { isAdmin } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useMachineStats();
  const { data: machines = [] } = useMachines();
  const [selectedMachineId, setSelectedMachineId] = useState('MCH-003');
  const [timeRange, setTimeRange] = useState('1h');
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Live telemetry for selected machine
  const { data: telemetry = [] } = useTelemetry({
    machineId: selectedMachineId,
    range: timeRange,
    limit: 60,
    reverse: 'true',
  });

  // Recent anomalies
  const { data: alerts = [], refetch: refetchAlerts } = useAnomalies({ limit: 6 });
  const updateAnomalyStatus = useUpdateAnomalyStatus();

  // Load activities feed
  const loadActivities = async () => {
    setActivitiesLoading(true);
    try {
      const data = await activitiesApi.getActivities({ limit: 6 });
      setRecentActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activity stream:', err.message);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const selectedMachine = machines.find((m) => m.machineId === selectedMachineId) || machines[0];

  const handleResolveAlert = (alertId) => {
    updateAnomalyStatus.mutate(
      { id: alertId, status: 'resolved' },
      { onSuccess: () => { refetchAlerts(); refetchStats(); } }
    );
  };

  const handleAcknowledgeAlert = (alertId) => {
    updateAnomalyStatus.mutate(
      { id: alertId, status: 'acknowledged' },
      { onSuccess: () => { refetchAlerts(); refetchStats(); } }
    );
  };

  // Safe percentage helper
  const total = stats?.total || machines.length || 8;
  const healthy = stats?.healthy || 5;
  const warning = stats?.warning || 2;
  const critical = stats?.critical || 1;
  const healthyPct = Math.round((healthy / (total || 1)) * 100);
  const warningPct = Math.round((warning / (total || 1)) * 100);
  const activeAlerts = stats?.activeAlerts ?? 2;
  const openWOs = stats?.openWorkOrders ?? 3;
  const awaitingReview = stats?.awaitingReview ?? 1;
  const completedMaint = stats?.completedMaintenance ?? 4;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Predictive Maintenance Operations Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Fleet reliability, AI signals, predictive diagnostics and maintenance dispatch
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(32, 201, 151, 0.1)',
              border: '1px solid rgba(32, 201, 151, 0.3)',
              borderRadius: '20px',
              fontSize: '0.78rem',
              color: '#20c997',
              fontWeight: 600,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#20c997' }}></span>
            Telemetry Ingestion: Active (5s Poll)
          </span>

          {isAdmin && onOpenCreateTicket && (
            <button className="btn btn-primary btn-sm" onClick={() => onOpenCreateTicket()}>
              <Plus size={15} />
              <span>Dispatch Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* 8 Clickable KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* 1. TOTAL MACHINES */}
        <KPICard
          title="TOTAL MACHINES"
          value={total}
          subtext={`${healthy} Healthy · ${warning} Warn · ${critical} Crit`}
          icon={Cpu}
          color="#1677ff"
          badge="Fleet Registry"
          onClick={() => onNavigateToMachines('all')}
        />

        {/* 2. HEALTHY MACHINES */}
        <KPICard
          title="HEALTHY MACHINES"
          value={healthy}
          subtext={`${healthyPct}% operating normally`}
          icon={CheckCircle}
          color="#20c997"
          badge="Optimal"
          onClick={() => onNavigateToMachines('Optimal')}
        />

        {/* 3. WARNING MACHINES */}
        <KPICard
          title="WARNING MACHINES"
          value={warning}
          subtext={`${warningPct}% requires monitoring`}
          icon={TrendingDown}
          color="#ffb020"
          badge="Elevated Risk"
          onClick={() => onNavigateToMachines('Warning')}
        />

        {/* 4. CRITICAL MACHINES */}
        <KPICard
          title="CRITICAL MACHINES"
          value={critical}
          subtext="Requires immediate attention"
          icon={AlertTriangle}
          color="#ff4d5e"
          badge="Urgent"
          onClick={() => onNavigateToMachines('Critical')}
        />

        {/* 5. ACTIVE ANOMALIES */}
        <KPICard
          title="ACTIVE ANOMALIES"
          value={activeAlerts}
          subtext="Statistical limit breaches"
          icon={Activity}
          color={activeAlerts > 0 ? '#ff4d5e' : '#20c997'}
          badge={activeAlerts > 0 ? 'Triage Feed' : 'Clear'}
          onClick={() => onNavigateToIssues()}
        />

        {/* 6. OPEN WORK ORDERS */}
        <KPICard
          title="OPEN WORK ORDERS"
          value={openWOs}
          subtext="Active in dispatch queue"
          icon={Wrench}
          color="#00d4ff"
          badge="Queue"
          onClick={() => onNavigateToTickets('OPEN')}
        />

        {/* 7. AWAITING ADMIN REVIEW */}
        <KPICard
          title="AWAITING REVIEW"
          value={awaitingReview}
          subtext="Resolution submitted"
          icon={Clock}
          color="#8b5cf6"
          badge="Action Req"
          onClick={() => onNavigateToTickets('RESOLUTION_SUBMITTED')}
        />

        {/* 8. COMPLETED MAINTENANCE */}
        <KPICard
          title="COMPLETED MAINT"
          value={completedMaint}
          subtext="Verified & closed tickets"
          icon={ShieldCheck}
          color="#20c997"
          badge="Audited"
          onClick={() => onNavigateToHistory('COMPLETED')}
        />
      </div>

      {/* Main Monitoring & Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Interactive Telemetry Chart */}
        <div>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              background: 'var(--bg-secondary)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Focus Unit:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
              >
                {machines.map((m) => (
                  <option key={m.machineId} value={m.machineId}>
                    {m.machineId} — {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 4 }}>Window:</span>
              {['15m', '1h', '6h', '24h'].map((r) => (
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
          </div>

          <MachineChart
            telemetry={telemetry}
            thresholds={selectedMachine?.thresholds || {}}
            machineName={selectedMachine ? `${selectedMachine.machineId} (${selectedMachine.name})` : ''}
          />
        </div>

        {/* Right: Selected Machine Health Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className={`status-pill status-${selectedMachine?.status?.toLowerCase() || 'optimal'}`}>
                {selectedMachine?.status || 'Optimal'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedMachine?.location}</span>
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              {selectedMachine?.name}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
              {selectedMachine?.machineId} &bull; {selectedMachine?.type}
            </div>

            {/* Health Meter */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Health Index</span>
                <span style={{ fontWeight: 700, color: (selectedMachine?.healthScore || 100) < 70 ? '#ffb020' : '#20c997' }}>
                  {selectedMachine?.healthScore ?? 94}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#142238', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${selectedMachine?.healthScore ?? 94}%`,
                    height: '100%',
                    background:
                      (selectedMachine?.healthScore || 100) < 60
                        ? '#ff4d5e'
                        : (selectedMachine?.healthScore || 100) < 80
                        ? '#ffb020'
                        : '#20c997',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* RUL & Details */}
            <div
              style={{
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated RUL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                  {selectedMachine?.rul || 4500} Operating Hours
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Degrading Vector</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffb020', textTransform: 'capitalize' }}>
                  {selectedMachine?.primaryDegradingSensor || 'Nominal'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Category</span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: selectedMachine?.riskLevel === 'Critical' ? '#ff4d5e' : selectedMachine?.riskLevel === 'Medium' ? '#ffb020' : '#20c997',
                  }}
                >
                  {selectedMachine?.riskLevel || 'Low'}
                </span>
              </div>
            </div>

            {/* Threshold limits list */}
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Calibrated Limits
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px', fontSize: '0.78rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>Vib: <strong style={{ color: '#00d4ff' }}>{selectedMachine?.thresholds?.vibration} mm/s</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>Temp: <strong style={{ color: '#ffb020' }}>{selectedMachine?.thresholds?.temperature}°C</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>Curr: <strong style={{ color: '#8b5cf6' }}>{selectedMachine?.thresholds?.current}A</strong></div>
                <div style={{ color: 'var(--text-muted)' }}>Press: <strong style={{ color: '#1677ff' }}>{selectedMachine?.thresholds?.pressure} bar</strong></div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => onNavigateToMachine(selectedMachine?.machineId)}
            style={{ width: '100%', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span>Machine Diagnostics Deep Dive</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Fleet Overview Grid, Active Anomaly Feed & Operational Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px' }}>
        {/* Fleet Quick Status Cards */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="#00d4ff" />
              <span>Fleet Telemetry ({machines.length} Units)</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToMachines('all')}
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
            >
              Full Registry
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {machines.slice(0, 6).map((m) => (
              <div
                key={m.machineId}
                onClick={() => setSelectedMachineId(m.machineId)}
                style={{
                  background: m.machineId === selectedMachineId ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  border: m.machineId === selectedMachineId ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.84rem', color: '#00d4ff' }}>
                      {m.machineId}
                    </span>
                    <span className={`status-pill status-${m.status?.toLowerCase() || 'optimal'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      {m.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {m.name}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>Health: <strong style={{ color: (m.healthScore || 100) < 70 ? '#ffb020' : '#20c997' }}>{m.healthScore || 100}%</strong></div>
                  <div>RUL: <strong style={{ color: '#00d4ff' }}>{m.rul || 4500}h</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Explainable Anomaly Feed */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#ffb020" />
              <span>Statistical Anomaly Feed</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToIssues}
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
            >
              Intimations
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>
                <CheckCircle size={28} color="#20c997" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                No active anomalies. All machines operating inside calibrated baseline bounds.
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a._id}
                  style={{
                    background: 'var(--bg-input)',
                    borderLeft: `4px solid ${
                      a.severity === 'critical'
                        ? '#ff4d5e'
                        : a.severity === 'high'
                        ? '#ffb020'
                        : '#1677ff'
                    }`,
                    borderTop: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: '#00d4ff' }}>
                        {a.machineId}
                      </span>
                      <span className={`status-pill status-${a.severity}`} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                        {a.severity}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {a.status === 'open' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                          onClick={() => handleAcknowledgeAlert(a._id)}
                          title="Acknowledge alert"
                        >
                          Ack
                        </button>
                      )}
                      {a.status !== 'resolved' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.68rem', color: '#20c997' }}
                          onClick={() => handleResolveAlert(a._id)}
                          title="Mark resolved"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: '4px 0' }}>
                    {a.explanation}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                    <span>Sensor: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{a.sensor}</strong></span>
                    <span>Z-Score: <strong style={{ color: '#ffb020' }}>{a.score}σ</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operational Activity Stream */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#20c997" />
              <span>Operations Audit Stream</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadActivities}
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
              title="Refresh stream"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px' }}>
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>
                No recent activity logged yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act._id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{act.actorName}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: '#00d4ff', fontSize: '0.74rem', fontWeight: 600 }}>
                    {act.action}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.74rem' }}>
                    {act.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
