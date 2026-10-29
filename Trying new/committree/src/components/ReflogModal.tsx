import React from 'react';
import type { ReflogEntry } from '../git/gitEngine';

interface ReflogModalProps {
  reflogEntries: ReflogEntry[];
  onRestore: (index: number) => void;
  onClose: () => void;
}

export const ReflogModal: React.FC<ReflogModalProps> = ({
  reflogEntries,
  onRestore,
  onClose,
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="reflog-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1px solid #06B6D4',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          width: '680px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(6, 182, 212, 0.3)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#22D3EE', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⏳ Reflog Time Machine
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Every HEAD movement is safely recorded here. You can time-travel back to any orphaned or previous commit state at any time!
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {reflogEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
              No reflog history available yet. Try executing Git commands!
            </div>
          ) : (
            reflogEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22D3EE', border: '1px solid #0891B2', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace' }}>
                      HEAD@&#123;{entry.index}&#125;
                    </span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid #D97706', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace' }}>
                      {entry.hash}
                    </span>
                    <span style={{ color: '#94A3B8', fontSize: '12px' }}>
                      ({entry.timestamp})
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600, marginTop: '2px' }}>
                    <span style={{ color: '#A855F7', marginRight: '6px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                      [{entry.action}]
                    </span>
                    {entry.message}
                  </div>
                </div>

                <button
                  onClick={() => onRestore(entry.index)}
                  style={{
                    background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(6, 182, 212, 0.3)',
                  }}
                  title={`git reset --hard HEAD@{${entry.index}}`}
                >
                  ⏳ Restore State
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
