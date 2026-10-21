import React from 'react';

export default function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  color = '#1677FF',
  badge,
  onClick,
}) {
  const isClickable = !!onClick;

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`kpi-card ${isClickable ? 'kpi-card-clickable' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `${title}: ${value}. Click to view details` : `${title}: ${value}`}
    >
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon-wrap" style={{ background: `${color}18`, color }}>
          {Icon && <Icon size={19} />}
        </div>
      </div>

      <div className="kpi-value" style={{ color: color === '#FFFFFF' ? '#F5F7FA' : color }}>
        {value}
      </div>

      <div className="kpi-subtext">
        {badge && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: `${color}20`,
              color,
            }}
          >
            {badge}
          </span>
        )}
        <span>{subtext}</span>
      </div>
    </div>
  );
}
