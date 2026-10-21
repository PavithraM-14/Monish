import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Cpu,
  Calendar,
  Send,
  RotateCcw,
  Check,
  Play,
  FileCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ticketsApi } from '../api/ticketsApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function WorkOrderDetailModal({
  isOpen,
  onClose,
  ticketId,
  initialTicket = null,
  onRefresh,
  onNavigateToMachine,
}) {
  const { user, isAdmin, isEngineer } = useAuth();
  const [ticket, setTicket] = useState(initialTicket);
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [engineers, setEngineers] = useState([]);

  // Form states for engineer action
  const [progressVal, setProgressVal] = useState(0);
  const [findingsText, setFindingsText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [noteText, setNoteText] = useState('');

  // Form states for admin action
  const [reassignEngineer, setReassignEngineer] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [adminInstructionText, setAdminInstructionText] = useState('');
  const [showReworkForm, setShowReworkForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Fetch full ticket details and engineers list
  const fetchDetails = async () => {
    if (!ticketId && !initialTicket) return;
    const idToFetch = ticketId || initialTicket?._id || initialTicket?.ticketId;
    if (!idToFetch) return;

    setLoading(true);
    try {
      const data = await ticketsApi.getTicketById(idToFetch);
      setTicket(data.ticket);
      setMachine(data.machine);
      setProgressVal(data.ticket.progress || 0);
      setFindingsText(data.ticket.findings || '');
      setResolutionText(data.ticket.resolution || '');
    } catch (err) {
      console.error('Failed to load work order detail:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
      if (isAdmin) {
        authApi.getEngineers().then((engs) => setEngineers(engs)).catch(() => {});
      }
    } else {
      setShowReworkForm(false);
      setShowAssignForm(false);
      setNoteText('');
    }
  }, [isOpen, ticketId]);

  if (!isOpen) return null;

  // Lifecycle Action Handlers
  const handleAction = async (apiCall, successMsg) => {
    setActionLoading(true);
    try {
      await apiCall();
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Engineer Lifecycle Actions
  const handleAccept = () => {
    handleAction(() => ticketsApi.acceptTicket(ticket._id), 'Work Order Accepted');
  };

  const handleStart = () => {
    handleAction(() => ticketsApi.startTicket(ticket._id), 'Maintenance Started');
  };

  const handleUpdateProgress = () => {
    handleAction(
      () =>
        ticketsApi.updateProgress(ticket._id, {
          progress: progressVal,
          findings: findingsText,
          note: noteText,
        }),
      'Progress updated'
    );
    setNoteText('');
  };

  const handleSubmitResolution = () => {
    if (!resolutionText.trim()) {
      alert('Please document the resolution before submitting.');
      return;
    }
    handleAction(
      () =>
        ticketsApi.submitResolution(ticket._id, {
          resolution: resolutionText,
          findings: findingsText,
          note: noteText,
        }),
      'Resolution Submitted'
    );
    setNoteText('');
  };

  // Admin Lifecycle Actions
  const handleApprove = () => {
    handleAction(() => ticketsApi.approveTicket(ticket._id, { note: noteText }), 'Work Order Approved');
    setNoteText('');
  };

  const handleRework = () => {
    if (!reworkReason.trim()) {
      alert('Please specify the reason for rework.');
      return;
    }
    handleAction(
      () =>
        ticketsApi.reworkTicket(ticket._id, {
          reason: reworkReason,
          instructions: adminInstructionText,
        }),
      'Rework Requested'
    );
    setShowReworkForm(false);
    setReworkReason('');
  };

  const handleClose = () => {
    handleAction(() => ticketsApi.closeTicket(ticket._id, { note: noteText }), 'Work Order Closed');
    setNoteText('');
  };

  const handleReassign = () => {
    if (!reassignEngineer) {
      alert('Please select an engineer.');
      return;
    }
    handleAction(
      () =>
        ticketsApi.assignTicket(ticket._id, {
          assignedTo: reassignEngineer,
          adminInstructions: adminInstructionText,
        }),
      'Reassigned'
    );
    setShowAssignForm(false);
  };

  const status = ticket?.status || 'OPEN';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                background: 'rgba(22, 119, 255, 0.15)',
                color: '#1677FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                  {ticket?.ticketId || 'Work Order'}
                </h2>
                <span className={`status-pill status-${status.toLowerCase()}`}>
                  {status}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background:
                      ticket?.priority === 'CRITICAL'
                        ? 'rgba(255, 77, 94, 0.18)'
                        : ticket?.priority === 'HIGH'
                        ? 'rgba(255, 176, 32, 0.18)'
                        : 'rgba(22, 119, 255, 0.18)',
                    color:
                      ticket?.priority === 'CRITICAL'
                        ? '#FF4D5E'
                        : ticket?.priority === 'HIGH'
                        ? '#FFB020'
                        : '#1677FF',
                  }}
                >
                  {ticket?.priority || 'MEDIUM'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {ticket?.title}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading work order specifications...
          </div>
        ) : (
          <div>
            {/* Overview Meta Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                background: 'var(--bg-input)',
                padding: '14px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '18px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Target Unit</span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    if (onNavigateToMachine) onNavigateToMachine(ticket?.machineId);
                    onClose();
                  }}
                >
                  {ticket?.machineId}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#9AA9BC', display: 'block' }}>{machine?.name || 'Equipment'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Assigned Engineer</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} color="#9AA9BC" />
                  <span>{ticket?.assignedTo || 'Unassigned'}</span>
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Created Date</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Due Date</span>
                <span style={{ fontSize: '0.8rem', color: '#FFB020', fontWeight: 600 }}>
                  {ticket?.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Description & Admin Instructions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Task Scope & Description
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {ticket?.description || 'Standard inspection and maintenance protocol.'}
                </p>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00D4FF', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Admin Instructions / Work Guidance
                </span>
                <p style={{ fontSize: '0.85rem', color: '#9AA9BC', lineHeight: 1.5, fontStyle: ticket?.adminInstructions ? 'normal' : 'italic' }}>
                  {ticket?.adminInstructions || 'No specific special instructions provided.'}
                </p>
              </div>
            </div>

            {/* Progress Bar & Status Track */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Work Order Execution Progress
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#00D4FF', fontSize: '1rem' }}>
                  {ticket?.progress || 0}%
                </span>
              </div>

              <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${ticket?.progress || 0}%`,
                    height: '100%',
                    background:
                      status === 'APPROVED' || status === 'CLOSED'
                        ? '#20C997'
                        : status === 'REWORK'
                        ? '#FFB020'
                        : '#1677FF',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Status progression indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>OPEN</span>
                <span>ASSIGNED</span>
                <span>IN PROGRESS</span>
                <span>RESOLUTION SUBMITTED</span>
                <span>APPROVED</span>
              </div>
            </div>

            {/* Technical Findings & Resolution Section */}
            {(ticket?.findings || ticket?.resolution || isEngineer) && (
              <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Engineer Diagnostics, Findings & Resolution
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">On-Site Findings</label>
                    {isEngineer && ['ACCEPTED', 'IN_PROGRESS', 'TESTING', 'REWORK'].includes(status) ? (
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={findingsText}
                        onChange={(e) => setFindingsText(e.target.value)}
                        placeholder="Log component measurements, wear patterns, dial gauge readings..."
                      />
                    ) : (
                      <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px', fontSize: '0.82rem', color: ticket?.findings ? 'var(--text-main)' : 'var(--text-muted)', minHeight: '60px' }}>
                        {ticket?.findings || 'No on-site findings documented yet.'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Resolution / Action Taken</label>
                    {isEngineer && ['IN_PROGRESS', 'TESTING', 'REWORK', 'RESOLUTION_SUBMITTED'].includes(status) ? (
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        placeholder="Detail corrective repairs, parts replaced, torque specs, test runs..."
                      />
                    ) : (
                      <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px', fontSize: '0.82rem', color: ticket?.resolution ? '#20C997' : 'var(--text-muted)', minHeight: '60px' }}>
                        {ticket?.resolution || 'Resolution has not yet been submitted.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Engineer Progress Slider when active */}
                {isEngineer && ['IN_PROGRESS', 'TESTING', 'REWORK'].includes(status) && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Update Task Progress Percentage:</span>
                      <strong style={{ color: '#00D4FF' }}>{progressVal}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressVal}
                      onChange={(e) => setProgressVal(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#1677FF' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Activity Timeline */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Work Order Audit Timeline
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                {ticket?.activityTimeline && ticket.activityTimeline.length > 0 ? (
                  ticket.activityTimeline.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '0.78rem',
                        borderLeft: '2px solid var(--border-color)',
                        paddingLeft: '10px',
                        marginLeft: '4px',
                      }}
                    >
                      <Clock size={13} color="#9AA9BC" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div>
                          <strong style={{ color: '#F5F7FA' }}>{item.action}</strong>
                          <span style={{ color: 'var(--text-muted)' }}> by {item.user} ({item.role})</span>
                          <span style={{ color: '#61738D', marginLeft: '6px' }}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.note && <div style={{ color: '#9AA9BC', marginTop: '2px' }}>{item.note}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No audit events logged.</div>
                )}
              </div>
            </div>

            {/* Quick Note Input */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Append technician log / note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>

            {/* Forms for Rework or Reassign (Admin) */}
            {showReworkForm && (
              <div style={{ background: 'rgba(255, 176, 32, 0.1)', border: '1px solid #FFB020', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#FFB020', fontWeight: 700, marginBottom: '8px' }}>
                  Request Rework from Field Engineer
                </h4>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Specify why resolution was rejected and required rework steps..."
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowReworkForm(false)}>Cancel</button>
                  <button className="btn btn-warning btn-sm" onClick={handleRework} disabled={actionLoading}>
                    Confirm Rework Request
                  </button>
                </div>
              </div>
            )}

            {showAssignForm && (
              <div style={{ background: 'rgba(22, 119, 255, 0.1)', border: '1px solid #1677FF', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#00D4FF', fontWeight: 700, marginBottom: '8px' }}>
                  Reassign Work Order to Reliability Engineer
                </h4>
                <select
                  className="form-select"
                  value={reassignEngineer}
                  onChange={(e) => setReassignEngineer(e.target.value)}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="">Select an active engineer...</option>
                  {engineers.map((eng) => (
                    <option key={eng._id} value={eng.name}>
                      {eng.name} ({eng.shift || 'General'}) &bull; Active: {eng.activeOrdersCount || 0}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignForm(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleReassign} disabled={actionLoading}>
                    Confirm Reassignment
                  </button>
                </div>
              </div>
            )}

            {/* LIFECYCLE ACTION BUTTONS BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close View
              </button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* ============= ENGINEER ACTIONS ============= */}
                {isEngineer && (
                  <>
                    {status === 'ASSIGNED' && (
                      <button className="btn btn-primary" onClick={handleAccept} disabled={actionLoading}>
                        <Check size={16} />
                        <span>Accept Work Order</span>
                      </button>
                    )}

                    {status === 'ACCEPTED' && (
                      <button className="btn btn-primary" onClick={handleStart} disabled={actionLoading}>
                        <Play size={16} />
                        <span>Start Maintenance</span>
                      </button>
                    )}

                    {['IN_PROGRESS', 'TESTING', 'REWORK'].includes(status) && (
                      <>
                        <button className="btn btn-secondary" onClick={handleUpdateProgress} disabled={actionLoading}>
                          <TrendingUp size={16} />
                          <span>Update Progress & Findings</span>
                        </button>

                        <button className="btn btn-success" onClick={handleSubmitResolution} disabled={actionLoading}>
                          <Send size={16} />
                          <span>Submit Resolution for Admin Review</span>
                        </button>
                      </>
                    )}

                    {status === 'RESOLUTION_SUBMITTED' && (
                      <span style={{ fontSize: '0.82rem', color: '#FFB020', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} />
                        <span>Awaiting Admin Review & Sign-Off</span>
                      </span>
                    )}

                    {status === 'APPROVED' && (
                      <span style={{ fontSize: '0.82rem', color: '#20C997', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} />
                        <span>Approved by Admin</span>
                      </span>
                    )}

                    {status === 'CLOSED' && (
                      <span style={{ fontSize: '0.82rem', color: '#9AA9BC', fontWeight: 600 }}>
                        Work Order Completed & Closed
                      </span>
                    )}
                  </>
                )}

                {/* ============= ADMIN ACTIONS ============= */}
                {isAdmin && (
                  <>
                    <button className="btn btn-secondary" onClick={() => setShowAssignForm(true)} disabled={actionLoading}>
                      <User size={15} />
                      <span>{ticket?.assignedTo === 'Unassigned' ? 'Assign Engineer' : 'Reassign'}</span>
                    </button>

                    {status === 'RESOLUTION_SUBMITTED' && (
                      <>
                        <button className="btn btn-warning" onClick={() => setShowReworkForm(true)} disabled={actionLoading}>
                          <RotateCcw size={15} />
                          <span>Request Rework</span>
                        </button>

                        <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                          <CheckCircle size={15} />
                          <span>Approve Maintenance</span>
                        </button>
                      </>
                    )}

                    {status === 'APPROVED' && (
                      <button className="btn btn-primary" onClick={handleClose} disabled={actionLoading}>
                        <FileCheck size={15} />
                        <span>Close & Archive</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
