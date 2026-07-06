import React, { useState } from 'react';
import type { Commit } from '../git/gitEngine';
import { getSimulatedFileContent, SIMULATED_FILES } from '../git/simulatedRepo';

interface BlameModalProps {
  commits: { [hash: string]: Commit };
  headCommitHash: string;
  onSelectCommit: (hash: string) => void;
  onClose: () => void;
}

export const BlameModal: React.FC<BlameModalProps> = ({
  commits,
  headCommitHash,
  onSelectCommit,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(SIMULATED_FILES[0].path);
  const annotated = getSimulatedFileContent(commits, headCommitHash, selectedFile);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="blame-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1px solid #8B5CF6',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          width: '880px',
          maxWidth: '94vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(139, 92, 246, 0.3)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📜 Git Blame Inspector
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Inspect simulated source code line-by-line. Click any commit hash badge in the gutter to jump to that revision on the Git graph!
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

        {/* File Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', paddingBottom: '8px', overflowX: 'auto' }}>
          {SIMULATED_FILES.map((f) => {
            const isSelected = selectedFile === f.path;
            return (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                style={{
                  background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid #8B5CF6' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: isSelected ? '#DDD6FE' : '#CBD5E1',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📄 {f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Blame Gutter & Code Viewer */}
        <div style={{ flex: 1, background: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'auto', fontFamily: 'monospace', fontSize: '13px', padding: '12px 0' }}>
          {annotated.lines.map((line, idx) => {
            const ann = annotated.annotations[idx] || { hash: 'C0', author: 'root', date: 'initial', message: 'Initial commit' };
            const lineNum = idx + 1;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '3px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                  lineHeight: '1.5',
                }}
              >
                {/* Line Number */}
                <span style={{ width: '36px', color: '#475569', textAlign: 'right', marginRight: '12px', userSelect: 'none' }}>
                  {lineNum}
                </span>

                {/* Blame Gutter Info */}
                <div style={{ display: 'flex', alignItems: 'center', width: '280px', flexShrink: 0, gap: '8px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px', marginRight: '16px' }}>
                  <button
                    onClick={() => {
                      onSelectCommit(ann.hash);
                      onClose();
                    }}
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid #8B5CF6',
                      borderRadius: '4px',
                      color: '#DDD6FE',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                    title={`Click to inspect commit ${ann.hash}: ${ann.message}`}
                  >
                    {ann.hash}
                  </button>
                  <span style={{ color: '#94A3B8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }} title={ann.author}>
                    {ann.author}
                  </span>
                  <span style={{ color: '#64748B', fontSize: '11px', marginLeft: 'auto' }}>
                    {ann.date}
                  </span>
                </div>

                {/* Code Content */}
                <span style={{ color: '#E2E8F0', whiteSpace: 'pre-wrap', flex: 1 }}>
                  {line}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            💡 Tip: Click any commit badge on the left to highlight and inspect that commit node in your Git tree!
          </span>
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
