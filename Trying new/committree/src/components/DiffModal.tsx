import React, { useState } from 'react';
import type { Commit } from '../git/gitEngine';
import { getSimulatedDiffs, SIMULATED_FILES, type FileDiff } from '../git/simulatedRepo';

interface DiffModalProps {
  commits: { [hash: string]: Commit };
  initialHashA?: string;
  initialHashB?: string;
  headCommitHash: string;
  onClose: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  commits,
  initialHashA,
  initialHashB,
  headCommitHash,
  onClose,
}) => {
  const allHashes = Object.keys(commits);
  const [hashA, setHashA] = useState<string>(initialHashA || 'C0');
  const [hashB, setHashB] = useState<string>(initialHashB || headCommitHash);

  const diffs: FileDiff[] = getSimulatedDiffs(commits, hashA, hashB);
  const [selectedFile, setSelectedFile] = useState<string>(diffs[0]?.path || SIMULATED_FILES[0].path);

  const activeDiff = diffs.find((d) => d.path === selectedFile) || {
    path: selectedFile,
    additions: 0,
    deletions: 0,
    lines: [{ type: 'context' as const, content: '// No changes in this file between revisions.' }],
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="diff-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          border: '1px solid #10B981',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          width: '840px',
          maxWidth: '92vw',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔍 Visual Diff Inspector
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
              Compare simulated file modifications across any two commit snapshots in your tree.
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

        {/* Commit Selector Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Base (Old):</span>
            <select
              value={hashA}
              onChange={(e) => setHashA(e.target.value)}
              style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '6px', padding: '6px 12px', fontWeight: 'bold', fontFamily: 'monospace' }}
            >
              {allHashes.map((h) => (
                <option key={h} value={h}>
                  {h} ({commits[h]?.message || ''})
                </option>
              ))}
            </select>
          </div>

          <span style={{ color: '#64748B', fontWeight: 'bold' }}>➔</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Target (New):</span>
            <select
              value={hashB}
              onChange={(e) => setHashB(e.target.value)}
              style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #475569', borderRadius: '6px', padding: '6px 12px', fontWeight: 'bold', fontFamily: 'monospace' }}
            >
              {allHashes.map((h) => (
                <option key={h} value={h}>
                  {h} ({commits[h]?.message || ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', paddingBottom: '8px', overflowX: 'auto' }}>
          {SIMULATED_FILES.map((f) => {
            const fd = diffs.find((d) => d.path === f.path);
            const isSelected = selectedFile === f.path;
            const hasChanges = fd && (fd.additions > 0 || fd.deletions > 0);

            return (
              <button
                key={f.path}
                onClick={() => setSelectedFile(f.path)}
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid #10B981' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: isSelected ? '#34D399' : '#CBD5E1',
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
                {hasChanges && (
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                    {fd.additions > 0 && <span style={{ color: '#34D399', marginRight: '4px' }}>+{fd.additions}</span>}
                    {fd.deletions > 0 && <span style={{ color: '#F87171' }}>-{fd.deletions}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Code Diff Viewer */}
        <div style={{ flex: 1, background: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'auto', fontFamily: 'monospace', fontSize: '13px', padding: '12px 0' }}>
          {activeDiff.lines.map((line, idx) => {
            let bg = 'transparent';
            let color = '#E2E8F0';
            let prefix = '  ';
            if (line.type === 'add') {
              bg = 'rgba(16, 185, 129, 0.15)';
              color = '#34D399';
              prefix = '+ ';
            } else if (line.type === 'del') {
              bg = 'rgba(239, 68, 68, 0.15)';
              color = '#F87171';
              prefix = '- ';
            }

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  background: bg,
                  color: color,
                  padding: '2px 16px',
                  lineHeight: '1.5',
                  borderLeft: line.type === 'add' ? '3px solid #10B981' : line.type === 'del' ? '3px solid #EF4444' : '3px solid transparent',
                }}
              >
                <span style={{ width: '40px', color: '#475569', textAlign: 'right', marginRight: '16px', userSelect: 'none' }}>
                  {line.oldLine || ''}
                </span>
                <span style={{ width: '40px', color: '#475569', textAlign: 'right', marginRight: '16px', userSelect: 'none' }}>
                  {line.newLine || ''}
                </span>
                <span style={{ fontWeight: 'bold', marginRight: '8px', userSelect: 'none' }}>{prefix}</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{line.content}</span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
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
