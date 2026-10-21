import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { useAnomalies } from '../hooks/useAnomalies';

export default function NotificationToast({ onSelectMachine }) {
  const { data: anomalies = [] } = useAnomalies({ limit: 5 });
  const [latestToast, setLatestToast] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    if (!anomalies || anomalies.length === 0) return;

    // Find the latest open critical or high anomaly not dismissed
    const critical = anomalies.find(
      (a) =>
        (a.severity === 'critical' || a.severity === 'high') &&
        a.status === 'open' &&
        !dismissedIds.has(a._id)
    );

    if (critical) {
      setLatestToast(critical);
    }
  }, [anomalies, dismissedIds]);

  if (!latestToast) return null;

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(latestToast._id));
    setLatestToast(null);
  };

  const handleInspect = () => {
    if (onSelectMachine) {
      onSelectMachine(latestToast.machineId);
    }
    handleDismiss();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        zIndex: 950,
        width: '380px',
        background: '#1f1315',
        border: '1px solid #dc2626',
        borderRadius: '12px',
        padding: '14px 18px',
        boxShadow: '0 12px 35px rgba(220, 38, 38, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>
            Critical Anomaly Detected
          </span>
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: 1.4 }}>
        <strong>{latestToast.machineId}</strong> &bull; {latestToast.explanation}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
        <button
          className="btn btn-sm"
          onClick={handleInspect}
          style={{
            background: '#dc2626',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '6px',
            fontSize: '0.75rem',
          }}
        >
          <span>Investigate Unit</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
