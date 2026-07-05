import { useState, useEffect } from 'react';
import { type GitState, INITIAL_STATE, runGitCommand } from './git/gitEngine';
import { CHALLENGES, getStartingStateForChallenge, getTargetStateForChallenge } from './git/challenges';
import { GitGraph } from './components/GitGraph';
import { Terminal } from './components/Terminal';
import { ChallengeBox } from './components/ChallengeBox';
import { NodeInspector } from './components/NodeInspector';
import { CommandVisualizer3D } from './components/CommandVisualizer3D';
import { ProfileModal } from './components/ProfileModal';
import { getActiveProfile, completeLevelForActiveProfile, type UserProfile } from './store/profileStore';
import './App.css';

interface CommandHistoryItem {
  command: string;
  output: string[];
  isError?: boolean;
}

function App() {
  // Profile State
  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => getActiveProfile());
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Mode selection: 'campaign' | 'sandbox' | 'visualizer'
  const [mode, setMode] = useState<'campaign' | 'sandbox' | 'visualizer'>('campaign');

  // Toggle between Your Graph and Goal Graph
  const [graphView, setGraphView] = useState<'player' | 'goal'>('player');

  // Tabs for mobile device layouts
  const [mobileTab, setMobileTab] = useState<'instructions' | 'terminal' | 'inspector'>('terminal');

  // Git State
  const [sandboxState, setSandboxState] = useState<GitState>(() => {
    const saved = localStorage.getItem('committree_sandbox_state');
    return saved ? JSON.parse(saved) : { ...INITIAL_STATE };
  });

  const [currentChallengeId, setCurrentChallengeId] = useState<number>(() => {
    const saved = localStorage.getItem('committree_curr_lvl');
    return saved ? parseInt(saved, 10) : 1;
  });

  const currentChallenge = CHALLENGES.find(c => c.id === currentChallengeId) || CHALLENGES[0];

  const [campaignState, setCampaignState] = useState<GitState>(() => {
    return getStartingStateForChallenge(currentChallenge);
  });

  // Level Completion List (derived from active Profile)
  const [completedChallenges, setCompletedChallenges] = useState<number[]>(() => {
    return activeProfile.completedLevelIds;
  });

  // Keep completedChallenges in sync when profile switches
  useEffect(() => {
    setCompletedChallenges(activeProfile.completedLevelIds);
  }, [activeProfile]);

  // Active Git state based on mode
  const activeGitState = mode === 'sandbox' ? sandboxState : campaignState;

  // Compute challenge target state
  const targetState = getTargetStateForChallenge(currentChallenge);

  // Selected Commit (for inspection)
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);

  // Command History per mode
  const [sandboxHistory, setSandboxHistory] = useState<CommandHistoryItem[]>([]);
  const [campaignHistory, setCampaignHistory] = useState<CommandHistoryItem[]>([]);
  const activeHistory = mode === 'sandbox' ? sandboxHistory : campaignHistory;

  // Win checker for levels
  const [isLvlWon, setIsLvlWon] = useState(false);

  // Auto-save sandbox state to local storage
  useEffect(() => {
    localStorage.setItem('committree_sandbox_state', JSON.stringify(sandboxState));
  }, [sandboxState]);

  useEffect(() => {
    localStorage.setItem('committree_curr_lvl', currentChallengeId.toString());
  }, [currentChallengeId]);

  // Check victory whenever campaign state changes
  useEffect(() => {
    if (mode === 'campaign') {
      const won = currentChallenge.checkWin(campaignState);
      setIsLvlWon(won);
      if (won && !completedChallenges.includes(currentChallenge.id)) {
        const updatedProfile = completeLevelForActiveProfile(currentChallenge.id, CHALLENGES.length);
        setActiveProfile(updatedProfile);
        setCompletedChallenges(updatedProfile.completedLevelIds);
      }
    } else {
      setIsLvlWon(false);
    }
  }, [campaignState, currentChallenge, mode, completedChallenges]);

  // Load new level state
  const loadChallenge = (id: number) => {
    setCurrentChallengeId(id);
    const newLvl = CHALLENGES.find(c => c.id === id) || CHALLENGES[0];
    const freshState = getStartingStateForChallenge(newLvl);
    setCampaignState(freshState);
    setSelectedCommitHash(null);
    setGraphView('player');
    setMobileTab('terminal');
    setCampaignHistory([
      {
        command: '',
        output: [`--- Initialized ${newLvl.title} ---`, `Goal: ${newLvl.objective}`],
      },
    ]);
  };

  const handleNextLevel = () => {
    const nextId = currentChallengeId + 1;
    if (CHALLENGES.find(c => c.id === nextId)) {
      loadChallenge(nextId);
    }
  };

  // Reset current challenge or sandbox
  const handleReset = () => {
    setGraphView('player');
    setMobileTab('terminal');
    if (mode === 'campaign') {
      loadChallenge(currentChallengeId);
    } else if (mode === 'sandbox') {
      setSandboxState({ ...INITIAL_STATE });
      setSandboxHistory([]);
      setSelectedCommitHash(null);
    }
  };

  // Command Dispatcher
  const handleExecuteCommand = (cmdText: string) => {
    setGraphView('player');
    const res = runGitCommand(activeGitState, cmdText);

    const historyItem: CommandHistoryItem = {
      command: cmdText,
      output: res.output,
      isError: !!res.error,
    };

    if (res.error) {
      historyItem.output = [res.error];
    }

    if (mode === 'sandbox') {
      setSandboxState(res.state);
      setSandboxHistory(prev => [...prev, historyItem]);
    } else {
      setCampaignState(res.state);
      setCampaignHistory(prev => [...prev, historyItem]);
    }

    if (!res.error) {
      const subCmd = cmdText.trim().split(/\s+/)[1];
      if (['commit', 'checkout', 'switch', 'merge', 'rebase', 'cherry-pick', 'reset', 'revert'].includes(subCmd)) {
        setSelectedCommitHash(res.state.headCommitHash);
      }
    }
  };

  const handleClearHistory = () => {
    if (mode === 'sandbox') {
      setSandboxHistory([]);
    } else {
      setCampaignHistory([]);
    }
  };

  // Switch Mode handler
  const handleModeChange = (newMode: 'campaign' | 'sandbox' | 'visualizer') => {
    setMode(newMode);
    setSelectedCommitHash(null);
    setGraphView('player');
    setMobileTab('terminal');
    if (newMode === 'campaign') {
      const freshState = getStartingStateForChallenge(currentChallenge);
      setCampaignState(freshState);
      setCampaignHistory([
        {
          command: '',
          output: [`--- Loaded ${currentChallenge.title} ---`],
        },
      ]);
    }
  };

  const selectedCommit = selectedCommitHash ? activeGitState.commits[selectedCommitHash] : null;

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">🌳</span>
          <h1 className="brand-name">CommitTree</h1>
          <span className="brand-subtitle font-sm-hidden">Interactive Git Simulator</span>
        </div>

        <div className="header-controls">
          {/* Profile Switcher Button */}
          <button
            className="profile-top-btn"
            onClick={() => setShowProfileModal(true)}
            title="Switch Player Profile or View Achievements"
          >
            <span className="profile-avatar-emoji">{activeProfile.avatar}</span>
            <span className="profile-name-text">{activeProfile.name}</span>
            <span className="profile-rank-pill">{activeProfile.title}</span>
          </button>

          {/* Mode Switcher */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'campaign' ? 'active' : ''}`}
              onClick={() => handleModeChange('campaign')}
            >
              🏆 Campaign
            </button>
            <button
              className={`mode-btn ${mode === 'sandbox' ? 'active' : ''}`}
              onClick={() => handleModeChange('sandbox')}
            >
              🥪 Sandbox
            </button>
            <button
              className={`mode-btn ${mode === 'visualizer' ? 'active' : ''}`}
              onClick={() => handleModeChange('visualizer')}
            >
              🪐 3D Guide
            </button>
          </div>

          {mode !== 'visualizer' && (
            <button className="global-reset-btn" onClick={handleReset}>
              🔄 Reset
            </button>
          )}
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="app-body">
        {mode === 'visualizer' ? (
          <div className="full-width-visualizer">
            <CommandVisualizer3D
              onInsertCommand={(cmd) => {
                handleModeChange('sandbox');
                handleExecuteCommand(cmd);
              }}
            />
          </div>
        ) : (
          <>
            {/* Left Side: Commit Graph SVG Canvas */}
            <section className="left-panel">
              {mode === 'campaign' && (
                <div className="graph-view-tabs">
                  <button
                    className={`graph-tab-btn ${graphView === 'player' ? 'active' : ''}`}
                    onClick={() => setGraphView('player')}
                  >
                    🌳 Your Graph
                  </button>
                  <button
                    className={`graph-tab-btn ${graphView === 'goal' ? 'active' : ''}`}
                    onClick={() => setGraphView('goal')}
                  >
                    🎯 Goal Graph
                  </button>
                </div>
              )}

              <GitGraph
                gitState={graphView === 'goal' ? targetState : activeGitState}
                selectedCommitHash={graphView === 'goal' ? null : selectedCommitHash}
                onSelectCommit={graphView === 'goal' ? () => {} : setSelectedCommitHash}
                isGoalView={graphView === 'goal'}
              />
            </section>

            {/* Right Side: Challenge parameters, Terminal inputs, Node inspectors */}
            <section className="right-panel">
              <div className="mobile-tabs-nav">
                <button
                  className={`mobile-nav-btn ${mobileTab === 'instructions' ? 'active' : ''}`}
                  onClick={() => setMobileTab('instructions')}
                >
                  📋 Objectives
                </button>
                <button
                  className={`mobile-nav-btn ${mobileTab === 'terminal' ? 'active' : ''}`}
                  onClick={() => setMobileTab('terminal')}
                >
                  💻 Terminal
                </button>
                <button
                  className={`mobile-nav-btn ${mobileTab === 'inspector' ? 'active' : ''}`}
                  onClick={() => setMobileTab('inspector')}
                >
                  🔍 Inspector
                </button>
              </div>

              {/* 1. Instructions Module */}
              <div className={`responsive-panel-section ${mobileTab !== 'instructions' ? 'mobile-hidden' : ''}`}>
                {mode === 'campaign' ? (
                  <ChallengeBox
                    challenges={CHALLENGES}
                    currentChallenge={currentChallenge}
                    completedChallenges={completedChallenges}
                    onSelectChallenge={loadChallenge}
                    onResetChallenge={handleReset}
                    isWon={isLvlWon}
                    onNextLevel={handleNextLevel}
                  />
                ) : (
                  <div className="sandbox-intro-box">
                    <div className="sandbox-header">
                      <h3>Sandbox Playground</h3>
                      <span className="badge">FREE PLAY</span>
                    </div>
                    <p>
                      Experiment with any branch, commit, rebase, merge, tag, stash, revert, or remote command.
                      Watch the commit nodes and tags generate on the left in real-time.
                    </p>
                    <button
                      className="open-3d-guide-btn"
                      onClick={() => handleModeChange('visualizer')}
                    >
                      🪐 Open 3D Command Assistant & Guide
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Interactive Shell Prompt Console */}
              <div className={`responsive-panel-section console-wrapper ${mobileTab !== 'terminal' ? 'mobile-hidden' : ''}`}>
                <Terminal
                  gitState={activeGitState}
                  onExecuteCommand={handleExecuteCommand}
                  commandHistory={activeHistory}
                  onClearHistory={handleClearHistory}
                />
              </div>

              {/* 3. Inspector Panel */}
              <div className={`responsive-panel-section inspector-wrapper ${mobileTab !== 'inspector' ? 'mobile-hidden' : ''}`}>
                <NodeInspector
                  commit={selectedCommit}
                  onClose={() => setSelectedCommitHash(null)}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          activeProfile={activeProfile}
          totalLevels={CHALLENGES.length}
          onSelectProfile={(p) => {
            setActiveProfile(p);
            setCompletedChallenges(p.completedLevelIds);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Dynamic Overlay Celebration for Level Completions */}
      {isLvlWon && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="celebration-badge">🏆</div>
            <h2>Level Completed!</h2>
            <p>You successfully matched the target Git tree structure.</p>
            <div className="celebration-actions">
              <button
                className="celebration-btn"
                onClick={handleNextLevel}
                disabled={currentChallengeId === CHALLENGES[CHALLENGES.length - 1].id}
              >
                {currentChallengeId === CHALLENGES[CHALLENGES.length - 1].id ? 'Campaign Finished!' : 'Next Level →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
