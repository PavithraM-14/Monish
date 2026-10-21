import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Cpu, Send } from 'lucide-react';
import { issuesApi } from '../api/issuesApi';
import { machinesApi } from '../api/machinesApi';

export default function ReportIssueModal({ isOpen, onClose, onReported, initialMachineId = '' }) {
  const [machineId, setMachineId] = useState(initialMachineId || 'MCH-001');
  const [issueType, setIssueType] = useState('Mechanical Failure');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [observedSymptoms, setObservedSymptoms] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialMachineId) setMachineId(initialMachineId);
      setDescription('');
      setObservedSymptoms('');
      setRecommendedAction('');
      setSeverity('MEDIUM');

      machinesApi.getMachines().then((ms) => setMachines(ms)).catch(() => {});
    }
  }, [isOpen, initialMachineId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineId || !description.trim()) {
      alert('Machine and Description are required.');
      return;
    }

    setLoading(true);
    try {
      await issuesApi.createIssue({
        machineId,
        issueType,
        severity,
        description,
        observedSymptoms,
        recommendedAction,
      });

      if (onReported) onReported();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit issue report.');
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
                background: 'rgba(255, 176, 32, 0.15)',
                color: '#FFB020',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Report Machine Issue (Issue Intimation)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Field notification directly dispatched to Control Center
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9AA9BC', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Target Equipment</label>
              <select
                className="form-select"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                required
              >
                {machines.map((m) => (
                  <option key={m.machineId} value={m.machineId}>
                    {m.machineId} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Category</label>
              <select className="form-select" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                <option value="Mechanical Failure">Mechanical Failure</option>
                <option value="Electrical & Wiring">Electrical & Wiring</option>
                <option value="Thermal Overheating">Thermal Overheating</option>
                <option value="Hydraulic / Pressure Leak">Hydraulic / Pressure Leak</option>
                <option value="Bearing Wear & Vibration">Bearing Wear & Vibration</option>
                <option value="Sensor Drift / Malfunction">Sensor Drift / Malfunction</option>
                <option value="Lubrication Required">Lubrication Required</option>
                <option value="Motor Stator Overload">Motor Stator Overload</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Severity Level</label>
            <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="LOW">LOW — Minor observation / non-urgent</option>
              <option value="MEDIUM">MEDIUM — Noticeable degradation</option>
              <option value="HIGH">HIGH — Production risk / immediate servicing</option>
              <option value="CRITICAL">CRITICAL — Imminent equipment breakdown</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description of Anomaly / Defect</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, physical location on machine, and operational impact..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observed Symptoms</label>
            <input
              type="text"
              className="form-input"
              value={observedSymptoms}
              onChange={(e) => setObservedSymptoms(e.target.value)}
              placeholder="e.g. Grinding noise at 2000 RPM, hot oil odor, oil weeping from flange..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recommended Technician Action</label>
            <input
              type="text"
              className="form-input"
              value={recommendedAction}
              onChange={(e) => setRecommendedAction(e.target.value)}
              placeholder="e.g. Schedule bearing replacement during shift change, inspect seal..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning" disabled={loading} style={{ background: '#FFB020', color: '#070D17' }}>
              <Send size={15} />
              <span>{loading ? 'Submitting...' : 'Transmit Issue Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
