import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface CheatSheetModalProps {
  onSelectCommand: (cmdStr: string) => void;
  onAwardBadge: (badgeId: string) => void;
  onClose: () => void;
}

interface CommandCard {
  id: string;
  cmd: string;
  category: 'snapshot' | 'branch' | 'remote' | 'inspect' | 'undo';
  title: string;
  description: string;
  flags?: string[];
  tip?: string;
  warning?: string;
}

const COMMAND_DATABASE: CommandCard[] = [
  {
    id: 'status',
    cmd: 'git status',
    category: 'snapshot',
    title: 'Inspect Working Directory Status',
    description: 'Displays paths that have differences between the index file and the current HEAD commit, paths that have differences between the working tree and the index file, and paths in the working tree that are not tracked by Git.',
    flags: ['-s / --short: Give the output in short-format.'],
    tip: 'Run this constantly! It is your dashboard for seeing what files are staged or modified.',
  },
  {
    id: 'add',
    cmd: 'git add .',
    category: 'snapshot',
    title: 'Stage Changes for Snapshot',
    description: 'Updates the index using the current content found in the working tree, to prepare the content staged for the next commit.',
    flags: ['-p / --patch: Interactively choose hunks of patch between the index and the work tree.'],
    tip: 'Use `git add <file>` to selectively stage individual files rather than everything at once.',
  },
  {
    id: 'commit',
    cmd: 'git commit -m "feat: add user authentication"',
    category: 'snapshot',
    title: 'Create Commit Snapshot',
    description: 'Stores the current contents of the index in a new commit along with a log message from the user describing the changes.',
    flags: ['--amend: Replace the tip of the current branch by creating a new commit.'],
    tip: 'Follow Conventional Commits format (`feat:`, `fix:`, `docs:`) for clean team history!',
  },
  {
    id: 'checkout_b',
    cmd: 'git checkout -b feature/login',
    category: 'branch',
    title: 'Create and Switch to New Branch',
    description: 'Creates a new branch pointer pointing to the current HEAD commit and immediately switches your active working directory to it.',
    flags: ['-b <new-branch>: Create a new branch and checkout into it.'],
    tip: 'In modern Git, you can also use `git switch -c feature/login`!',
  },
  {
    id: 'merge',
    cmd: 'git merge feature/login',
    category: 'branch',
    title: 'Merge Branch into Current Branch',
    description: 'Incorporates changes from the named branch into the current branch. Creates a merge commit if histories have diverged.',
    flags: ['--no-ff: Create a merge commit even when the merge resolves as a fast-forward.', '--squash: Produce the working tree and index state as if a real merge happened, but do not make a commit.'],
    tip: 'Always ensure you are checked out on your target branch (e.g. `main`) before running `git merge`!',
  },
  {
    id: 'rebase_i',
    cmd: 'git rebase -i HEAD~3',
    category: 'branch',
    title: 'Interactive Rebase & History Rewriting',
    description: 'Opens an interactive editor allowing you to pick, reword, squash, edit, or drop the last N commits.',
    flags: ['-i / --interactive: Make a list of commits to be rebased and let the user edit that list.'],
    warning: 'Never rebase commits that have already been pushed to a shared public repository!',
  },
  {
    id: 'fetch',
    cmd: 'git fetch origin',
    category: 'remote',
    title: 'Download Remote Tracking Branches',
    description: 'Downloads commits, files, and refs from a remote repository into your local repository without merging them into your working branches.',
    flags: ['--all: Fetch all remotes.', '--prune: Remove remote-tracking references that no longer exist on the remote.'],
    tip: 'Safe command! Inspect changes with `git log origin/main` before deciding how to merge or rebase.',
  },
  {
    id: 'pull_rebase',
    cmd: 'git pull --rebase origin main',
    category: 'remote',
    title: 'Fetch & Replay Local Work Cleanly',
    description: 'Fetches the specified remote branch and rebases your current local branch commits on top of it, avoiding unnecessary merge commits.',
    tip: 'The gold standard workflow for syncing feature branches in professional DevOps teams!',
  },
  {
    id: 'push',
    cmd: 'git push origin main',
    category: 'remote',
    title: 'Upload Local Commits to Remote',
    description: 'Updates remote refs using local refs, sending objects necessary to complete the given refs.',
    flags: ['-u / --set-upstream: Add upstream tracking reference, used by argument-less git-pull.'],
    tip: 'If your push is rejected due to diverged history, run `git pull --rebase` first!',
  },
  {
    id: 'log',
    cmd: 'git log --oneline --graph --all',
    category: 'inspect',
    title: 'Visual Commit History Graph',
    description: 'Shows the commit logs formatted as a concise ascii tree diagram representing all branch paths and tags.',
    flags: ['--oneline: Shorthand for --pretty=oneline --abbrev-commit.', '--graph: Draw a text-based graphical representation of the commit history.'],
    tip: 'This is exactly what CommitTree simulates visually in interactive 3D/2D cards!',
  },
  {
    id: 'reflog',
    cmd: 'git reflog',
    category: 'inspect',
    title: 'Time Machine (Reference Log)',
    description: 'Records when the tips of branches and other references were updated in the local repository. Can recover "lost" commits!',
    tip: 'Use `git reset --hard HEAD@{n}` to jump your repository back to any recorded state!',
  },
  {
    id: 'reset_hard',
    cmd: 'git reset --hard HEAD~1',
    category: 'undo',
    title: 'Hard Reset (Discard Commits)',
    description: 'Resets the current branch tip to the specified commit, discarding all changes in the staging area and working directory.',
    warning: 'Destructive operation! Any uncommitted modifications in your working directory will be permanently deleted.',
  },
  {
    id: 'revert',
    cmd: 'git revert HEAD',
    category: 'undo',
    title: 'Safe Undo (Create Inverse Commit)',
    description: 'Creates a new commit that reverses the exact patch changes introduced by the target commit, without altering historical timeline.',
    tip: 'The safest way to undo bugs on production branches like `main` or `master`!',
  },
  {
    id: 'stash',
    cmd: 'git stash',
    category: 'undo',
    title: 'Temporarily Stash Uncommitted Work',
    description: 'Saves your local modifications away and reverts the working directory to match the HEAD commit.',
    flags: ['pop: Remove a single stashed state from the stash list and apply it on top of the current working tree.'],
    tip: 'Use `git stash list` to inspect your saved work cards!',
  },
];

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({
  onSelectCommand,
  onAwardBadge,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [exploredCount, setExploredCount] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCommands = COMMAND_DATABASE.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchesSearch =
      c.cmd.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTryCommand = (cmd: string) => {
    soundEngine.playClick();
    const newCount = exploredCount + 1;
    setExploredCount(newCount);
    if (newCount >= 5) {
      onAwardBadge('encyclopedia_scholar');
    }
    onSelectCommand(cmd);
    onClose();
  };

  const handleCopy = (id: string, cmd: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    soundEngine.playClick();
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#0F172A',
        border: '1px solid #38BDF8',
        borderRadius: '16px',
        width: '92%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)',
        color: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>📖</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#38BDF8' }}>
                Git Encyclopedia & Interactive Cheat-Sheet
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                Search commands, explore parameters, and test directly in your active simulation!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '14px',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Search and Categories */}
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="🔍 Search Git commands (e.g., 'rebase', 'undo', 'branch', 'status')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              backgroundColor: '#090D16',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#FFFFFF',
              fontSize: '14px',
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: '🌟 All Commands' },
              { id: 'snapshot', label: '🌱 Snapshotting' },
              { id: 'branch', label: '🌿 Branching & Merging' },
              { id: 'remote', label: '🔄 Sharing & Remotes' },
              { id: 'inspect', label: '🎛️ Inspection & Logs' },
              { id: 'undo', label: '🚨 Emergency Undo' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveCategory(cat.id);
                }}
                style={{
                  backgroundColor: activeCategory === cat.id ? '#38BDF8' : 'rgba(30, 41, 59, 0.6)',
                  color: activeCategory === cat.id ? '#0F172A' : '#CBD5E1',
                  border: `1px solid ${activeCategory === cat.id ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Command Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
              <div>No Git commands match "{searchQuery}"</div>
            </div>
          ) : (
            filteredCommands.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: c.category === 'undo' ? 'rgba(239, 68, 68, 0.2)' : c.category === 'remote' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: c.category === 'undo' ? '#F87171' : c.category === 'remote' ? '#34D399' : '#38BDF8',
                      marginRight: '8px',
                    }}>
                      {c.category}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
                      {c.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => handleCopy(c.id, c.cmd, e)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#CBD5E1',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === c.id ? '✓ Copied!' : '📋 Copy'}
                    </button>

                    <button
                      onClick={() => handleTryCommand(c.cmd)}
                      style={{
                        backgroundColor: '#38BDF8',
                        color: '#0F172A',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      ⚡ Try in Terminal
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#090D16', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '14px', color: '#38BDF8', borderLeft: '3px solid #38BDF8' }}>
                  $ {c.cmd}
                </div>

                <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>
                  {c.description}
                </div>

                {c.flags && c.flags.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#94A3B8' }}>
                    <strong style={{ color: '#E2E8F0' }}>Common Flags:</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {c.flags.map((f, i) => (
                        <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.tip && (
                  <div style={{ fontSize: '12px', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    💡 <strong>Pro-Tip:</strong> {c.tip}
                  </div>
                )}

                {c.warning && (
                  <div style={{ fontSize: '12px', color: '#F87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    ⚠️ <strong>Warning:</strong> {c.warning}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Explore 5 commands to unlock the <strong>Git Scholar 📖</strong> achievement badge!</div>
          <div>Explored in this session: <strong style={{ color: '#38BDF8' }}>{exploredCount}</strong> / 5</div>
        </div>
      </div>
    </div>
  );
};
