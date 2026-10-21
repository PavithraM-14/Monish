import React, { useState } from 'react';
import {
  ArrowLeft,
  Cpu,
  Settings,
  AlertTriangle,
  Wrench,
  Clock,
  Activity,
  Plus,
  CheckCircle,
  Eye,
  PlusCircle,
} from 'lucide-react';
import MachineChart from '../components/MachineChart';
import MachineModal from '../components/MachineModal';
import WorkOrderDetailModal from '../components/WorkOrderDetailModal';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';
import ReportIssueModal from '../components/ReportIssueModal';
import { useMachineDetail } from '../hooks/useMachines';
import { useTelemetry } from '../hooks/useTelemetry';
import { useAuth } from '../context/AuthContext';

export default function MachineDetail({ machineId, onBack }) {
  const { isAdmin, isEngineer } = useAuth();
  const [timeRange, setTimeRange] = useState('1h');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: detailData, isLoading, refetch } = useMachineDetail(machineId);

  // Live telemetry stream for this machine
  const { data: telemetry = [] } = useTelemetry({
    machineId,
    range: timeRange,
    limit: 80,
    reverse: 'true',
  });

  const machine = detailData?.machine;
  const anomalies = detailData?.anomalies || [];
  const tickets = detailData?.tickets || [];
  const latestTelemetry = detailData?.latestTelemetry;

  const handleOpenTicketView = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  if (isLoading || !machine) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        Loading equipment telemetry diagnostics...
      </div>
    );
  }

  return (
    <div>
      {/* Top Navigation / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Fleet Overview</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditModalOpen(true)}>
                <Settings size={15} />
                <span>Configure Safety Limits</span>
              </button>

              <button className="btn btn-primary btn-sm" onClick={() => setIsCreateTicketOpen(true)}>
                <Plus size={15} />
                <span>Dispatch Work Order</span>
              </button>
            </>
          )}

          {isEngineer && (
            <button className="btn btn-primary btn-sm" onClick={() => setIsReportIssueOpen(true)}>
              <PlusCircle size={15} />
              <span>Report Field Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Machine Summary Header Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className={`status-pill status-${machine.status?.toLowerCase() || 'optimal'}`}>
              {machine.status}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontWeight: 700 }}>
              {machine.machineId}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&bull; {machine.type}</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            {machine.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Location: <strong style={{ color: 'var(--text-main)' }}>{machine.location}</strong> &bull; Commissioned: {new Date(machine.installDate).toLocaleDateString()}
          </p>
        </div>

        {/* Health Score Gauge */}
        <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Condition Index</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: (machine.healthScore || 100) < 70 ? '#ffb020' : '#20c997' }}>
              {machine.healthScore || 100}%
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#142238', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div
              style={{
                width: `${machine.healthScore || 100}%`,
                height: '100%',
                background: (machine.healthScore || 100) < 60 ? '#ff4d5e' : (machine.healthScore || 100) < 80 ? '#ffb020' : '#20c997',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Degradation: <strong style={{ color: '#ffb020', textTransform: 'capitalize' }}>{machine.primaryDegradingSensor || 'None'}</strong></span>
            <span>Risk: <strong style={{ color: machine.riskLevel === 'Critical' ? '#ff4d5e' : '#20c997' }}>{machine.riskLevel || 'Low'}</strong></span>
          </div>
        </div>

        {/* Estimated RUL Banner */}
        <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            Estimated Remaining Life
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: '#00d4ff' }}>
            {machine.rul || 4500}h
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9aa9bc', marginTop: '4px' }}>
            Based on Weibull &amp; ML degradation
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Graph & Calibrated Parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={17} color="#00d4ff" />
              <span>Multi-Sensor Condition Stream</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
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
            thresholds={machine.thresholds || {}}
            machineName={machine.name}
          />
        </div>

        {/* Calibrated Safety Bounds & Latest Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Safety Threshold Baselines
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vibration Threshold</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>{machine.thresholds?.vibration} mm/s</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Temperature Ceiling</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffb020' }}>{machine.thresholds?.temperature} °C</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Limit</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#8b5cf6' }}>{machine.thresholds?.current} A</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pressure Limit</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1677ff' }}>{machine.thresholds?.pressure} bar</span>
              </div>
            </div>
          </div>

          {latestTelemetry && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
                Latest Sensor Readout
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Vibration</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#00d4ff', fontFamily: 'var(--font-mono)' }}>
                    {latestTelemetry.vibration?.toFixed(2)} mm/s
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Temperature</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffb020', fontFamily: 'var(--font-mono)' }}>
                    {latestTelemetry.temperature?.toFixed(1)} °C
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Current</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
                    {latestTelemetry.current?.toFixed(1)} A
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Pressure</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1677ff', fontFamily: 'var(--font-mono)' }}>
                    {latestTelemetry.pressure?.toFixed(1)} bar
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies & Active Work Orders for this Machine */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Machine Anomalies */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertTriangle size={18} color="#ffb020" />
            <span>Telemetry Anomalies ({anomalies.length})</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {anomalies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <CheckCircle size={24} color="#20c997" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                No statistical anomalies detected on this unit.
              </div>
            ) : (
              anomalies.map((a) => (
                <div key={a._id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className={`status-pill status-${a.severity}`}>{a.severity}</span>
                    <span style={{ fontSize: '0.72rem', color: '#9aa9bc' }}>{new Date(a.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.explanation}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Machine Work Orders */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} color="#00d4ff" />
              <span>Assigned Work Orders ({tickets.length})</span>
            </h3>

            {isAdmin && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCreateTicketOpen(true)}
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                + Dispatch
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active work orders for this machine.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t._id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#00d4ff' }}>
                        {t.ticketId}
                      </span>
                      <span className={`status-pill status-${t.status.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                        {t.status}
                      </span>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenTicketView(t)}
                      style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {t.title}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Priority: <strong style={{ color: t.priority === 'CRITICAL' ? '#ff4d5e' : '#ffb020' }}>{t.priority}</strong> &bull; Assigned to: <strong>{t.assignedTo}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Machine Modal for Safety Limit Calibration */}
      <MachineModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        machine={machine}
        onSuccess={refetch}
      />

      {/* Work Order Detail Modal with Lifecycle Actions */}
      <WorkOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        initialTicket={selectedTicket}
        ticketId={selectedTicket?._id}
        onRefresh={refetch}
      />

      {/* Create Work Order Modal for Admin */}
      <CreateWorkOrderModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        initialMachineId={machine.machineId}
        onSuccess={refetch}
      />

      {/* Report Issue Modal for Engineer */}
      <ReportIssueModal
        isOpen={isReportIssueOpen}
        onClose={() => setIsReportIssueOpen(false)}
        initialMachineId={machine.machineId}
        onSuccess={refetch}
      />
    </div>
  );
}
