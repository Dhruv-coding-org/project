import React from 'react';
import type { Commit } from '../git/gitEngine';

interface NodeInspectorProps {
  commit: Commit | null;
  onClose: () => void;
}

// Generate deterministic file changes based on commit hash and message
function getMockFilesChanged(commit: Commit) {
  const hash = commit.hash;
  const msg = commit.message.toLowerCase();
  
  if (msg.includes('initial')) {
    return [
      { name: '.gitignore', additions: 15, deletions: 0, desc: 'Added standard Git ignore patterns' },
      { name: 'package.json', additions: 25, deletions: 0, desc: 'Initialized dependencies and scripts' },
      { name: 'README.md', additions: 10, deletions: 0, desc: 'Created project documentation' },
    ];
  }
  
  if (msg.includes('merge')) {
    return [
      { name: 'src/App.tsx', additions: 14, deletions: 3, desc: 'Resolved conflicts and merged timelines' },
      { name: 'src/components/GitGraph.tsx', additions: 8, deletions: 2, desc: 'Integrated feature branch updates' },
    ];
  }

  // Generic files based on characters in hash
  const files = [];
  const charSum = hash.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  if (charSum % 3 === 0) {
    files.push({ name: 'src/components/GitGraph.tsx', additions: Math.floor(charSum / 10) + 5, deletions: Math.floor(charSum / 30), desc: 'Updated graph layout coordinates' });
    files.push({ name: 'src/App.css', additions: Math.floor(charSum / 20) + 4, deletions: 1, desc: 'Styled visual nodes and curves' });
  } else if (charSum % 3 === 1) {
    files.push({ name: 'src/git/gitEngine.ts', additions: Math.floor(charSum / 8) + 10, deletions: Math.floor(charSum / 25), desc: 'Refactored state machine reducers' });
  } else {
    files.push({ name: 'src/main.tsx', additions: 8, deletions: 2, desc: 'Configured application root' });
    files.push({ name: 'public/index.html', additions: 12, deletions: 1, desc: 'Updated meta tags and title' });
  }
  
  return files;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ commit, onClose }) => {
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
