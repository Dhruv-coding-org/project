import React, { useState } from 'react';
import type { GitState, Commit } from '../git/gitEngine';
import { getSimulatedDiffs, SIMULATED_FILES, type FileDiff } from '../git/simulatedRepo';
import { getAncestors } from '../git/gitEngine';

interface PullRequestModalProps {
  state: GitState;
  onMergePR: (baseBranch: string, compareBranch: string, strategy: 'merge' | 'squash' | 'rebase', title: string) => void;
  onAwardBadge: (badgeId: string) => void;
  onClose: () => void;
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({
  state,
  onMergePR,
  onAwardBadge,
  onClose,
}) => {
  const branchNames = Object.keys(state.branches);
  const defaultBase = branchNames.includes('main') ? 'main' : branchNames[0] || 'HEAD';
  const defaultCompare = branchNames.find(b => b !== defaultBase) || defaultBase;

  const [baseBranch, setBaseBranch] = useState<string>(defaultBase);
  const [compareBranch, setCompareBranch] = useState<string>(defaultCompare);
  const [prTitle, setPrTitle] = useState<string>(`Feature update: ${defaultCompare} into ${defaultBase}`);
  const [activeTab, setActiveTab] = useState<'commits' | 'diff' | 'ai'>('commits');
  const [strategy, setStrategy] = useState<'merge' | 'squash' | 'rebase'>('squash');

  // AI Review State
  const [aiReviewStatus, setAiReviewStatus] = useState<'idle' | 'analyzing' | 'approved'>('idle');
  const [aiFeedback, setAiFeedback] = useState<Array<{ reviewer: string; avatar: string; role: string; comment: string; type: 'success' | 'warning' | 'info' }>>([]);

  // Inline comments in diff tab
  const [inlineComments, setInlineComments] = useState<Record<string, string>>({
    'app.js:2': 'Looks clean! Good encapsulation of the Git event loop.',
  });
  const [commentingLineKey, setCommentingLineKey] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');

  const baseHash = state.branches[baseBranch]?.targetHash || state.headCommitHash;
  const compareHash = state.branches[compareBranch]?.targetHash || state.headCommitHash;

  // Calculate unique commits
  const baseAncestors = getAncestors(state.commits, baseHash);
  const uniqueCommits: Commit[] = [];
  const queue = [compareHash];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr) || baseAncestors.has(curr)) continue;
    visited.add(curr);
    const c = state.commits[curr];
    if (c) {
      uniqueCommits.push(c);
      if (c.parents) queue.push(...c.parents);
    }
  }
  uniqueCommits.reverse();

  // Diff calculation
  const diffs: FileDiff[] = getSimulatedDiffs(state.commits, baseHash, compareHash);
  const [selectedFile, setSelectedFile] = useState<string>(diffs[0]?.path || SIMULATED_FILES[0].path);
  const activeDiff = diffs.find((d) => d.path === selectedFile) || {
    path: selectedFile,
    additions: 0,
    deletions: 0,
    lines: [{ type: 'context' as const, content: '// No differences found.' }],
  };

  const handleRequestAiReview = () => {
    setAiReviewStatus('analyzing');
    setTimeout(() => {
      const feedback: Array<{ reviewer: string; avatar: string; role: string; type: 'success' | 'warning' | 'info'; comment: string }> = [
        {
          reviewer: 'Sarah Tech-Lead',
          avatar: '👩‍💻',
          role: 'Staff Git Architect',
          type: 'success',
          comment: `Reviewed ${uniqueCommits.length} commit(s) from '${compareBranch}'. Commit graph looks well-structured without dangling pointers. Approved for merge!`,
        },
        {
          reviewer: 'Alex DevOps',
          avatar: '🦊',
          role: 'Principal SRE',
          type: 'info',
          comment: strategy === 'squash'
            ? 'Squash strategy selected. This will keep our main branch timeline spotless and atomic!'
            : strategy === 'rebase'
            ? 'Rebase strategy selected. Excellent choice for maintaining a clean linear graph history!'
            : 'Merge commit selected. This preserves full branching context in our repository history.',
        },
      ];
      if (uniqueCommits.some(c => c.message.toLowerCase() === 'fix' || c.message.toLowerCase() === 'wip' || c.message.length < 5)) {
        feedback.push({
          reviewer: 'Git-Bot Linter',
          avatar: '🤖',
          role: 'Automated CI Bot',
          type: 'warning',
          comment: 'Notice: One or more commit messages are short or informal (e.g. "wip", "fix"). Consider adopting Conventional Commits (feat: ..., fix: ...) for production clarity.',
        });
      }
      setAiFeedback(feedback);
      setAiReviewStatus('approved');
      onAwardBadge('ai_collaborator');
    }, 600);
  };

  const handleAddInlineComment = (lineKey: string) => {
    if (!newCommentText.trim()) return;
    setInlineComments(prev => ({ ...prev, [lineKey]: newCommentText.trim() }));
    setNewCommentText('');
    setCommentingLineKey(null);
  };

  const handleExecuteMerge = () => {
    onAwardBadge('pr_reviewer');
    if (strategy === 'squash') {
      onAwardBadge('squash_master');
    }
    onMergePR(baseBranch, compareBranch, strategy, prTitle);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="pr-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
          border: '1px solid #38BDF8',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          width: '940px',
          maxWidth: '95vw',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          fontFamily: "'Inter', sans-serif",
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#38BDF8' }}>
              <span>🔄</span> Pull Request Studio & Code Review Hub
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Simulate enterprise code review workflows, inspect line-by-line diffs, and execute advanced Git merge strategies.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* Branch Selector & Title Input */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Base Branch:</span>
              <select
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                style={{ background: '#1E293B', color: '#60A5FA', border: '1px solid #3B82F6', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {branchNames.map(b => (
                  <option key={b} value={b}>{b} ({state.branches[b]?.targetHash})</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: '18px', color: '#94A3B8' }}>←</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>Compare Branch:</span>
              <select
                value={compareBranch}
                onChange={(e) => {
                  setCompareBranch(e.target.value);
                  setPrTitle(`Feature update: ${e.target.value} into ${baseBranch}`);
                }}
                style={{ background: '#1E293B', color: '#34D399', border: '1px solid #10B981', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {branchNames.map(b => (
                  <option key={b} value={b}>{b} ({state.branches[b]?.targetHash})</option>
                ))}
              </select>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
              <span>✅ Able to merge</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600, minWidth: '70px' }}>PR Title:</span>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              placeholder="Enter Pull Request title..."
              style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: '6px', padding: '8px 12px', color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('commits')}
            style={{
              background: activeTab === 'commits' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'commits' ? '#38BDF8' : 'transparent'}`,
              color: activeTab === 'commits' ? '#38BDF8' : '#94A3B8',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>💬</span> Overview & Commits ({uniqueCommits.length})
          </button>
          <button
            onClick={() => setActiveTab('diff')}
            style={{
              background: activeTab === 'diff' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'diff' ? '#38BDF8' : 'transparent'}`,
              color: activeTab === 'diff' ? '#38BDF8' : '#94A3B8',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔍</span> Files Changed ({diffs.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              background: activeTab === 'ai' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'ai' ? '#A855F7' : 'transparent'}`,
              color: activeTab === 'ai' ? '#C084FC' : '#94A3B8',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🤖</span> AI Team Review {aiReviewStatus === 'approved' && '✅'}
          </button>
        </div>

        {/* Tab 1: Commits & Overview */}
        {activeTab === 'commits' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
              The following {uniqueCommits.length} commit(s) from <strong style={{ color: '#34D399' }}>{compareBranch}</strong> will be merged into <strong style={{ color: '#60A5FA' }}>{baseBranch}</strong>:
            </div>
            {uniqueCommits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', color: '#94A3B8' }}>
                No new unique commits found in '{compareBranch}' that aren't already in '{baseBranch}'.
              </div>
            ) : (
              uniqueCommits.map((c) => (
                <div key={c.hash} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
                      {c.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      Authored by {c.author || 'git@committree'} on {c.date || 'today'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                    {c.hash}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Files Changed & Diff Review */}
        {activeTab === 'diff' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {diffs.map((d) => (
                <button
                  key={d.path}
                  onClick={() => setSelectedFile(d.path)}
                  style={{
                    background: selectedFile === d.path ? '#1E293B' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${selectedFile === d.path ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                    color: selectedFile === d.path ? '#FFFFFF' : '#94A3B8',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {d.path} <span style={{ color: '#34D399', marginLeft: '4px' }}>+{d.additions}</span> <span style={{ color: '#F87171' }}>-{d.deletions}</span>
                </button>
              ))}
            </div>

            <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: '8px', padding: '12px', flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
              {activeDiff.lines.map((line, idx) => {
                const lineKey = `${selectedFile}:${idx}`;
                const comment = inlineComments[lineKey];
                const isCommenting = commentingLineKey === lineKey;
                const bgColor = line.type === 'add' ? 'rgba(16, 185, 129, 0.15)' : line.type === 'del' ? 'rgba(239, 68, 68, 0.15)' : 'transparent';
                const color = line.type === 'add' ? '#34D399' : line.type === 'del' ? '#F87171' : '#CBD5E1';
                const symbol = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';

                return (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <div
                      onClick={() => setCommentingLineKey(isCommenting ? null : lineKey)}
                      style={{
                        display: 'flex',
                        background: bgColor,
                        color,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      title="Click to add inline review comment"
                    >
                      <div>
                        <span style={{ opacity: 0.5, marginRight: '8px', display: 'inline-block', width: '24px', textAlign: 'right' }}>{idx + 1}</span>
                        <strong style={{ marginRight: '8px' }}>{symbol}</strong>
                        <span>{line.content}</span>
                      </div>
                      <span style={{ fontSize: '11px', opacity: 0.6, background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>💬 Review</span>
                    </div>

                    {/* Existing inline comment */}
                    {comment && (
                      <div style={{ margin: '4px 0 8px 36px', background: 'rgba(56, 189, 248, 0.15)', borderLeft: '3px solid #38BDF8', padding: '8px 12px', borderRadius: '4px', color: '#E0F2FE', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><strong>💬 Team Reviewer:</strong> {comment}</div>
                        <button onClick={() => { const next = { ...inlineComments }; delete next[lineKey]; setInlineComments(next); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}

                    {/* New comment input box */}
                    {isCommenting && (
                      <div style={{ margin: '4px 0 8px 36px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Write a code review comment for this line..."
                          style={{ flex: 1, background: '#1E293B', border: '1px solid #38BDF8', borderRadius: '4px', padding: '6px 10px', color: '#FFF', fontSize: '12px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddInlineComment(lineKey); }}
                        />
                        <button onClick={() => handleAddInlineComment(lineKey)} style={{ background: '#38BDF8', color: '#0F172A', border: 'none', borderRadius: '4px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Submit</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: AI Team Review */}
        {activeTab === 'ai' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#C084FC', margin: 0 }}>
                  🤖 Automated AI Code Review Bot
                </h4>
                <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '4px 0 0 0' }}>
                  Simulate enterprise code review feedback from simulated senior architects and DevOps engineers!
                </p>
              </div>
              <button
                onClick={handleRequestAiReview}
                disabled={aiReviewStatus === 'analyzing'}
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #7E22CE)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: aiReviewStatus === 'analyzing' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
                }}
              >
                {aiReviewStatus === 'analyzing' ? '🔄 Analyzing Diff...' : '🤖 Request AI Review'}
              </button>
            </div>

            {aiReviewStatus === 'idle' && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                Click "Request AI Review" above to run automated linting, commit graph analysis, and merge verification!
              </div>
            )}

            {aiReviewStatus === 'analyzing' && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#C084FC', fontWeight: 600, fontSize: '16px' }}>
                🤖 AI Teammates are inspecting your commit graph and file diffs...
              </div>
            )}

            {aiReviewStatus === 'approved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', padding: '12px 16px', borderRadius: '8px', color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✅</span> Pull Request Approved! All simulated reviewers signed off.
                </div>

                {aiFeedback.map((fb, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.8)', border: `1px solid ${fb.type === 'warning' ? '#F59E0B' : fb.type === 'success' ? '#10B981' : '#38BDF8'}`, borderRadius: '10px', padding: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '28px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px' }}>{fb.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#F8FAFC', fontSize: '14px' }}>{fb.reviewer}</strong>
                        <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>{fb.role}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#E2E8F0', margin: '6px 0 0 0', lineHeight: '1.5' }}>{fb.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer: Merge Strategy & Action Button */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 700, marginBottom: '8px' }}>
            Select Pull Request Merge Strategy:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {/* Merge Commit */}
            <div
              onClick={() => setStrategy('merge')}
              style={{
                background: strategy === 'merge' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${strategy === 'merge' ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: strategy === 'merge' ? '#38BDF8' : '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔀</span> Create a Merge Commit
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>
                Creates a 2-parent `--no-ff` merge node. Preserves the full feature branch topology.
              </div>
            </div>

            {/* Squash and Merge */}
            <div
              onClick={() => setStrategy('squash')}
              style={{
                background: strategy === 'squash' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${strategy === 'squash' ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: strategy === 'squash' ? '#10B981' : '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🍱</span> Squash and Merge
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>
                Combines all {uniqueCommits.length} feature commit(s) into 1 single clean atomic commit on '{baseBranch}'.
              </div>
            </div>

            {/* Rebase and Merge */}
            <div
              onClick={() => setStrategy('rebase')}
              style={{
                background: strategy === 'rebase' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                border: `2px solid ${strategy === 'rebase' ? '#A855F7' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: strategy === 'rebase' ? '#A855F7' : '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🪜</span> Rebase and Merge
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>
                Replays all feature commits sequentially onto '{baseBranch}' tip for a strictly linear history.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid #475569', color: '#CBD5E1', padding: '12px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteMerge}
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
              }}
            >
              <span>🚀</span> Merge Pull Request ({strategy.toUpperCase()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
