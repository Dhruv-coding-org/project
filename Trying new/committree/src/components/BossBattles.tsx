import React, { useState } from 'react';
import type { Challenge } from '../git/challenges';

interface BossBattlesProps {
  onStartBattle: (challenge: Challenge) => void;
  onAwardBadge: (badgeId: string) => void;
}

export interface BossChallenge extends Challenge {
  difficulty: string;
  bossAvatar: string;
  bossName: string;
  story: string;
  xpReward: number;
}

export const BOSS_BATTLES: BossChallenge[] = [
  {
    id: 101,
    title: 'Boss 1: Detached HEAD Disaster 💥',
    bossName: 'The Orphaned Wraith',
    bossAvatar: '👻',
    difficulty: '⭐⭐⭐ (Hard)',
    xpReward: 300,
    story: "A rogue deployment script detached your HEAD and made 3 critical commits (c3, c4, c5) in the void without a branch pointer! Meanwhile 'main' is left stranded behind at c2.",
    description: "You are in detached HEAD state at commit C5. Without a branch pointer, these commits will be lost to Git's garbage collection!",
    objective: "Create a rescue branch or merge/reset 'main' to point to commit C5 so the work is saved.",
    hint: "Try creating a branch right where you are: 'git branch rescue' or check out main and merge C5: 'git merge C5'.",
    tutorial: {
      conceptTitle: 'Recovering from Detached HEAD',
      explanation: [
        'When you commit in detached HEAD state, no branch pointer advances with you.',
        'To save orphaned commits, simply create a new branch pointer at your current HEAD using `git branch <name>` or merge the orphaned commit hash directly into your primary branch!'
      ],
    },
    beginnerTips: [
      'Look at the Commit Inspector or Hover on nodes to copy exact commit hashes like C5!',
    ],
    startingCommands: [
      'git commit -m "c1"',
      'git commit -m "c2"',
      'git checkout C1',
      'git commit -m "c3"',
      'git commit -m "c4"',
      'git commit -m "c5"',
    ],
    solutionCommands: [
      'git branch rescue',
      'git checkout main',
      'git merge rescue',
    ],
    checkWin: (state) => {
      const mainHash = state.branches['main']?.targetHash;
      if (mainHash === 'C5') return true;
      const anyBranchAtC5 = Object.values(state.branches).some((b) => b.targetHash === 'C5' && b.name !== 'main');
      return anyBranchAtC5;
    },
  },
  {
    id: 102,
    title: 'Boss 2: The 4-Head Hydroid 🐉',
    bossName: 'Hydra of Divergence',
    bossAvatar: '🐉',
    difficulty: '⭐⭐⭐⭐ (Expert)',
    xpReward: 400,
    story: "Four engineers pushed divergent feature branches (feat-alpha, feat-beta, feat-gamma) directly branching off initial commit C0 without merging! Untangle this multi-headed monster.",
    description: "The repository has split into 3 divergent feature branches alongside main.",
    objective: "Merge all 3 feature branches ('feat-alpha', 'feat-beta', 'feat-gamma') into 'main'.",
    hint: "Check out main ('git checkout main') and merge each branch one by one: 'git merge feat-alpha', 'git merge feat-beta', etc.",
    tutorial: {
      conceptTitle: 'Taming Divergent Branches',
      explanation: [
        'In large teams, branches often diverge from the root commit.',
        'By performing sequential merges or rebasing, you can consolidate disparate lines of work into a unified main graph.'
      ],
    },
    beginnerTips: [
      'Watch how Git creates special merge commits with multiple parents as you consolidate the Hydroid!',
    ],
    startingCommands: [
      'git branch feat-alpha',
      'git branch feat-beta',
      'git branch feat-gamma',
      'git checkout feat-alpha',
      'git commit -m "alpha-1"',
      'git checkout feat-beta',
      'git commit -m "beta-1"',
      'git checkout feat-gamma',
      'git commit -m "gamma-1"',
      'git checkout main',
    ],
    solutionCommands: [
      'git merge feat-alpha',
      'git merge feat-beta',
      'git merge feat-gamma',
    ],
    checkWin: (state) => {
      const mainCommit = state.commits[state.branches['main']?.targetHash || ''];
      if (!mainCommit) return false;
      // Win if main has merged multiple branches (at least commit counter >= 6 or 2+ parents)
      return state.commitCounter >= 6 || mainCommit.parents.length >= 2;
    },
  },
  {
    id: 103,
    title: 'Boss 3: The Wipeout Rescue ⏳',
    bossName: 'Chronos the Destroyer',
    bossAvatar: '⏳',
    difficulty: '⭐⭐⭐⭐⭐ (Legendary)',
    xpReward: 500,
    story: "A junior developer accidentally executed 'git reset --hard C0' while on the main branch! Four days of feature commits (c1, c2, c3, c4) vanished from the graph!",
    description: "The main branch has been reset to C0, wiping out commit C4 from the visible branch history.",
    objective: "Use your Reflog Time Machine ('git reflog', 'git reset --hard HEAD@{n}' or 'git reset --hard C4') to resurrect the lost commit chain!",
    hint: "Click the '⏳ Time Machine' button in the top toolbar to find where HEAD was right before the reset, or type 'git reset --hard C4'.",
    tutorial: {
      conceptTitle: 'Resurrecting Wiped History with Reflog',
      explanation: [
        '`git reset --hard` can feel catastrophic, but in Git, commits are rarely destroyed immediately!',
        'Because Git records all movements in the reflog (`HEAD@{n}`), you can always travel back in time and restore your branch tip to its pre-reset state.'
      ],
    },
    beginnerTips: [
      'You can also use the UI Reflog Time Machine button in the header bar for a 1-click rescue!',
    ],
    startingCommands: [
      'git commit -m "c1"',
      'git commit -m "c2"',
      'git commit -m "c3"',
      'git commit -m "c4"',
      'git reset --hard C0',
    ],
    solutionCommands: [
      'git reset --hard C4',
    ],
    checkWin: (state) => {
      return state.branches['main']?.targetHash === 'C4';
    },
  },
];

export const BossBattles: React.FC<BossBattlesProps> = ({ onStartBattle, onAwardBadge }) => {
  const [selectedBoss, setSelectedBoss] = useState<BossChallenge>(BOSS_BATTLES[0]);

  const handleLaunchBattle = () => {
    onAwardBadge('boss_slayer');
    onStartBattle(selectedBoss);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', color: '#F8FAFC' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '24px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(135deg, #EF4444, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <span>🐉</span> Boss Battles Arena: High-Stakes Chaos Recovery
        </h2>
        <p style={{ color: '#94A3B8', fontSize: '15px', maxWidth: '700px', margin: '8px auto 0', lineHeight: '1.5' }}>
          Test your Git mastery against catastrophic real-world development disasters! Detached HEADs, divergent hydroids, and wiped histories await.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Boss Selector Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '4px' }}>
            Select Threat Level
          </h3>
          {BOSS_BATTLES.map((boss) => {
            const isSelected = boss.id === selectedBoss.id;
            return (
              <div
                key={boss.id}
                onClick={() => setSelectedBoss(boss)}
                style={{
                  background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: `2px solid ${isSelected ? '#EF4444' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '36px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {boss.bossAvatar}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#FCA5A5' : '#F8FAFC' }}>
                    {boss.bossName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                    {boss.title.split(':')[1]?.trim() || boss.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#FBBF24', fontWeight: 600, marginTop: '6px' }}>
                    {boss.difficulty} • +{boss.xpReward} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Boss Details & Launch */}
        <div style={{ background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                {selectedBoss.difficulty}
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {selectedBoss.title}
              </h3>
            </div>
            <div style={{ fontSize: '48px', opacity: 0.8 }}>
              {selectedBoss.bossAvatar}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderLeft: '4px solid #EF4444', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              📜 Incident Report (Backstory)
            </div>
            <p style={{ fontSize: '14px', color: '#E2E8F0', lineHeight: '1.6', fontStyle: 'italic' }}>
              "{selectedBoss.story}"
            </p>
          </div>

          <div style={{ marginBottom: '24px', flex: 1 }}>
            <h4 style={{ fontSize: '14px', color: '#38BDF8', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎯</span> Mission Objective
            </h4>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '14px', borderRadius: '8px', fontSize: '15px', color: '#7DD3FC', fontWeight: 600 }}>
              {selectedBoss.objective}
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <div style={{ fontSize: '13px', color: '#FDE68A' }}>
              <strong>Tactical Tip:</strong> {selectedBoss.hint}
            </div>
          </div>

          <button
            onClick={handleLaunchBattle}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              border: 'none',
              color: '#FFFFFF',
              padding: '16px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <span>⚔️</span> Engage Boss Battle Mode
          </button>
        </div>
      </div>
    </div>
  );
};
