import React, { useEffect } from 'react';
import type { BadgeInfo } from '../store/profileStore';

interface BadgeToastProps {
  badge: BadgeInfo | null;
  onClose: () => void;
}

export const BadgeToast: React.FC<BadgeToastProps> = ({ badge, onClose }) => {
  useEffect(() => {
    if (!badge) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [badge, onClose]);

  if (!badge) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '1px solid #10B981',
        boxShadow: '0 0 25px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.1)',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        color: '#FFFFFF',
        minWidth: '280px',
        maxWidth: '380px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          fontSize: '32px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          width: '54px',
          height: '54px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {badge.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#10B981',
            fontWeight: 700,
            marginBottom: '2px',
          }}
        >
          🏆 Achievement Unlocked!
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', marginBottom: '2px' }}>
          {badge.title}
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
          {badge.description} <span style={{ color: '#38BDF8', fontWeight: 600 }}>+{badge.xpReward} XP</span>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748B',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px',
        }}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
};
