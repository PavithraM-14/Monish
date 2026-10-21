import React, { useState } from 'react';
import { Activity, Shield, Key, AlertCircle, UserCheck, Wrench, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid authentication credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);

    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed demo authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #142238 0%, #070d17 75%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1677ff, #00d4ff)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 0 24px rgba(0, 212, 255, 0.35)',
            }}
          >
            <Activity size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            PredictaMaint
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
            AI Industrial Predictive Maintenance &amp; Fleet Telemetry
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 77, 94, 0.15)',
              border: '1px solid rgba(255, 77, 94, 0.35)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#ff8591',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} color="#ff4d5e" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Operational Account Email
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@predictamaint.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Account Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating Secure Session...</span>
            ) : (
              <>
                <span>Sign In to Operations Console</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Operational Profiles */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
            }}
          >
            <UserCheck size={14} color="#00d4ff" />
            <span>Quick Operational Profiles</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('admin@predictamaint.com', 'Admin@123')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 12px',
                gap: '2px',
                border: '1px solid rgba(255, 77, 94, 0.3)',
                background: 'rgba(255, 77, 94, 0.05)',
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} color="#ff4d5e" />
                <strong style={{ color: '#ff8591', fontSize: '0.84rem' }}>ADMIN</strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#9aa9bc' }}>Control Center & Dispatch</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('engineer@predictamaint.com', 'Engineer@123')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 12px',
                gap: '2px',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                background: 'rgba(0, 212, 255, 0.05)',
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} color="#00d4ff" />
                <strong style={{ color: '#00d4ff', fontSize: '0.84rem' }}>ENGINEER</strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#9aa9bc' }}>Field Maintenance & Diagnostics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
