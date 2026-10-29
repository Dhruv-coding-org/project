import React, { useState } from 'react';
import type { Commit } from '../git/gitEngine';

interface NodeInspectorProps {
  commit: Commit | null;
  onClose: () => void;
  onCompareWithHead?: (hash: string) => void;
  onViewBlame?: (hash: string) => void;
}

// Generate deterministic side-by-side diff code lines
function getMockSideBySideDiff(file: { name: string; desc: string }, commitMsg: string) {
  const msg = commitMsg.toLowerCase();
  const isInit = msg.includes('initial');

  if (file.name.endsWith('.html')) {
    return {
      left: isInit ? ['(File did not exist)'] : [' <nav className="old-nav">', '   <a href="/">Home</a>', ' </nav>'],
      right: isInit ? [' <!DOCTYPE html>', ' <html>', '   <head><title>CommitTree App</title></head>', '   <body><div id="root"></div></body>', ' </html>'] : [' <nav className="new-nav glass-dock">', '   <a href="/">Home</a>', '   <a href="/dashboard">Dashboard</a>', '   <a href="/settings">Settings</a>', ' </nav>'],
    };
  }
  if (file.name.endsWith('.css')) {
    return {
      left: isInit ? ['(File did not exist)'] : [' .button {', '   background: blue;', '   color: white;', ' }'],
      right: isInit ? [' :root {', '   --primary: #10B981;', '   --bg: #030712;', ' }', ' body { background: var(--bg); }'] : [' .button {', '   background: linear-gradient(135deg, #10B981, #06B6D4);', '   color: #F8FAFC;', '   border-radius: 8px;', '   transition: all 0.15s ease;', ' }'],
    };
  }
  if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
    return {
      left: [' function initApp() {', '   console.log("Loading...");', '   renderOldView();', ' }'],
      right: [' async function initApp() {', '   console.log("Loading CommitTree...");', '   await checkPermissions();', '   renderModernDashboard();', ' }'],
    };
  }
  if (file.name.endsWith('.md')) {
    return {
      left: [' # Old Documentation', ' - Setup instructions missing'],
      right: [' # CommitTree Documentation', ' - Interactive Git Simulator', ' - Run npm run dev to start'],
    };
  }
  return {
    left: [' - Previous version content', ' - Old configuration values'],
    right: [' + Updated version content', ' + New optimized configuration values', ' + Added safety checks'],
  };
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
  const [viewMode, setViewMode] = useState<'diff' | 'summary'>('diff');
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
        <div className="diff-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span>Changed Files ({files.length}) </span>
            <span className="diff-totals">
              <span className="text-green">+{totalAdditions} lines</span> / <span className="text-red">-{totalDeletions} lines</span>
            </span>
          </div>
          <div className="diff-view-toggle" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              style={{ padding: '3px 8px', fontSize: '10.5px', borderRadius: '4px', border: 'none', background: viewMode === 'diff' ? '#10B981' : 'transparent', color: viewMode === 'diff' ? '#030712' : '#9CA3AF', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡ Side-by-Side Diff
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              style={{ padding: '3px 8px', fontSize: '10.5px', borderRadius: '4px', border: 'none', background: viewMode === 'summary' ? '#10B981' : 'transparent', color: viewMode === 'summary' ? '#030712' : '#9CA3AF', fontWeight: 600, cursor: 'pointer' }}
            >
              📊 Summary
            </button>
          </div>
        </div>

        {viewMode === 'diff' ? (
          <div className="diff-files-list">
            {files.map((file, idx) => {
              const diffCode = getMockSideBySideDiff(file, commit.message);
              return (
                <div key={idx} className="diff-file-item" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                  <div className="diff-file-top" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="diff-file-name" style={{ fontWeight: 700, color: '#38BDF8', fontSize: '12px' }}>📄 {file.name}</span>
                    <span className="diff-file-stats">
                      <span className="add-count text-green">+{file.additions}</span>{' '}
                      <span className="del-count text-red">-{file.deletions}</span>
                    </span>
                  </div>
                  <div className="diff-file-desc" style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px' }}>{file.desc}</div>
                  <div className="side-by-side-diff-grid">
                    <div className="diff-col-left">
                      <div style={{ fontSize: '9.5px', color: '#FCA5A5', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Old Version (-{file.deletions})</div>
                      {diffCode.left.map((line, lIdx) => (
                        <div key={lIdx} style={{ color: '#FCA5A5', whiteSpace: 'pre' }}>{line}</div>
                      ))}
                    </div>
                    <div className="diff-col-right">
                      <div style={{ fontSize: '9.5px', color: '#6EE7B7', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>New Version (+{file.additions})</div>
                      {diffCode.right.map((line, rIdx) => (
                        <div key={rIdx} style={{ color: '#6EE7B7', whiteSpace: 'pre' }}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
