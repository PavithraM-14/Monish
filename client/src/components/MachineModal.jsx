import React, { useState, useEffect } from 'react';
import { X, Cpu, Save } from 'lucide-react';
import { useMachineMutations } from '../hooks/useMachines';

export default function MachineModal({ isOpen, onClose, machine = null }) {
  const { createMutation, updateMutation } = useMachineMutations();

  const [machineId, setMachineId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('CNC Milling');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Optimal');
  const [thresholds, setThresholds] = useState({
    vibration: 5.0,
    temperature: 80.0,
    current: 25.0,
    pressure: 10.0,
  });

  useEffect(() => {
    if (machine) {
      setMachineId(machine.machineId);
      setName(machine.name);
      setType(machine.type);
      setLocation(machine.location);
      setStatus(machine.status || 'Optimal');
      setThresholds({
        vibration: machine.thresholds?.vibration ?? 5.0,
        temperature: machine.thresholds?.temperature ?? 80.0,
        current: machine.thresholds?.current ?? 25.0,
        pressure: machine.thresholds?.pressure ?? 10.0,
      });
    } else {
      setMachineId(`MCH-${String(Math.floor(Math.random() * 900) + 100)}`);
      setName('');
      setType('CNC Milling');
      setLocation('Bay 1 - Production');
      setStatus('Optimal');
      setThresholds({ vibration: 5.0, temperature: 80.0, current: 25.0, pressure: 10.0 });
    }
  }, [machine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (machine) {
      await updateMutation.mutateAsync({
        id: machine._id || machine.machineId,
        data: {
          name,
          type,
          location,
          status,
          thresholds,
        },
      });
    } else {
      await createMutation.mutateAsync({
        machineId,
        name,
        type,
        location,
        thresholds,
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
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {machine ? `Configure Machine ${machine.machineId}` : 'Register New Fleet Unit'}
            </h3>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Machine ID</label>
              <input
                type="text"
                className="form-input"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                disabled={!!machine}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Machine Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 5-Axis Vertical Machining Center"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Equipment Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="CNC Milling">CNC Milling</option>
                <option value="Hydraulic Press">Hydraulic Press</option>
                <option value="Centrifugal Pump">Centrifugal Pump</option>
                <option value="Rotary Compressor">Rotary Compressor</option>
                <option value="Robotic Arm">Robotic Arm</option>
                <option value="Belt Conveyor">Belt Conveyor</option>
                <option value="Injection Molder">Injection Molder</option>
                <option value="Exhaust Blower">Exhaust Blower</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Factory Location / Bay</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bay 2 - Section C"
                required
              />
            </div>
          </div>

          <div style={{ margin: '18px 0 10px 0' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sensor Anomaly Safety Thresholds
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Alerts trigger when sensor telemetry breaches these calibrated limits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Max Vibration (mm/s)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={thresholds.vibration}
                onChange={(e) => setThresholds({ ...thresholds, vibration: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Temperature (°C)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={thresholds.temperature}
                onChange={(e) => setThresholds({ ...thresholds, temperature: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Current (A)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={thresholds.current}
                onChange={(e) => setThresholds({ ...thresholds, current: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Pressure (bar)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={thresholds.pressure}
                onChange={(e) => setThresholds({ ...thresholds, pressure: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
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
              <Save size={15} />
              <span>{machine ? 'Update Machine Specs' : 'Save Machine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
