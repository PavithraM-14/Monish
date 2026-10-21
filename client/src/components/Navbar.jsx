import React from 'react';
import {
  Activity,
  Cpu,
  Wrench,
  FileText,
  Shield,
  LogOut,
  Radio,
  User,
  AlertTriangle,
  BarChart2,
  Users,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activePage, setActivePage, onOpenReportIssue }) {
  const { user, logout, isAdmin, isEngineer } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <Activity size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title">PredictaMaint</span>
            <span className="brand-tag">OPERATIONS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#20c997' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#20c997', display: 'inline-block' }}></span>
            <span>Live Fleet Telemetry Stream Active</span>
          </div>
        </div>
      </div>

      <nav className="nav-links">
        {isAdmin && (
          <>
            <button
              className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Activity size={16} />
              <span>CONTROL CENTER</span>
            </button>

            <button
              className={`nav-link ${activePage === 'machines' ? 'active' : ''}`}
              onClick={() => setActivePage('machines')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Cpu size={16} />
              <span>FLEET REGISTRY</span>
            </button>

            <button
              className={`nav-link ${activePage === 'tickets' ? 'active' : ''}`}
              onClick={() => setActivePage('tickets')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Wrench size={16} />
              <span>WORK ORDERS</span>
            </button>

            <button
              className={`nav-link ${activePage === 'issues' ? 'active' : ''}`}
              onClick={() => setActivePage('issues')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <AlertTriangle size={16} />
              <span>ISSUE INTIMATIONS</span>
            </button>

            <button
              className={`nav-link ${activePage === 'logs' ? 'active' : ''}`}
              onClick={() => setActivePage('logs')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FileText size={16} />
              <span>HISTORICAL EXPLORER</span>
            </button>

            <button
              className={`nav-link ${activePage === 'reports' ? 'active' : ''}`}
              onClick={() => setActivePage('reports')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <BarChart2 size={16} />
              <span>REPORTS</span>
            </button>

            <button
              className={`nav-link ${activePage === 'engineers' ? 'active' : ''}`}
              onClick={() => setActivePage('engineers')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Users size={16} />
              <span>ENGINEERS</span>
            </button>
          </>
        )}

        {isEngineer && (
          <>
            <button
              className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Activity size={16} />
              <span>MY DASHBOARD</span>
            </button>

            <button
              className={`nav-link ${activePage === 'tickets' ? 'active' : ''}`}
              onClick={() => setActivePage('tickets')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Wrench size={16} />
              <span>MY WORK ORDERS</span>
            </button>

            <button
              className={`nav-link ${activePage === 'active-maintenance' ? 'active' : ''}`}
              onClick={() => setActivePage('active-maintenance')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Clock size={16} />
              <span>ACTIVE MAINTENANCE</span>
            </button>

            <button
              className="nav-link"
              onClick={onOpenReportIssue}
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                cursor: 'pointer',
                borderRadius: '6px',
                padding: '6px 12px',
              }}
            >
              <PlusCircle size={16} color="#00d4ff" />
              <span>REPORT AN ISSUE</span>
            </button>

            <button
              className={`nav-link ${activePage === 'issues' ? 'active' : ''}`}
              onClick={() => setActivePage('issues')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <AlertTriangle size={16} />
              <span>MY REPORTS</span>
            </button>

            <button
              className={`nav-link ${activePage === 'logs' ? 'active' : ''}`}
              onClick={() => setActivePage('logs')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <FileText size={16} />
              <span>MY HISTORY</span>
            </button>
          </>
        )}
      </nav>

      <div className="nav-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isAdmin ? 'rgba(255, 77, 94, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                  border: `1px solid ${isAdmin ? 'rgba(255, 77, 94, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAdmin ? <Shield size={16} color="#ff4d5e" /> : <Wrench size={16} color="#00d4ff" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: isAdmin ? '#ff8591' : '#00d4ff',
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Logout session"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
