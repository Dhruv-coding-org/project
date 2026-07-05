import React, { useState } from 'react';

interface CommandVisualizer3DProps {
  onInsertCommand: (cmd: string) => void;
}

interface CommandCardData {
  id: string;
  name: string;
  syntax: string;
  category: 'Snapshots' | 'Branches' | 'History' | 'Undoing' | 'Remotes';
  icon: string;
  badgeColor: string;
  description: string;
  proTip: string;
  diagramBefore: string;
  diagramAfter: string;
  exampleCommand: string;
}

const COMMAND_CARDS: CommandCardData[] = [
  {
    id: 'commit',
    name: 'Create Snapshot',
    syntax: 'git commit -m "<msg>"',
    category: 'Snapshots',
    icon: '📸',
    badgeColor: '#10B981',
    description: 'Permanently records the currently staged changes as a new commit checkpoint in the graph.',
    proTip: 'Write concise, imperative messages like "Add login button" instead of "added button".',
    diagramBefore: 'C0 (HEAD, main)',
    diagramAfter:  'C0 ───> C1 (HEAD, main)',
    exampleCommand: 'git commit -m "Update index page"',
  },
  {
    id: 'amend',
    name: 'Amend Last Commit',
    syntax: 'git commit --amend -m "<msg>"',
    category: 'Snapshots',
    icon: '✏️',
    badgeColor: '#10B981',
    description: 'Replaces the tip commit of your current branch with a new commit hash and updated message.',
    proTip: 'Perfect for fixing typos in your commit message immediately after committing!',
    diagramBefore: 'C0 ───> C1 (HEAD, main)',
    diagramAfter:  'C0 ───> C1\' (HEAD, main) [Amended]',
    exampleCommand: 'git commit --amend -m "Fix typo in header"',
  },
  {
    id: 'branch',
    name: 'Create New Branch',
    syntax: 'git branch <name>',
    category: 'Branches',
    icon: '🌿',
    badgeColor: '#06B6D4',
    description: 'Creates a lightweight sticky note pointer at your current commit without moving your HEAD.',
    proTip: 'Branches in Git are nearly instantaneous to create and delete—use them liberally for features!',
    diagramBefore: 'C1 (HEAD, main)',
    diagramAfter:  'C1 (HEAD, main, feature)',
    exampleCommand: 'git branch feature-login',
  },
  {
    id: 'checkout',
    name: 'Switch Branch',
    syntax: 'git checkout <name>',
    category: 'Branches',
    icon: '🧭',
    badgeColor: '#06B6D4',
    description: 'Moves your active HEAD pointer to the specified branch or commit hash, updating your workspace.',
    proTip: 'Use "git checkout -b <name>" to create a new branch and switch to it in a single command!',
    diagramBefore: 'C1 (HEAD, main) [feature exists]',
    diagramAfter:  'C1 (main, HEAD -> feature)',
    exampleCommand: 'git checkout feature-login',
  },
  {
    id: 'merge',
    name: 'Merge Branch',
    syntax: 'git merge <branch>',
    category: 'Branches',
    icon: '🔀',
    badgeColor: '#8B5CF6',
    description: 'Combines independent development histories from a target branch into your current active branch.',
    proTip: 'If neither branch diverged, Git performs a lightning-fast "Fast-Forward" merge without extra commits!',
    diagramBefore: 'C1 (main) ───> C2 (HEAD, feature)',
    diagramAfter:  'C1 ───> C2 (main, HEAD -> feature)',
    exampleCommand: 'git merge feature-login',
  },
  {
    id: 'rebase',
    name: 'Rebase History',
    syntax: 'git rebase <target>',
    category: 'History',
    icon: '🚀',
    badgeColor: '#F59E0B',
    description: 'Re-plays your current branch commits cleanly on top of another branch tip for a linear graph.',
    proTip: 'Always make sure you are on your feature branch BEFORE running "git rebase main"!',
    diagramBefore: 'C1 (main) \n  └── C2 (HEAD, feature)',
    diagramAfter:  'C1 (main) ───> C2\' (HEAD, feature)',
    exampleCommand: 'git rebase main',
  },
  {
    id: 'cherry-pick',
    name: 'Cherry-Pick Commit',
    syntax: 'git cherry-pick <hash>',
    category: 'History',
    icon: '🍒',
    badgeColor: '#F59E0B',
    description: 'Plucks a specific commit from anywhere in the tree and applies a copy onto your current branch.',
    proTip: 'Great for pulling an urgent bugfix commit out of an experimental branch without merging everything.',
    diagramBefore: 'C1 (HEAD, main)   C2 (exp)',
    diagramAfter:  'C1 ───> C2\' (HEAD, main)',
    exampleCommand: 'git cherry-pick C2',
  },
  {
    id: 'tag',
    name: 'Tag Release',
    syntax: 'git tag <name> [hash]',
    category: 'History',
    icon: '🏷️',
    badgeColor: '#F59E0B',
    description: 'Attaches an immutable, permanent milestone badge (like v1.0 or v2.5) to a commit hash.',
    proTip: 'Unlike branches, release tags never move when new commits are created!',
    diagramBefore: 'C3 (HEAD, main)',
    diagramAfter:  'C3 (HEAD, main) [🏷️ v1.0]',
    exampleCommand: 'git tag v1.0.0',
  },
  {
    id: 'stash',
    name: 'Stash Work',
    syntax: 'git stash / git stash pop',
    category: 'Undoing',
    icon: '📦',
    badgeColor: '#F43F5E',
    description: 'Temporarily shelves dirty uncommitted changes onto a clean stack so you can switch branches safely.',
    proTip: 'Run "git stash list" to see all saved items, and "git stash pop" to reapply the top item!',
    diagramBefore: '[Dirty Worktree] (HEAD -> main)',
    diagramAfter:  '[Clean Worktree] + Stash@{0}',
    exampleCommand: 'git stash',
  },
  {
    id: 'revert',
    name: 'Safe Revert',
    syntax: 'git revert <hash>',
    category: 'Undoing',
    icon: '⏪',
    badgeColor: '#F43F5E',
    description: 'Creates a brand new commit that safely reverses and inverts all changes introduced by a target commit.',
    proTip: 'The safest team-friendly way to undo changes in public shared branches without rewriting history!',
    diagramBefore: 'C1 ───> C2 (HEAD, main)',
    diagramAfter:  'C1 ───> C2 ───> C3 (HEAD, main) [Revert C2]',
    exampleCommand: 'git revert C1',
  },
  {
    id: 'reset',
    name: 'Reset Pointer',
    syntax: 'git reset <target>',
    category: 'Undoing',
    icon: '💥',
    badgeColor: '#F43F5E',
    description: 'Rewinds your current branch pointer backwards in time to a previous commit, removing recent history.',
    proTip: 'Use with caution! Any commits orphaned by reset will no longer be visible on your branch.',
    diagramBefore: 'C1 ───> C2 ───> C3 (HEAD, main)',
    diagramAfter:  'C1 (HEAD, main)   [C2, C3 orphaned]',
    exampleCommand: 'git reset C1',
  },
  {
    id: 'fetch',
    name: 'Fetch Remote',
    syntax: 'git fetch origin',
    category: 'Remotes',
    icon: '🌐',
    badgeColor: '#6366F1',
    description: 'Downloads new branch pointers and commit histories from the server without altering your working code.',
    proTip: 'Updates tracking pointers like origin/main so you can inspect coworker changes safely.',
    diagramBefore: 'origin/main behind on server',
    diagramAfter:  'origin/main updated locally',
    exampleCommand: 'git fetch origin',
  },
  {
    id: 'pull',
    name: 'Pull Remote Changes',
    syntax: 'git pull origin main',
    category: 'Remotes',
    icon: '📥',
    badgeColor: '#6366F1',
    description: 'Performs a "git fetch" followed immediately by a "git merge" to integrate server commits into your branch.',
    proTip: 'Always pull latest coworker changes before starting your daily feature development!',
    diagramBefore: 'Local main behind origin/main',
    diagramAfter:  'Local main merged & up-to-date',
    exampleCommand: 'git pull origin main',
  },
  {
    id: 'push',
    name: 'Push Local Commits',
    syntax: 'git push origin main',
    category: 'Remotes',
    icon: '📤',
    badgeColor: '#6366F1',
    description: 'Uploads your local branch commits to the remote repository and advances server tracking pointers.',
    proTip: 'Make sure your code builds cleanly and unit tests pass before publishing with git push!',
    diagramBefore: 'Local C3 ahead of origin/main (C1)',
    diagramAfter:  'origin/main advanced to match local C3',
    exampleCommand: 'git push origin main',
  },
];

const CATEGORIES: ('All' | 'Snapshots' | 'Branches' | 'History' | 'Undoing' | 'Remotes')[] = [
  'All', 'Snapshots', 'Branches', 'History', 'Undoing', 'Remotes'
];

export const CommandVisualizer3D: React.FC<CommandVisualizer3DProps> = ({ onInsertCommand }) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Snapshots' | 'Branches' | 'History' | 'Undoing' | 'Remotes'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = COMMAND_CARDS.filter((card) => {
    const matchesCat = selectedCategory === 'All' || card.category === selectedCategory;
    const matchesQuery = card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.syntax.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="command-visualizer-container">
      {/* Top Welcome Banner */}
      <div className="visualizer-hero">
        <div className="hero-text-wrap">
          <h2 className="hero-title">🪐 3D Git Command Guide & Next-Step Assistant</h2>
          <p className="hero-subtitle">
            Explore interactive isometric cards illustrating every essential Git command. See exact 3D before/after tree transformations, master professional pro-tips, and auto-fill syntax directly into your simulation sandbox!
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-pill">⚡ 14 Master Commands</div>
          <div className="stat-pill">✨ Interactive 3D Visuals</div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="visualizer-controls-bar">
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="search-box-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="command-search-input"
            placeholder="Search commands (e.g. stash, revert, branch)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3D Isometric Cards Grid */}
      <div className="cards-grid-3d">
        {filteredCards.map((card) => (
          <div key={card.id} className="command-card-3d">
            {/* Card Top Header */}
            <div className="card-top-hdr">
              <div className="card-icon-title">
                <span className="card-icon-iso">{card.icon}</span>
                <div>
                  <h4 className="card-cmd-name">{card.name}</h4>
                  <code className="card-syntax">{card.syntax}</code>
                </div>
              </div>
              <span className="category-tag-pill" style={{ backgroundColor: `${card.badgeColor}25`, color: card.badgeColor, borderColor: `${card.badgeColor}60` }}>
                {card.category}
              </span>
            </div>

            {/* Description & Tip */}
            <p className="card-desc">{card.description}</p>
            <div className="card-protip">
              <span className="tip-star">💡</span>
              <span><strong>Pro Tip:</strong> {card.proTip}</span>
            </div>

            {/* Isometric Before/After Diagram Box */}
            <div className="diagram-box-3d">
              <div className="diagram-step">
                <span className="step-lbl">BEFORE</span>
                <pre className="ascii-tree-3d before">{card.diagramBefore}</pre>
              </div>
              <div className="diagram-arrow">➔</div>
              <div className="diagram-step">
                <span className="step-lbl">AFTER</span>
                <pre className="ascii-tree-3d after">{card.diagramAfter}</pre>
              </div>
            </div>

            {/* Action Footer */}
            <div className="card-footer-action">
              <code className="example-preview">{card.exampleCommand}</code>
              <button
                className="auto-fill-btn"
                onClick={() => onInsertCommand(card.exampleCommand)}
                title="Insert this command into the terminal input"
              >
                ✨ Auto-Fill Command
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
