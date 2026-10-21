import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Eye,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { ticketsApi } from '../api/ticketsApi';
import WorkOrderDetailModal from '../components/WorkOrderDetailModal';
import { useAuth } from '../context/AuthContext';

export default function Tickets({
  onSelectMachine,
  initialStatusFilter = 'ALL',
  initialPriorityFilter = 'ALL',
  mode = 'normal', // 'normal' or 'active-maintenance'
  onOpenCreateTicket,
  onOpenReportIssue,
}) {
  const { user, isAdmin, isEngineer } = useAuth();
  const [statusFilter, setStatusFilter] = useState(
    mode === 'active-maintenance' ? 'IN_PROGRESS' : initialStatusFilter
  );
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync if initialStatusFilter changes from outside (e.g. clicking dashboard KPI card)
  useEffect(() => {
    if (mode === 'active-maintenance') {
      setStatusFilter('IN_PROGRESS');
    } else if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter, mode]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketsApi.getTickets({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: searchTerm || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, searchTerm]);

  const handleViewTicket = (ticket, e) => {
    if (e) e.stopPropagation();
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  // Filtered in memory for instant responsiveness
  const filteredTickets = tickets.filter((t) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = t.ticketId?.toLowerCase().includes(term);
      const matchMachine = t.machineId?.toLowerCase().includes(term);
      const matchTitle = t.title?.toLowerCase().includes(term);
      const matchEng = t.assignedTo?.toLowerCase().includes(term);
      if (!matchId && !matchMachine && !matchTitle && !matchEng) return false;
    }
    return true;
  });

  const statuses = [
    'ALL',
    'OPEN',
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
    'TESTING',
    'RESOLUTION_SUBMITTED',
    'REWORK',
    'APPROVED',
    'CLOSED',
  ];

  return (
    <div>
      {/* Page Header */}
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
            {mode === 'active-maintenance'
              ? 'Active Maintenance Operations'
              : isAdmin
              ? 'Fleet Work Orders & Dispatch'
              : 'My Assigned Work Orders'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {mode === 'active-maintenance'
              ? 'Currently executing repairs, calibration cycles, and testing verification'
              : isAdmin
              ? 'Manage maintenance lifecycle, assign technicians, review submitted resolutions, and close orders'
              : 'Inspect assigned tasks, log diagnostic findings, update progress, and submit work orders for approval'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && onOpenCreateTicket && (
            <button className="btn btn-primary" onClick={() => onOpenCreateTicket()}>
              <Plus size={16} />
              <span>Dispatch Work Order</span>
            </button>
          )}

          {isEngineer && onOpenReportIssue && (
            <button className="btn btn-primary" onClick={onOpenReportIssue}>
              <Plus size={16} />
              <span>Report Field Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              background: statusFilter === st ? '#1677ff' : 'var(--bg-secondary)',
              color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === st ? '#1677ff' : 'var(--border-color)'}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="#9aa9bc" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by WO-ID, machine, title, or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              style={{
                background: priorityFilter === p ? '#142238' : 'var(--bg-card)',
                color: priorityFilter === p ? '#00d4ff' : 'var(--text-muted)',
                border: `1px solid ${priorityFilter === p ? '#00d4ff' : 'var(--border-color)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr
              style={{
                background: 'var(--bg-input)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '14px 18px' }}>Work Order ID</th>
              <th style={{ padding: '14px 18px' }}>Target Machine</th>
              <th style={{ padding: '14px 18px' }}>Title &amp; Scope</th>
              <th style={{ padding: '14px 18px' }}>Priority</th>
              <th style={{ padding: '14px 18px' }}>Assigned Engineer</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Progress</th>
              <th style={{ padding: '14px 18px' }}>Due Date</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading work orders from registry...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No work orders found matching selected filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => (
                <tr
                  key={t._id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleViewTicket(t)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '14px 18px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: '#00d4ff',
                    }}
                  >
                    {t.ticketId}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMachine(t.machineId);
                      }}
                      style={{
                        cursor: 'pointer',
                        color: '#00d4ff',
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      {t.machineId}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', maxWidth: '220px' }}>
                    <div
                      style={{
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.title || 'Maintenance Task'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background:
                          t.priority === 'CRITICAL'
                            ? 'rgba(255, 77, 94, 0.2)'
                            : t.priority === 'HIGH'
                            ? 'rgba(255, 176, 32, 0.2)'
                            : 'rgba(22, 119, 255, 0.2)',
                        color:
                          t.priority === 'CRITICAL'
                            ? '#ff8591'
                            : t.priority === 'HIGH'
                            ? '#ffb020'
                            : '#60a5fa',
                      }}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} color="#9aa9bc" />
                      <span>{t.assignedTo || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      className={`status-pill status-${t.status.toLowerCase()}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', minWidth: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: '#142238',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${t.progress || 0}%`,
                            height: '100%',
                            background: '#00d4ff',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {t.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleViewTicket(t, e)}
                      style={{
                        padding: '4px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Work Order Detail Modal with Working Lifecycle Actions */}
      <WorkOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        initialTicket={selectedTicket}
        ticketId={selectedTicket?._id}
        onRefresh={loadTickets}
        onNavigateToMachine={onSelectMachine}
      />
    </div>
  );
}
