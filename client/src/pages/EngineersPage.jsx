import React, { useState, useEffect } from 'react';
import {
  Users,
  Wrench,
  Clock,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Briefcase,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { authApi } from '../api/authApi';

export default function EngineersPage({ onNavigateToTicketsForEngineer }) {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEngineers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getEngineers();
      setEngineers(data);
    } catch (err) {
      console.error('Failed to load engineers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, []);

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
            Engineering Roster &amp; Dispatch Monitoring
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Monitor technician availability, shift schedules, active work order workload, and field execution status
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={loadEngineers}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Roster Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            Retrieving operational roster...
          </div>
        ) : engineers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No registered engineers found.
          </div>
        ) : (
          engineers.map((eng) => (
            <div
              key={eng._id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(0, 212, 255, 0.12)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00d4ff',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                      }}
                    >
                      {eng.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        {eng.name}
                      </h3>
                      <div style={{ fontSize: '0.76rem', color: '#00d4ff', fontWeight: 600 }}>
                        {eng.department || 'Mechanical & Telemetry Maintenance'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: 'rgba(32, 201, 151, 0.15)',
                      color: '#20c997',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#20c997' }}></span>
                    On Duty
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-input)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{eng.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Shift:</span>
                    <span style={{ color: '#ffb020', fontWeight: 600 }}>{eng.shift || 'Alpha Shift (06:00 - 14:00)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Queue Workload:</span>
                    <span style={{ color: '#00d4ff', fontWeight: 700 }}>
                      {eng.activeOrdersCount || 0} Open Work Orders
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigateToTicketsForEngineer(eng.name)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Wrench size={13} />
                <span>View Assigned Work Orders</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
