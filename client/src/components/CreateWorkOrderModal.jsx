import React, { useState, useEffect } from 'react';
import { X, Wrench, Calendar, User, Cpu, AlertTriangle } from 'lucide-react';
import { ticketsApi } from '../api/ticketsApi';
import { authApi } from '../api/authApi';
import { machinesApi } from '../api/machinesApi';

export default function CreateWorkOrderModal({ isOpen, onClose, onCreated, initialMachineId = '' }) {
  const [machineId, setMachineId] = useState(initialMachineId || 'MCH-001');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adminInstructions, setAdminInstructions] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMachineId) setMachineId(initialMachineId);
      setTitle(`Scheduled Maintenance on ${initialMachineId || 'Equipment'}`);
      setDescription('');
      setPriority('MEDIUM');
      setAdminInstructions('');

      // Set default due date to 48 hours from now (YYYY-MM-DD)
      const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
      setDueDate(d.toISOString().split('T')[0]);

      // Fetch active engineers and machines
      authApi.getEngineers().then((engs) => {
        setEngineers(engs);
        if (engs.length > 0 && !assignedTo) setAssignedTo(engs[0].name);
      }).catch(() => {});

      machinesApi.getMachines().then((ms) => setMachines(ms)).catch(() => {});
    }
  }, [isOpen, initialMachineId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineId || !title.trim()) {
      alert('Machine and Title are required.');
      return;
    }

    setLoading(true);
    try {
      await ticketsApi.createTicket({
        machineId,
        title,
        description,
        priority,
        assignedTo: assignedTo || 'Unassigned',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        adminInstructions,
      });

      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create work order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'rgba(22, 119, 255, 0.15)',
                color: '#1677FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wrench size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Create Work Order
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9AA9BC', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Target Machine & Engineer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Target Equipment</label>
              <select
                className="form-select"
                value={machineId}
                onChange={(e) => {
                  setMachineId(e.target.value);
                  setTitle(`Maintenance & Diagnostics on ${e.target.value}`);
                }}
                required
              >
                {machines.map((m) => (
                  <option key={m.machineId} value={m.machineId}>
                    {m.machineId} — {m.name} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Field Engineer</label>
              <select
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="Unassigned">Unassigned (Dispatch Pool)</option>
                {engineers.map((eng) => (
                  <option key={eng._id} value={eng.name}>
                    {eng.name} ({eng.shift || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Work Order Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hydraulic pump seal replacement and pressure test"
              required
            />
          </div>

          {/* Priority & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">LOW — Routine Servicing</option>
                <option value="MEDIUM">MEDIUM — Standard Maintenance</option>
                <option value="HIGH">HIGH — Warning Degradation</option>
                <option value="CRITICAL">CRITICAL — Immediate Breakdown Risk</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Task Scope & Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the failure symptoms, required parts, safety tag-out procedures..."
            />
          </div>

          {/* Admin Instructions */}
          <div className="form-group">
            <label className="form-label">Admin Instructions / Execution Guidance</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={adminInstructions}
              onChange={(e) => setAdminInstructions(e.target.value)}
              placeholder="Special instructions, torque specifications, test runs, approval criteria..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Dispatch Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
