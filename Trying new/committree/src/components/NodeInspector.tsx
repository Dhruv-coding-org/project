import React from 'react';
import type { Commit } from '../git/gitEngine';

interface NodeInspectorProps {
  commit: Commit | null;
  onClose: () => void;
  onCompareWithHead?: (hash: string) => void;
  onViewBlame?: (hash: string) => void;
}

// Generate deterministic file changes based on commit hash and message
function getMockFilesChanged(commit: Commit) {
  const hash = commit.hash;
  const msg = commit.message.toLowerCase();
  
  if (msg.includes('initial')) {
    return [
      { name: 'index.html', additions: 18, deletions: 0, desc: 'Initial structure' },
      { name: 'styles.css', additions: 45, deletions: 0, desc: 'Base styling rules' }
    ];
  }
  
  if (msg.includes('nav') || msg.includes('header') || msg.includes('menu')) {
    return [
      { name: 'index.html', additions: 14, deletions: 2, desc: 'Added navigation links' },
      { name: 'styles.css', additions: 22, deletions: 4, desc: 'Flexbox navigation styling' }
    ];
  }

  if (msg.includes('fix') || msg.includes('bug') || msg.includes('patch')) {
    return [
      { name: 'app.js', additions: 3, deletions: 8, desc: 'Fixed null pointer exception' }
    ];
  }

  if (msg.includes('style') || msg.includes('color') || msg.includes('theme')) {
    return [
      { name: 'styles.css', additions: 31, deletions: 12, desc: 'Updated color palette and responsive breakpoints' }
    ];
  }

  if (msg.includes('doc') || msg.includes('readme')) {
    return [
      { name: 'README.md', additions: 25, deletions: 3, desc: 'Documented setup instructions' }
    ];
  }

  // Default fallback calculation based on hash char code
  const charCode = hash.charCodeAt(hash.length - 1) || 50;
  const adds = (charCode % 15) + 4;
  const dels = (charCode % 7);
  
  const files = [
    { name: 'app.js', additions: adds, deletions: dels, desc: 'Core logic updates' }
  ];
  
  if (adds > 10) {
    files.push({ name: 'public/index.html', additions: 12, deletions: 1, desc: 'Updated meta tags and title' });
  }
  
  return files;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ commit, onClose, onCompareWithHead, onViewBlame }) => {
  if (!commit) {
    return (
      <div className="node-inspector-empty">
        <div className="empty-icon-pulse">🔍</div>
        <h4 className="empty-title">No Commit Selected</h4>
        <p className="inspector-tip">
          Click any commit node circle in the interactive graph to inspect its metadata, ancestry relationships, and simulated file diffs.
        </p>
      </div>
    );
  }

  const files = getMockFilesChanged(commit);
  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  const isRoot = commit.parents.length === 0;
  const isMerge = commit.isMerge || commit.parents.length > 1;
  const isRebased = commit.isRebasedCopy || commit.hash.endsWith("'");

  return (
    <div className="node-inspector-container">
      {/* Header */}
      <div className="inspector-header">
        <div className="header-title-row">
          <h3 className="inspector-title">
            Commit: <span className="highlight monospace">{commit.hash}</span>
          </h3>
          <div className="commit-badges-row">
            {isRoot && <span className="type-badge root-badge">🌱 Root Commit</span>}
            {isMerge && <span className="type-badge merge-badge">🔀 Merge Commit (2 Parents)</span>}
            {isRebased && <span className="type-badge rebase-badge">⚡ Rebased Copy</span>}
            {!isRoot && !isMerge && !isRebased && <span className="type-badge normal-badge">📦 Snapshot</span>}
          </div>
        </div>
        <button className="inspector-close-btn" onClick={onClose} title="Close Inspector">
          ✕
        </button>
      </div>

      {/* Grid Meta Details */}
      <div className="inspector-details-grid">
        <div className="meta-row">
          <span className="meta-label">Branch:</span>
          <span className="meta-value branch-badge">{commit.branch || 'Detached'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Author:</span>
          <span className="meta-value">{commit.author}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Parents:</span>
          <span className="meta-value monospace">
            {commit.parents.length > 0 ? commit.parents.join(' + ') : 'None (Root Commit)'}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Timestamp:</span>
          <span className="meta-value">{commit.date}</span>
        </div>
      </div>

      {/* Message Row */}
      <div className="inspector-message-box">
        <div className="meta-label">Commit Message:</div>
        <p className="commit-msg-text">"{commit.message}"</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {onCompareWithHead && (
            <button
              onClick={() => onCompareWithHead(commit.hash)}
              style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
            >
              🔍 Compare vs HEAD
            </button>
          )}
          {onViewBlame && (
            <button
              onClick={() => onViewBlame(commit.hash)}
              style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8B5CF6', color: '#A78BFA', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', flex: 1 }}
            >
              📜 Blame at Commit
            </button>
          )}
        </div>
      </div>

      {/* Mock File Changes */}
      <div className="inspector-file-diffs">
        <div className="diff-header">
          <span>Changed Files ({files.length})</span>
          <span className="diff-totals">
            <span className="text-green">+{totalAdditions} lines</span> / <span className="text-red">-{totalDeletions} lines</span>
          </span>
        </div>
        <div className="diff-files-list">
          {files.map((file, idx) => {
            const total = file.additions + file.deletions;
            const addPct = Math.min(100, Math.max(10, Math.round((file.additions / total) * 100)));
            const delPct = 100 - addPct;

            return (
              <div key={idx} className="diff-file-item">
                <div className="diff-file-top">
                  <span className="diff-file-name">📄 {file.name}</span>
                  <span className="diff-file-stats">
                    <span className="add-count text-green">+{file.additions}</span>
                    <span className="del-count text-red">-{file.deletions}</span>
                  </span>
                </div>
                <div className="diff-file-desc">{file.desc}</div>
                <div className="diff-visual-bar">
                  <div className="diff-bar-green" style={{ width: `${addPct}%` }} />
                  {file.deletions > 0 && <div className="diff-bar-red" style={{ width: `${delPct}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
