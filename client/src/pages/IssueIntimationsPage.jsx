import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  Wrench,
  Search,
  Filter,
  User,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { issuesApi } from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';

export default function IssueIntimationsPage({
  onSelectMachine,
  onOpenReportIssue,
  onOpenCreateTicketFromIssue,
}) {
  const { user, isAdmin, isEngineer } = useAuth();
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const data = await issuesApi.getIssues({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  const handleAcknowledge = async (issueId) => {
    setActionLoading(true);
    try {
      await issuesApi.acknowledgeIssue(issueId);
      await loadIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to acknowledge issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (issueId) => {
    const notes = prompt('Enter resolution notes for this issue:');
    if (notes === null) return;
    setActionLoading(true);
    try {
      await issuesApi.resolveIssue(issueId, notes || 'Resolved by operational lead.');
      await loadIssues();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve issue.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = issues.filter((iss) => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        iss.machineId?.toLowerCase().includes(s) ||
        iss.reportedByName?.toLowerCase().includes(s) ||
        iss.description?.toLowerCase().includes(s)
      );
    }
    return true;
  });

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
            {isAdmin ? 'Issue Intimations & Defect Triage' : 'My Field Reports & Defect Intimations'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            {isAdmin
              ? 'Triage field issues submitted by technicians, acknowledge anomalies, and convert into formal work orders'
              : 'Direct hotline to log unexpected physical defects, abnormal sounds, fluid leaks, or vibration anomalies'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenReportIssue}>
          <Plus size={16} />
          <span>Report New Defect</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['ALL', 'REPORTED', 'ACKNOWLEDGED', 'CONVERTED_TO_WO', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              background: statusFilter === st ? '#1677ff' : 'var(--bg-secondary)',
              color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              border: `1px solid ${statusFilter === st ? '#1677ff' : 'var(--border-color)'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={16} color="#9aa9bc" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by equipment, technician, or defect details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px' }}
          />
        </div>
      </div>

      {/* Issues Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading issue reports...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              padding: '50px 20px',
              color: 'var(--text-muted)',
            }}
          >
            <CheckCircle size={32} color="#20c997" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            No defect intimations matching the current filters.
          </div>
        ) : (
          filtered.map((iss) => (
            <div
              key={iss._id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    onClick={() => onSelectMachine(iss.machineId)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: '#00d4ff',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {iss.machineId}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {iss.machineName}
                  </span>
                  <span className={`status-pill status-${iss.severity.toLowerCase()}`}>
                    {iss.severity}
                  </span>
                  <span className={`status-pill status-${iss.status.toLowerCase()}`}>
                    {iss.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Reported: {new Date(iss.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {iss.description}
              </div>

              {iss.immediateActionTaken && (
                <div
                  style={{
                    background: 'var(--bg-input)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    borderLeft: '3px solid #ffb020',
                  }}
                >
                  <strong style={{ color: '#ffb020' }}>Immediate Action Taken:</strong> {iss.immediateActionTaken}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#9aa9bc" />
                  <span>Reported by: <strong style={{ color: 'var(--text-main)' }}>{iss.reportedByName}</strong></span>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {iss.status === 'REPORTED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAcknowledge(iss._id)}
                        disabled={actionLoading}
                      >
                        Acknowledge
                      </button>
                    )}

                    {iss.status !== 'CONVERTED_TO_WO' && iss.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenCreateTicketFromIssue(iss)}
                        disabled={actionLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Wrench size={13} />
                        <span>Convert to Work Order</span>
                      </button>
                    )}

                    {iss.status !== 'RESOLVED' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResolve(iss._id)}
                        disabled={actionLoading}
                        style={{ color: '#20c997' }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
