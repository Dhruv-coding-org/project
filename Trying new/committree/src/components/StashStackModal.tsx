import React, { useState } from 'react';
import { type StashEntry } from '../git/gitEngine';

interface StashStackModalProps {
  stashList: string[];
  stashEntries?: StashEntry[];
  onAction: (action: 'pop' | 'apply' | 'drop' | 'branch', index: number, branchName?: string) => void;
  onClose: () => void;
}

export const StashStackModal: React.FC<StashStackModalProps> = ({
  stashList,
  stashEntries = [],
  onAction,
  onClose,
}) => {
  const [branchingIdx, setBranchingIdx] = useState<number | null>(null);
  const [branchInput, setBranchInput] = useState('');

  const handleBranchSubmit = (idx: number) => {
    if (!branchInput.trim()) return;
    onAction('branch', idx, branchInput.trim());
    setBranchingIdx(null);
    setBranchInput('');
  };

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="stash-modal-card" style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem' }}>
              📦 Holographic Stash Stack
            </h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Suspended working directory states (`stash@&#123;0&#125;`, `stash@&#123;1&#125;`...)
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={bodyStyle}>
          {stashList.length === 0 ? (
            <div style={emptyStyle}>
              <span style={{ fontSize: '2.5rem', marginBottom: '12px', display: 'block' }}>📭</span>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '1rem' }}>No stashed changes</p>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Run `git stash` in the terminal to save your work in progress here!
              </p>
            </div>
          ) : (
            <div style={listStyle}>
              {stashList.map((desc, idx) => {
                const entry = stashEntries[idx];
                return (
                  <div key={entry ? entry.id : idx} style={cardItemStyle}>
                    <div style={cardHeaderStyle}>
                      <span style={badgeStyle}>stash@&#123;{idx}&#125;</span>
                      {entry && (
                        <span style={timeStyle}>🕒 {entry.date} on <strong>{entry.branch}</strong></span>
                      )}
                    </div>
                    <p style={descStyle}>{desc}</p>

                    {branchingIdx === idx ? (
                      <div style={branchInputContainerStyle}>
                        <input
                          type="text"
                          value={branchInput}
                          onChange={(e) => setBranchInput(e.target.value)}
                          placeholder="New branch name..."
                          style={inputStyle}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleBranchSubmit(idx);
                            if (e.key === 'Escape') setBranchingIdx(null);
                          }}
                        />
                        <button onClick={() => handleBranchSubmit(idx)} style={confirmBranchBtnStyle}>Create</button>
                        <button onClick={() => setBranchingIdx(null)} style={cancelBranchBtnStyle}>✕</button>
                      </div>
                    ) : (
                      <div style={actionsContainerStyle}>
                        <button onClick={() => onAction('pop', idx)} style={popBtnStyle}>
                          📤 Pop
                        </button>
                        <button onClick={() => onAction('apply', idx)} style={applyBtnStyle}>
                          📋 Apply
                        </button>
                        <button onClick={() => { setBranchingIdx(idx); setBranchInput(''); }} style={branchBtnStyle}>
                          🌿 Branch Here
                        </button>
                        <button onClick={() => onAction('drop', idx)} style={dropBtnStyle}>
                          🗑️ Drop
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
  maxWidth: '650px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)',
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
  overflowY: 'auto',
  flex: 1,
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const cardItemStyle: React.CSSProperties = {
  backgroundColor: 'rgba(30, 41, 59, 0.7)',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(4px)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#0369a1',
  color: '#e0f2fe',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontFamily: 'monospace',
  fontWeight: 'bold',
};

const timeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#94a3b8',
};

const descStyle: React.CSSProperties = {
  margin: '8px 0 16px',
  color: '#f8fafc',
  fontSize: '0.95rem',
  fontFamily: 'monospace',
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const baseBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.8rem',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const popBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  backgroundColor: '#38bdf8',
  color: '#050a14',
};

const applyBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  color: '#e2e8f0',
};

const branchBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  backgroundColor: '#10b981',
  color: '#050a14',
};

const dropBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  backgroundColor: 'transparent',
  color: '#ef4444',
  marginLeft: 'auto',
};

const branchInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  backgroundColor: '#0b1323',
  border: '1px solid #10b981',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.85rem',
};

const confirmBranchBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#10b981',
  border: 'none',
  borderRadius: '6px',
  color: '#050a14',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const cancelBranchBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'transparent',
  border: '1px solid #475569',
  borderRadius: '6px',
  color: '#94a3b8',
  cursor: 'pointer',
};
