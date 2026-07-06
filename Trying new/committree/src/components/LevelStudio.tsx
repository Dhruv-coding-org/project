import React, { useState } from 'react';
import { type Challenge, getStartingStateForChallenge, getTargetStateForChallenge } from '../git/challenges';
import { encodeChallengeUrl, exportChallengeJson } from '../utils/urlSharing';

interface LevelStudioProps {
  onPlayTest: (challenge: Challenge) => void;
  onAwardBadge: (badgeId: string) => void;
}

export const LevelStudio: React.FC<LevelStudioProps> = ({ onPlayTest, onAwardBadge }) => {
  const [title, setTitle] = useState('My Custom Git Puzzle');
  const [description, setDescription] = useState('Practice merging a feature branch into main without conflicts.');
  const [objective, setObjective] = useState("Merge the 'feature' branch cleanly into 'main'.");
  const [hint, setHint] = useState("Try checking out 'main' and then running 'git merge feature'.");
  const [startingCmdsStr, setStartingCmdsStr] = useState('git commit -m "c1"\ngit branch feature\ngit checkout feature\ngit commit -m "f1"\ngit checkout main');
  const [solutionCmdsStr, setSolutionCmdsStr] = useState('git merge feature');
  const [copiedLink, setCopiedLink] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const buildChallengeObject = (): Challenge => {
    const startingCommands = startingCmdsStr
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.startsWith('#'));
    const solutionCommands = solutionCmdsStr
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.startsWith('#'));

    return {
      id: Date.now(),
      title: title.trim() || 'Custom Challenge',
      description: description.trim() || 'Solve the Git graph target.',
      objective: objective.trim() || 'Match the target tree structure.',
      startingCommands,
      solutionCommands,
      hint: hint.trim() || 'Experiment with Git commands in the terminal.',
      tutorial: {
        conceptTitle: title.trim() || 'Custom Challenge',
        explanation: [description.trim() || 'Welcome to this custom challenge created in Challenge Studio!'],
      },
      beginnerTips: ['Check the Target graph tab to see the exact branch pointers and commits needed to win.'],
      checkWin: () => {
        // We will do exact state match or branch match in App when testing
        return true;
      },
    };
  };

  const handleTestPlay = () => {
    const challenge = buildChallengeObject();
    onAwardBadge('level_creator');
    onPlayTest(challenge);
  };

  const handleCopyShareLink = () => {
    const challenge = buildChallengeObject();
    const url = encodeChallengeUrl(challenge);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      onAwardBadge('level_creator');
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const handleExportJson = () => {
    const challenge = buildChallengeObject();
    exportChallengeJson(challenge);
    onAwardBadge('level_creator');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const chal = parsed.challenge || parsed;
        if (chal.title) {
          setTitle(chal.title);
          setDescription(chal.description || '');
          setObjective(chal.objective || '');
          setHint(chal.hint || '');
          if (Array.isArray(chal.startingCommands)) setStartingCmdsStr(chal.startingCommands.join('\n'));
          if (Array.isArray(chal.solutionCommands)) setSolutionCmdsStr(chal.solutionCommands.join('\n'));
          setImportError(null);
        } else {
          setImportError('Invalid Challenge JSON format.');
        }
      } catch (err) {
        setImportError('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const currentChallenge = buildChallengeObject();
  let startNodeCount = 1;
  let targetNodeCount = 1;
  try {
    const startState = getStartingStateForChallenge(currentChallenge);
    const targetState = getTargetStateForChallenge(currentChallenge);
    startNodeCount = Object.keys(startState.commits).length;
    targetNodeCount = Object.keys(targetState.commits).length;
  } catch (e) {
    // Ignore invalid commands during typing
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'Outfit', sans-serif", display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🛠️</span> Custom Challenge Studio & Level Creator
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '4px' }}>
            Design your own Git puzzles, test play them, and generate shareable links for classrooms, teams, or coding interviews!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📂 Import JSON
            <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
          </label>
          <button
            onClick={handleExportJson}
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid #8B5CF6',
              color: '#A78BFA',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📦 Export JSON
          </button>
        </div>
      </div>

      {importError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          ❌ {importError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Form Controls */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', color: '#38BDF8', marginBottom: '16px', fontWeight: 600 }}>📝 Challenge Metadata</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '10px 12px', color: '#FFFFFF', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Description & Tutorial Concept
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '10px 12px', color: '#FFFFFF', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Win Objective (What the player must do)
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '10px 12px', color: '#FFFFFF', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Hint Text
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              style={{ width: '100%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '10px 12px', color: '#FFFFFF', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Right Column: Commands & Graph Engine */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', color: '#10B981', marginBottom: '16px', fontWeight: 600 }}>⚙️ Command Sequence Builders</h3>

          <div style={{ marginBottom: '16px', flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Starting Commands (1 command per line)
            </label>
            <textarea
              value={startingCmdsStr}
              onChange={(e) => setStartingCmdsStr(e.target.value)}
              rows={5}
              style={{ width: '100%', fontFamily: "'Fira Code', monospace", background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', padding: '10px 12px', color: '#34D399', fontSize: '13px', resize: 'vertical' }}
            />
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Generates initial state: ~{startNodeCount} commit nodes in graph.
            </div>
          </div>

          <div style={{ marginBottom: '16px', flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
              Solution Commands (Target win state commands)
            </label>
            <textarea
              value={solutionCmdsStr}
              onChange={(e) => setSolutionCmdsStr(e.target.value)}
              rows={3}
              style={{ width: '100%', fontFamily: "'Fira Code', monospace", background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '10px 12px', color: '#38BDF8', fontSize: '13px', resize: 'vertical' }}
            />
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
              Generates win condition: ~{targetNodeCount} commit nodes in target graph.
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleTestPlay}
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                color: '#FFFFFF',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              🎮 Test Play Custom Level
            </button>
            <button
              onClick={handleCopyShareLink}
              style={{
                flex: 1,
                background: copiedLink ? '#059669' : 'rgba(59, 130, 246, 0.2)',
                border: `1px solid ${copiedLink ? '#10B981' : '#3B82F6'}`,
                color: copiedLink ? '#FFFFFF' : '#60A5FA',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {copiedLink ? '✅ Copied!' : '🔗 Copy Share Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
