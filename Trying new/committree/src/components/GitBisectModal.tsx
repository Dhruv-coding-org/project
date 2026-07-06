import React from 'react';
import { type BisectState } from '../git/gitEngine';

interface GitBisectModalProps {
  bisect: BisectState;
  onCommand: (cmd: string) => void;
  onClose: () => void;
}

export const GitBisectModal: React.FC<GitBisectModalProps> = ({
  bisect,
  onCommand,
  onClose,
}) => {
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="bisect-modal-card" style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '1.4rem' }}>
              🐛 Git Bisect: The Bug Hunt
            </h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Binary search tracking through your repository commit history
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={bodyStyle}>
          {bisect.status === 'found' ? (
            <div style={foundBoxStyle}>
              <h3 style={{ color: '#ef4444', margin: '0 0 10px', fontSize: '1.2rem' }}>
                🎉 Culprit Commit Isolated!
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '0 0 16px' }}>
                The first bad commit where the bug was introduced is:
              </p>
              <div style={commitBadgeStyle}>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{bisect.currentHash}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '16px' }}>
                You trapped the bug in just <strong>{bisect.step}</strong> binary division step(s)!
              </p>
              <button
                onClick={() => onCommand('git bisect reset')}
                style={resetBtnStyle}
              >
                🔄 Reset Bisect & Return to Branch
              </button>
            </div>
          ) : (
            <>
              <div style={statsContainerStyle}>
                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Search Steps</span>
                  <span style={statValStyle}>{bisect.step}</span>
                </div>
                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Remaining Suspects</span>
                  <span style={statValStyle}>{bisect.candidates.length}</span>
                </div>
                <div style={statBoxStyle}>
                  <span style={statLabelStyle}>Testing Commit</span>
                  <span style={{ ...statValStyle, color: '#3b82f6' }}>{bisect.currentHash || 'HEAD'}</span>
                </div>
              </div>

              <div style={questionBoxStyle}>
                <p style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9' }}>
                  Test the project state at <strong style={{ color: '#3b82f6' }}>{bisect.currentHash}</strong>. Is the bug present here?
                </p>
              </div>

              <div style={actionButtonsStyle}>
                <button
                  onClick={() => onCommand(`git bisect good ${bisect.currentHash || ''}`)}
                  style={goodBtnStyle}
                >
                  ✅ Good (No Bug Here)
                </button>
                <button
                  onClick={() => onCommand(`git bisect bad ${bisect.currentHash || ''}`)}
                  style={badBtnStyle}
                >
                  ❌ Bad (Bug is Present!)
                </button>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => onCommand('git bisect reset')} style={subtleResetStyle}>
                  Abort Bisect (`git bisect reset`)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(5, 10, 20, 0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '16px',
  width: '90%',
  maxWidth: '550px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #1e293b',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  backgroundColor: '#0b1323',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: '1.2rem',
  cursor: 'pointer',
};

const bodyStyle: React.CSSProperties = {
  padding: '24px',
};

const foundBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '16px',
  backgroundColor: '#162032',
  border: '1px solid #ef4444',
  borderRadius: '12px',
};

const commitBadgeStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#0b1323',
  border: '1px dashed #f59e0b',
  borderRadius: '8px',
  fontSize: '1.2rem',
  fontFamily: 'monospace',
  display: 'inline-block',
  minWidth: '150px',
};

const resetBtnStyle: React.CSSProperties = {
  marginTop: '20px',
  padding: '12px 24px',
  backgroundColor: '#ef4444',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem',
  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px',
  marginBottom: '20px',
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: '#162032',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #23314c',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  fontWeight: 'bold',
};

const statValStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  color: '#fff',
  fontWeight: 'bold',
  fontFamily: 'monospace',
};

const questionBoxStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '20px',
  textAlign: 'center',
  borderLeft: '4px solid #3b82f6',
};

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
};

const goodBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  backgroundColor: '#10b981',
  border: 'none',
  borderRadius: '8px',
  color: '#050a14',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.95rem',
  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
};

const badBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  backgroundColor: '#ef4444',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.95rem',
  boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
};

const subtleResetStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
