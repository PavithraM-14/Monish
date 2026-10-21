import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Settings,
  Trash2,
  ChevronRight,
  Activity,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useMachines, useMachineMutations } from '../hooks/useMachines';
import MachineModal from '../components/MachineModal';
import { useAuth } from '../context/AuthContext';

export default function Machines({ onSelectMachine, initialFilter = 'all' }) {
  const { isAdmin, isEngineer } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  const { data: machines = [], isLoading } = useMachines({
    search: searchTerm || undefined,
    status: statusFilter,
  });

  const { deleteMutation } = useMachineMutations();

  const handleEdit = (machine, e) => {
    e.stopPropagation();
    setEditingMachine(machine);
    setModalOpen(true);
  };

  const handleDelete = async (machineId, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${machineId} from the fleet registry?`)) {
      await deleteMutation.mutateAsync(machineId);
    }
  };

  const handleAddNew = () => {
    setEditingMachine(null);
    setModalOpen(true);
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
            Machine Fleet Registry
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Equipment taxonomy, baseline vibration limits, operational risk ratings and predictive RUL
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#1677ff' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#1677ff' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Industrial Table View"
            >
              <List size={16} />
            </button>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleAddNew}>
              <Plus size={16} />
              <span>Register Machine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#9aa9bc" />
          <input
            type="text"
            className="form-input"
            style={{ padding: '6px 12px' }}
            placeholder="Search by Machine ID, model, bay, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#9aa9bc" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status:</span>
          {['all', 'Optimal', 'Warning', 'Critical'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter.toLowerCase() === s.toLowerCase() ? '#1677ff' : 'var(--bg-card)',
                color: statusFilter.toLowerCase() === s.toLowerCase() ? '#ffffff' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s === 'Optimal' ? 'Healthy' : s}
            </button>
          ))}
        </div>
      </div>

      {/* View 1: Industrial Table View */}
      {viewMode === 'table' ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
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
                <th style={{ padding: '14px 18px' }}>Machine ID</th>
                <th style={{ padding: '14px 18px' }}>Equipment Name &amp; Type</th>
                <th style={{ padding: '14px 18px' }}>Bay / Location</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Health Index</th>
                <th style={{ padding: '14px 18px' }}>Risk Rating</th>
                <th style={{ padding: '14px 18px' }}>Est. RUL</th>
                <th style={{ padding: '14px 18px' }}>Calibrated Limits</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No machines match the selected filter.
                  </td>
                </tr>
              ) : (
                machines.map((m) => (
                  <tr
                    key={m.machineId}
                    onClick={() => onSelectMachine(m.machineId)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                      {m.machineId}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{m.type}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{m.location}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`status-pill status-${m.status?.toLowerCase() || 'optimal'}`}>
                        {m.status || 'Optimal'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: (m.healthScore || 100) < 60 ? '#ff4d5e' : (m.healthScore || 100) < 80 ? '#ffb020' : '#20c997',
                        }}
                      >
                        {m.healthScore || 100}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: m.riskLevel === 'Critical' ? '#ff4d5e' : m.riskLevel === 'Medium' ? '#ffb020' : '#20c997',
                        }}
                      >
                        {m.riskLevel || 'Low'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                      {m.rul || 4500}h
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      V:{m.thresholds?.vibration} | T:{m.thresholds?.temperature}° | C:{m.thresholds?.current}A
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px' }}>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* View 2: Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {machines.map((m) => (
            <div
              key={m.machineId}
              onClick={() => onSelectMachine(m.machineId)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00d4ff')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={`status-pill status-${m.status?.toLowerCase() || 'optimal'}`}>
                    {m.status || 'Optimal'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.location}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {m.name}
                </h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
                  {m.machineId} &bull; {m.type}
                </div>

                {/* Health Score Meter */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Health Index</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: (m.healthScore || 100) < 60 ? '#ff4d5e' : (m.healthScore || 100) < 80 ? '#ffb020' : '#20c997',
                      }}
                    >
                      {m.healthScore || 100}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#142238', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${m.healthScore || 100}%`,
                        height: '100%',
                        background: (m.healthScore || 100) < 60 ? '#ff4d5e' : (m.healthScore || 100) < 80 ? '#ffb020' : '#20c997',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* RUL & Primary Degrading Sensor */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--bg-input)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Remaining Useful Life</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>
                      {m.rul || 4500} Operating Hours
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Risk Category</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: m.riskLevel === 'Critical' ? '#ff4d5e' : m.riskLevel === 'Medium' ? '#ffb020' : '#20c997',
                      }}
                    >
                      {m.riskLevel || 'Low'}
                    </div>
                  </div>
                </div>

                {/* Threshold indicators */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span>Vib Limit: <strong style={{ color: '#00d4ff' }}>{m.thresholds?.vibration} mm/s</strong></span>
                  <span>Temp Limit: <strong style={{ color: '#ffb020' }}>{m.thresholds?.temperature}°C</strong></span>
                  <span>Curr Limit: <strong style={{ color: '#8b5cf6' }}>{m.thresholds?.current}A</strong></span>
                  <span>Press Limit: <strong style={{ color: '#1677ff' }}>{m.thresholds?.pressure} bar</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                  marginTop: '16px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#9aa9bc' }}>
                  Installed: {new Date(m.installDate).toLocaleDateString()}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleEdit(m, e)}
                        title="Configure Parameters"
                      >
                        <Settings size={14} />
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDelete(m.machineId, e)}
                        title="Remove Machine"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}

                  <button className="btn btn-primary btn-sm">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MachineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        machine={editingMachine}
      />
    </div>
  );
}
