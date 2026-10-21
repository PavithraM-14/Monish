import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Send,
  PlusCircle,
  Cpu,
  Layers,
  Calendar,
  ChevronRight,
  TrendingDown,
  Eye,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import { useAuth } from '../context/AuthContext';
import { ticketsApi } from '../api/ticketsApi';
import { useMachines } from '../hooks/useMachines';

export default function EngineerDashboard({
  onNavigateToTickets,
  onNavigateToActiveMaintenance,
  onNavigateToHistory,
  onNavigateToMachine,
  onOpenReportIssue,
  onViewTicket,
}) {
  const { user } = useAuth();
  const { data: machines = [] } = useMachines();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch engineer's specific tickets & stats
  const fetchEngineerData = async () => {
    setLoading(true);
    try {
      const [statsData, ticketsData] = await Promise.all([
        ticketsApi.getTicketStats(),
        ticketsApi.getTickets({}),
      ]);
      setStats(statsData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('Failed to load engineer dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineerData();
  }, []);

  // Filter lists
  const newOrders = tickets.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'OPEN'
  );
  const acceptedOrders = tickets.filter((t) => t.status === 'ACCEPTED');
  const inProgressOrders = tickets.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'TESTING' || t.status === 'REWORK'
  );
  const awaitingReviewOrders = tickets.filter(
    (t) => t.status === 'RESOLUTION_SUBMITTED'
  );
  const completedOrders = tickets.filter(
    (t) => t.status === 'APPROVED' || t.status === 'CLOSED'
  );

  // Quick action: Accept ticket
  const handleAcceptTicket = async (ticketId, e) => {
    e.stopPropagation();
    try {
      await ticketsApi.acceptTicket(ticketId, 'Work order accepted by field engineer.');
      await fetchEngineerData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept work order.');
    }
  };

  // Quick action: Start maintenance
  const handleStartTicket = async (ticketId, e) => {
    e.stopPropagation();
    try {
      await ticketsApi.startTicket(ticketId, 'Physical inspection and diagnostic maintenance started.');
      await fetchEngineerData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start maintenance.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
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
            Engineer Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            <span style={{ color: '#00d4ff', fontWeight: 600 }}>{user?.name || 'Engineer'}</span> · Your assigned maintenance queue &amp; condition monitoring
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={onOpenReportIssue}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={16} />
            <span>Report Field Issue</span>
          </button>
        </div>
      </div>

      {/* 6 Clickable KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* 1. NEW WORK ORDERS */}
        <KPICard
          title="NEW WORK ORDERS"
          value={newOrders.length}
          subtext="Requires acceptance"
          icon={AlertTriangle}
          color="#ff4d5e"
          badge="Action Req"
          onClick={() => onNavigateToTickets('ASSIGNED')}
        />

        {/* 2. ACCEPTED */}
        <KPICard
          title="ACCEPTED"
          value={acceptedOrders.length}
          subtext="Ready to begin work"
          icon={Clock}
          color="#ffb020"
          badge="Queued"
          onClick={() => onNavigateToTickets('ACCEPTED')}
        />

        {/* 3. IN PROGRESS */}
        <KPICard
          title="IN PROGRESS"
          value={inProgressOrders.length}
          subtext="Active servicing & tests"
          icon={Wrench}
          color="#00d4ff"
          badge="Active"
          onClick={() => onNavigateToActiveMaintenance()}
        />

        {/* 4. DUE TODAY */}
        <KPICard
          title="DUE TODAY"
          value={
            tickets.filter((t) => {
              if (!t.dueDate || t.status === 'CLOSED' || t.status === 'APPROVED') return false;
              const due = new Date(t.dueDate);
              const now = new Date();
              return due.toDateString() === now.toDateString() || due < now;
            }).length || 1
          }
          subtext="Scheduled deadlines"
          icon={Calendar}
          color="#1677ff"
          badge="Target"
          onClick={() => onNavigateToTickets('ALL')}
        />

        {/* 5. AWAITING ADMIN REVIEW */}
        <KPICard
          title="AWAITING REVIEW"
          value={awaitingReviewOrders.length}
          subtext="Resolution submitted"
          icon={Layers}
          color="#8b5cf6"
          badge="Under Review"
          onClick={() => onNavigateToTickets('RESOLUTION_SUBMITTED')}
        />

        {/* 6. COMPLETED */}
        <KPICard
          title="COMPLETED"
          value={completedOrders.length}
          subtext="Approved & signed off"
          icon={CheckCircle}
          color="#20c997"
          badge="Audited"
          onClick={() => onNavigateToHistory('COMPLETED')}
        />
      </div>

      {/* Main Grid: Urgent Orders & Active Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '24px', marginBottom: '24px' }}>
        {/* Urgent Work Orders Pending Action */}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
            >
              <AlertTriangle size={18} color="#ffb020" />
              <span>Urgent Work Orders Awaiting Dispatch / Start</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTickets('ALL')}
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
            >
              All Orders
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {[...newOrders, ...acceptedOrders].length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>
                <CheckCircle size={28} color="#20c997" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                No unstarted work orders. Your active maintenance pipeline is up to date!
              </div>
            ) : (
              [...newOrders, ...acceptedOrders].slice(0, 4).map((t) => (
                <div
                  key={t._id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#00d4ff' }}>
                        {t.ticketId}
                      </span>
                      <span className={`status-pill status-${t.status.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {t.status}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: t.priority === 'CRITICAL' ? 'rgba(255, 77, 94, 0.2)' : 'rgba(255, 176, 32, 0.2)',
                          color: t.priority === 'CRITICAL' ? '#ff8591' : '#ffb020',
                        }}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {t.status === 'ASSIGNED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#20c997' }}
                          onClick={(e) => handleAcceptTicket(t._id, e)}
                        >
                          Accept
                        </button>
                      )}
                      {t.status === 'ACCEPTED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                          onClick={(e) => handleStartTicket(t._id, e)}
                        >
                          <Play size={12} style={{ marginRight: 3 }} />
                          Start
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onViewTicket(t)}
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {t.title || t.machineName}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Target Machine: <strong style={{ color: '#00d4ff' }}>{t.machineId}</strong></span>
                    <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Immediate'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Maintenance in Servicing */}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
            >
              <Wrench size={18} color="#00d4ff" />
              <span>Active Maintenance Execution ({inProgressOrders.length})</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToActiveMaintenance()}
              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
            >
              Manage All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {inProgressOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', fontSize: '0.85rem' }}>
                No work orders currently in servicing. Accept and start an order from your queue to begin maintenance.
              </div>
            ) : (
              inProgressOrders.map((t) => (
                <div
                  key={t._id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.86rem', color: '#00d4ff' }}>
                        {t.ticketId}
                      </span>
                      <span style={{ marginLeft: '8px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {t.title}
                      </span>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewTicket(t)}
                      style={{ padding: '3px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} />
                      <span>View &amp; Update</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Machine: <strong style={{ color: 'var(--text-main)' }}>{t.machineId}</strong> &bull; Status: <span className={`status-pill status-${t.status.toLowerCase()}`}>{t.status}</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Servicing Completion</span>
                      <span style={{ fontWeight: 700, color: '#00d4ff' }}>{t.progress || 0}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#142238', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${t.progress || 0}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #1677ff, #00d4ff)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  {t.findings && (
                    <div style={{ marginTop: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px' }}>
                      Findings: {t.findings}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assigned Machines Condition Monitoring Snapshot */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Cpu size={18} color="#20c997" />
            <span>Assigned Fleet Equipment Condition Snapshot</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Live sensor readouts &amp; health scores
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {machines.slice(0, 4).map((m) => (
            <div
              key={m.machineId}
              onClick={() => onNavigateToMachine(m.machineId)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#00d4ff' }}>
                  {m.machineId}
                </span>
                <span className={`status-pill status-${m.status?.toLowerCase() || 'optimal'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  {m.status}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                {m.name}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <div>Health: <strong style={{ color: (m.healthScore || 100) < 70 ? '#ffb020' : '#20c997' }}>{m.healthScore || 100}%</strong></div>
                <div>RUL: <strong style={{ color: '#00d4ff' }}>{m.rul || 4500}h</strong></div>
                <div>Location: {m.location}</div>
                <div>Risk: <strong style={{ color: m.riskLevel === 'Critical' ? '#ff4d5e' : '#20c997' }}>{m.riskLevel || 'Low'}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
