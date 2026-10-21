import React, { useState, useEffect } from 'react';
import { X, Wrench, Plus, CheckCircle, Clock } from 'lucide-react';
import { useTicketMutations } from '../hooks/useTickets';

export default function TicketModal({ isOpen, onClose, ticket = null, initialMachineId = '' }) {
  const { createMutation, updateMutation } = useTicketMutations();

  const [machineId, setMachineId] = useState(initialMachineId || 'MCH-001');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('Marcus Vance');
  const [status, setStatus] = useState('Open');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (ticket) {
      setMachineId(ticket.machineId);
      setPriority(ticket.priority);
      setAssignedTo(ticket.assignedTo || 'Unassigned');
      setStatus(ticket.status);
      setNote('');
    } else {
      setMachineId(initialMachineId || 'MCH-001');
      setPriority('Medium');
      setStatus('Open');
      setNote('');
    }
  }, [ticket, initialMachineId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (ticket) {
      await updateMutation.mutateAsync({
        id: ticket._id || ticket.ticketId,
        data: {
          status,
          priority,
          assignedTo,
          note: note.trim() ? note.trim() : undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        machineId,
        priority,
        assignedTo,
        note: note.trim() ? note.trim() : 'Manual work order issued by maintenance dispatcher.',
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {ticket ? `Update Ticket: ${ticket.ticketId}` : 'Create Maintenance Ticket'}
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Target Machine</label>
            <input
              type="text"
              className="form-input"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              disabled={!!ticket}
              placeholder="e.g. MCH-001"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ticket Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Field Engineer</label>
            <input
              type="text"
              className="form-input"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Engineer name..."
            />
          </div>

          {ticket && ticket.notes && ticket.notes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Work Log History</label>
              <div
                style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  background: 'var(--bg-input)',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {ticket.notes.map((n, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{ticket ? 'Append Technician Note' : 'Work Order Description / Notes'}</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Inspection findings, parts replaced, or maintenance steps..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {ticket ? 'Save Changes' : 'Issue Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
