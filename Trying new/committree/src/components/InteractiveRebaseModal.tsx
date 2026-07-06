import React, { useState } from 'react';
import { type InteractiveRebaseState, type InteractiveRebaseCommit } from '../git/gitEngine';

interface InteractiveRebaseModalProps {
  rebaseState: InteractiveRebaseState;
  onExecute: (updatedState: InteractiveRebaseState) => void;
  onCancel: () => void;
}

export const InteractiveRebaseModal: React.FC<InteractiveRebaseModalProps> = ({
  rebaseState,
  onExecute,
  onCancel,
}) => {
  const [commits, setCommits] = useState<InteractiveRebaseCommit[]>(() => [...rebaseState.commits]);

  const handleActionChange = (index: number, action: InteractiveRebaseCommit['action']) => {
    const next = [...commits];
    next[index] = { ...next[index], action };
    setCommits(next);
  };

  const handleMessageChange = (index: number, message: string) => {
    const next = [...commits];
    next[index] = { ...next[index], message };
    setCommits(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...commits];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setCommits(next);
  };

  const moveDown = (index: number) => {
    if (index === commits.length - 1) return;
    const next = [...commits];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setCommits(next);
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="rebase-modal-card" style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, color: '#00ffcc', fontSize: '1.4rem' }}>
              🎛️ Interactive Rebase Studio
            </h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Rebasing onto <strong style={{ color: '#fff' }}>{rebaseState.targetBranch}</strong> ({rebaseState.targetHash})
            </p>
          </div>
          <button onClick={onCancel} style={closeBtnStyle}>✕</button>
        </div>

        <div style={instructionsStyle}>
          <span>💡 <strong>pick</strong>: use commit | <strong>reword</strong>: edit message | <strong>squash</strong>: melt into previous | <strong>drop</strong>: delete</span>
        </div>

        <div style={listContainerStyle}>
          {commits.map((item, idx) => (
            <div key={`${item.originalHash}-${idx}`} style={rowStyle}>
              <div style={reorderActionsStyle}>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} style={arrowBtnStyle}>▲</button>
                <button onClick={() => moveDown(idx)} disabled={idx === commits.length - 1} style={arrowBtnStyle}>▼</button>
              </div>

              <select
                value={item.action}
                onChange={(e) => handleActionChange(idx, e.target.value as InteractiveRebaseCommit['action'])}
                style={getActionStyle(item.action)}
              >
                <option value="pick">pick</option>
                <option value="reword">reword</option>
                <option value="squash">squash</option>
                <option value="drop">drop</option>
              </select>

              <div style={{ fontWeight: 'bold', color: '#64748b', minWidth: '40px', fontFamily: 'monospace' }}>
                {item.originalHash}
              </div>

              <div style={{ flex: 1 }}>
                {(item.action === 'reword' || item.action === 'squash' || item.action === 'edit') ? (
                  <input
                    type="text"
                    value={item.message}
                    onChange={(e) => handleMessageChange(idx, e.target.value)}
                    style={inputStyle}
                    placeholder="Enter commit message..."
                  />
                ) : (
                  <span style={{ color: item.action === 'drop' ? '#ef4444' : '#e2e8f0', textDecoration: item.action === 'drop' ? 'line-through' : 'none' }}>
                    {item.message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          <button onClick={onCancel} style={cancelBtnStyle}>Abort Rebase</button>
          <button
            onClick={() => onExecute({ ...rebaseState, commits })}
            style={executeBtnStyle}
          >
            ⚡ Execute Rebase
          </button>
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
  maxWidth: '700px',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 255, 204, 0.15)',
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
  padding: '4px',
};

const instructionsStyle: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: '#1e293b',
  color: '#cbd5e1',
  fontSize: '0.8rem',
  borderBottom: '1px solid #334155',
};

const listContainerStyle: React.CSSProperties = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#162032',
  border: '1px solid #23314c',
  borderRadius: '8px',
  transition: 'all 0.2s',
};

const reorderActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const arrowBtnStyle: React.CSSProperties = {
  background: '#1e293b',
  border: 'none',
  color: '#94a3b8',
  fontSize: '0.6rem',
  padding: '2px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  backgroundColor: '#0b1323',
  border: '1px solid #3b82f6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '0.9rem',
};

const footerStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid #1e293b',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  backgroundColor: '#0b1323',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 18px',
  backgroundColor: 'transparent',
  border: '1px solid #475569',
  borderRadius: '8px',
  color: '#94a3b8',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const executeBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#00ffcc',
  border: 'none',
  borderRadius: '8px',
  color: '#050a14',
  cursor: 'pointer',
  fontWeight: 'bold',
  boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)',
};

function getActionStyle(action: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
  };
  switch (action) {
    case 'pick':
      return { ...base, backgroundColor: '#3b82f6', color: '#fff' };
    case 'reword':
      return { ...base, backgroundColor: '#8b5cf6', color: '#fff' };
    case 'squash':
      return { ...base, backgroundColor: '#f59e0b', color: '#000' };
    case 'drop':
      return { ...base, backgroundColor: '#ef4444', color: '#fff' };
    default:
      return { ...base, backgroundColor: '#64748b', color: '#fff' };
  }
}
