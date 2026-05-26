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
      { name: '.gitignore', additions: 15, deletions: 0 },
      { name: 'package.json', additions: 25, deletions: 0 },
      { name: 'README.md', additions: 10, deletions: 0 },
    ];
  }
  
  if (msg.includes('merge')) {
    return [
      { name: 'App.tsx', additions: 1, deletions: 1 },
    ];
  }

  // Generic files based on characters in hash
  const files = [];
  const charSum = hash.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  if (charSum % 3 === 0) {
    files.push({ name: 'src/components/GitGraph.tsx', additions: Math.floor(charSum / 10), deletions: Math.floor(charSum / 30) });
    files.push({ name: 'src/App.css', additions: Math.floor(charSum / 20), deletions: 0 });
  } else if (charSum % 3 === 1) {
    files.push({ name: 'src/git/gitEngine.ts', additions: Math.floor(charSum / 8), deletions: Math.floor(charSum / 25) });
  } else {
    files.push({ name: 'src/main.tsx', additions: 5, deletions: 2 });
    files.push({ name: 'public/index.html', additions: 12, deletions: 1 });
  }
  
  return files;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ commit, onClose }) => {
  if (!commit) {
    return (
      <div className="node-inspector-empty">
        <span className="inspector-icon">🔍</span>
        <span className="inspector-tip">Click any commit node in the graph to inspect metadata and mock file diffs.</span>
      </div>
    );
  }

  const files = getMockFilesChanged(commit);
  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return (
    <div className="node-inspector-container">
      {/* Header */}
      <div className="inspector-header">
        <h3 className="inspector-title">Commit Inspector: <span className="highlight">{commit.hash}</span></h3>
        <button className="inspector-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Grid Meta Details */}
      <div className="inspector-details-grid">
        <div className="meta-row">
          <span className="meta-label">Branch:</span>
          <span className="meta-value branch-badge">{commit.branch}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Author:</span>
          <span className="meta-value">{commit.author}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Parents:</span>
          <span className="meta-value monospace">
            {commit.parents.length > 0 ? commit.parents.join(', ') : 'None (Root Commit)'}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Date:</span>
          <span className="meta-value">{commit.date}</span>
        </div>
      </div>

      {/* Message Row */}
      <div className="inspector-message-box">
        <div className="meta-label">Message:</div>
        <p className="commit-msg-text">"{commit.message}"</p>
      </div>

      {/* Mock File Changes */}
      <div className="inspector-file-diffs">
        <div className="diff-header">
          <span>Changed Files ({files.length})</span>
          <span className="diff-totals">
            <span className="text-green">+{totalAdditions}</span> / <span className="text-red">-{totalDeletions}</span>
          </span>
        </div>
        <div className="diff-files-list">
          {files.map((file, idx) => (
            <div key={idx} className="diff-file-item">
              <span className="diff-file-name">📄 {file.name}</span>
              <span className="diff-file-stats">
                <span className="add-count text-green">+{file.additions}</span>
                <span className="del-count text-red">-{file.deletions}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
