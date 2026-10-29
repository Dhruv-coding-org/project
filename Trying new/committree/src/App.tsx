import { useState, useEffect } from 'react';
import { type GitState, INITIAL_STATE, runGitCommand, executeInteractiveRebase, executePullRequestMerge } from './git/gitEngine';
import { CHALLENGES, getStartingStateForChallenge, getTargetStateForChallenge } from './git/challenges';
import { GitGraph } from './components/GitGraph';
import { Terminal } from './components/Terminal';
import { ChallengeBox } from './components/ChallengeBox';
import { NodeInspector } from './components/NodeInspector';
import { CommandVisualizer3D } from './components/CommandVisualizer3D';
import { ProfileModal } from './components/ProfileModal';
import { getActiveProfile, completeLevelForActiveProfile, type UserProfile, unlockBadgeForActiveProfile, type BadgeInfo } from './store/profileStore';
import { resolveMergeConflict } from './git/gitEngine';
import { ThemeShopModal } from './components/ThemeShopModal';
import { ConflictResolverModal } from './components/ConflictResolverModal';
import { SpeedrunArena } from './components/SpeedrunArena';
import { GitAssistantModal } from './components/GitAssistantModal';
import { InteractiveRebaseModal } from './components/InteractiveRebaseModal';
import { GitBisectModal } from './components/GitBisectModal';
import { StashStackModal } from './components/StashStackModal';
import { ReflogModal } from './components/ReflogModal';
import { DiffModal } from './components/DiffModal';
import { BlameModal } from './components/BlameModal';
import { BadgeToast } from './components/BadgeToast';
import { LevelStudio } from './components/LevelStudio';
import { BossBattles } from './components/BossBattles';
import { PullRequestModal } from './components/PullRequestModal';
import { CIPipelineModal } from './components/CIPipelineModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { CheatSheetModal } from './components/CheatSheetModal';
import { TeamLabModal } from './components/TeamLabModal';
import { encodeSandboxUrl, decodeSandboxUrl, exportSandboxJson, decodeChallengeUrl } from './utils/urlSharing';
import { soundEngine } from './utils/soundEngine';
import './App.css';

interface CommandHistoryItem {
  command: string;
  output: string[];
  isError?: boolean;
}

const GitDashboardBar: React.FC<{ gitState: GitState }> = ({ gitState }) => {
  const isDetached = !gitState.activeBranch;
  const stashSize = gitState.stash?.length || 0;
  const tagCount = Object.keys(gitState.tags || {}).length;

  return (
    <div className="git-dashboard-bar">
      <div className="dash-stat-item">
        <span className="dash-label">🌿 BRANCH</span>
        <span className={`dash-val ${isDetached ? 'val-detached' : 'val-branch'}`}>
          {isDetached ? 'DETACHED' : gitState.activeBranch}
        </span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">📌 HEAD</span>
        <span className="dash-val val-hash">{gitState.headCommitHash}</span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">📦 STASH</span>
        <span className="dash-val val-stash">{stashSize}</span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">🏷️ TAGS</span>
        <span className="dash-val val-tags">{tagCount}</span>
      </div>
    </div>
  );
};

function App() {
  // Profile State
  const [activeProfile, setActiveProfile] = useState<UserProfile>(() => getActiveProfile());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [showBisectModal, setShowBisectModal] = useState(false);
  const [showStashModal, setShowStashModal] = useState(false);
  const [showReflogModal, setShowReflogModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showBlameModal, setShowBlameModal] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [showCIModal, setShowCIModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);
  const [showTeamLabModal, setShowTeamLabModal] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(() => {
      setIsMuted(soundEngine.getMuted());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const [ciStatus, setCiStatus] = useState<'passing' | 'failing' | 'running'>('passing');
  const [diffInitialHashA, setDiffInitialHashA] = useState<string | undefined>(undefined);
  const [assistantError, setAssistantError] = useState<string | null>(null);

  // Mode selection: 'campaign' | 'sandbox' | 'visualizer' | 'speedrun' | 'studio' | 'boss'
  const [mode, setMode] = useState<'campaign' | 'sandbox' | 'visualizer' | 'speedrun' | 'studio' | 'boss'>('campaign');
  const [activeToastBadge, setActiveToastBadge] = useState<BadgeInfo | null>(null);
  const [customChallenge, setCustomChallenge] = useState<any | null>(null);

  const handleAwardBadge = (badgeId: string) => {
    const { profile, newlyUnlocked, badge } = unlockBadgeForActiveProfile(badgeId);
    if (newlyUnlocked && badge) {
      setActiveProfile(profile);
      setActiveToastBadge(badge);
      soundEngine.playSuccess();
    }
  };

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

  const currentChallenge = customChallenge || CHALLENGES.find(c => c.id === currentChallengeId) || CHALLENGES[0];

  const [campaignState, setCampaignState] = useState<GitState>(() => {
    const fromUrl = decodeChallengeUrl();
    if (fromUrl) {
      setTimeout(() => setCustomChallenge(fromUrl), 0);
      return getStartingStateForChallenge(fromUrl);
    }
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

  // Decode shared sandbox URL on startup
  useEffect(() => {
    const sharedCmds = decodeSandboxUrl();
    if (sharedCmds && sharedCmds.length > 0) {
      setMode('sandbox');
      let currState = { ...INITIAL_STATE };
      const newHist: CommandHistoryItem[] = [];
      sharedCmds.forEach((cmd) => {
        const res = runGitCommand(currState, cmd);
        currState = res.state;
        newHist.push({ command: cmd, output: res.output, isError: !!res.error });
      });
      setSandboxState(currState);
      setSandboxHistory(newHist);
      soundEngine.playSuccess();
    }
  }, []);

  // Check victory whenever campaign state changes
  useEffect(() => {
    if (mode === 'campaign') {
      const won = currentChallenge.checkWin(campaignState);
      setIsLvlWon(won);
      if (won && !completedChallenges.includes(currentChallenge.id)) {
        const updatedProfile = completeLevelForActiveProfile(currentChallenge.id, CHALLENGES.length);
        setActiveProfile(updatedProfile);
        setCompletedChallenges(updatedProfile.completedLevelIds);
        if (currentChallenge.id >= 100) {
          handleAwardBadge('boss_slayer');
        }
        if (updatedProfile.completedLevelIds.length >= 3) {
          handleAwardBadge('clean_coder');
        }
      }
    } else {
      setIsLvlWon(false);
    }
  }, [campaignState, currentChallenge, mode, completedChallenges]);

  // Load new level state
  const loadChallenge = (id: number) => {
    setCustomChallenge(null);
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

  const loadCustomChallenge = (chal: any) => {
    setCustomChallenge(chal);
    const freshState = getStartingStateForChallenge(chal);
    setCampaignState(freshState);
    setSelectedCommitHash(null);
    setGraphView('player');
    setMobileTab('terminal');
    setCampaignHistory([
      {
        command: '',
        output: [`--- Initialized Custom Challenge: ${chal.title} ---`, `Goal: ${chal.objective}`],
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
      if (customChallenge) {
        loadCustomChallenge(customChallenge);
      } else {
        loadChallenge(currentChallengeId);
      }
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
      setAssistantError(res.error);
    } else {
      setAssistantError(null);
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
      if (cmdText.trim().startsWith('git reflog') || cmdText.includes('HEAD@{')) {
        handleAwardBadge('time_traveler');
      }
      if (cmdText.trim().startsWith('git rebase -i')) {
        handleAwardBadge('rebase_surgeon');
      }
      if (cmdText.trim().startsWith('git bisect')) {
        handleAwardBadge('bug_hunter');
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

  const handleMergePR = (baseBranch: string, compareBranch: string, strategy: 'merge' | 'squash' | 'rebase', prTitle: string) => {
    const res = executePullRequestMerge(activeGitState, baseBranch, compareBranch, strategy, prTitle);
    const historyItem: CommandHistoryItem = {
      command: `git pr merge --strategy=${strategy} ${compareBranch} -> ${baseBranch}`,
      output: res.output,
      isError: !!res.error,
    };
    if (res.error) {
      setAssistantError(res.error);
    } else {
      soundEngine.playSuccess();
      if (mode === 'sandbox') {
        setSandboxState(res.state);
        setSandboxHistory(prev => [...prev, historyItem]);
      } else {
        setCampaignState(res.state);
        setCampaignHistory(prev => [...prev, historyItem]);
      }
      if (res.newCommitHash) {
        setSelectedCommitHash(res.newCommitHash);
      }
    }
  };

  const handleTriggerCIBreakage = () => {
    setCiStatus('failing');
    soundEngine.playError();
  };

  const handleTriggerCIRepair = () => {
    setCiStatus('passing');
    soundEngine.playSuccess();
  };

  // Switch Mode handler
  const handleModeChange = (newMode: 'campaign' | 'sandbox' | 'visualizer' | 'speedrun' | 'studio' | 'boss') => {
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
      {/* Ambient Floating Glow Mesh Background */}
      <div className="ambient-glow-mesh">
        <div className="glow-orb orb-cyan"></div>
        <div className="glow-orb orb-violet"></div>
        <div className="glow-orb orb-emerald"></div>
      </div>

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
            <button
              className={`mode-btn ${mode === 'speedrun' ? 'active' : ''}`}
              onClick={() => handleModeChange('speedrun')}
            >
              ⚡ Speedrun
            </button>
            <button
              className={`mode-btn ${mode === 'studio' ? 'active' : ''}`}
              onClick={() => handleModeChange('studio')}
            >
              🛠️ Studio
            </button>
            <button
              className={`mode-btn ${mode === 'boss' ? 'active' : ''}`}
              onClick={() => handleModeChange('boss')}
            >
              🐉 Bosses
            </button>
          </div>

          <button
            className="theme-shop-top-btn"
            onClick={() => setShowThemeModal(true)}
            title="Custom Graph Themes & Skins"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: '#F8FAFC', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            🎨 Skins
          </button>
          <button
            className="ai-mentor-top-btn"
            onClick={() => {
              setAssistantError(null);
              setShowAssistantModal(true);
            }}
            title="Natural Language Git Assistant"
            style={{ backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid #3B82F6', borderRadius: '8px', padding: '6px 12px', color: '#60A5FA', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            🤖 AI Mentor
          </button>
          <button
            className="stash-top-btn"
            onClick={() => setShowStashModal(true)}
            title="Stash Stack Manager"
            style={{ backgroundColor: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', borderRadius: '8px', padding: '6px 12px', color: '#7DD3FC', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            📦 Stash ({activeGitState.stash?.length || 0})
          </button>
          <button
            className="bisect-top-btn"
            onClick={() => {
              if (!activeGitState.bisect?.active) {
                handleExecuteCommand('git bisect start');
              }
              setShowBisectModal(true);
            }}
            title="Git Bisect Bug Hunt"
            style={{ backgroundColor: activeGitState.bisect?.active ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.15)', border: '1px solid #F59E0B', borderRadius: '8px', padding: '6px 12px', color: '#FCD34D', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px', boxShadow: activeGitState.bisect?.active ? '0 0 10px rgba(245,158,11,0.5)' : 'none' }}
          >
            🐛 {activeGitState.bisect?.active ? 'Bisect Active' : 'Bisect'}
          </button>
          <button
            className="reflog-top-btn"
            onClick={() => setShowReflogModal(true)}
            title="Reflog Time Machine"
            style={{ backgroundColor: 'rgba(6,182,212,0.15)', border: '1px solid #06B6D4', borderRadius: '8px', padding: '6px 12px', color: '#22D3EE', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            ⏳ Time Machine
          </button>
          <button
            className="diff-top-btn"
            onClick={() => {
              setDiffInitialHashA(undefined);
              setShowDiffModal(true);
            }}
            title="Visual Diff Viewer"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '6px 12px', color: '#34D399', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            🔍 Diff
          </button>
          <button
            className="blame-top-btn"
            onClick={() => setShowBlameModal(true)}
            title="Git Blame Inspector"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid #8B5CF6', borderRadius: '8px', padding: '6px 12px', color: '#A78BFA', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            📜 Blame
          </button>
          <button
            className="pr-top-btn"
            onClick={() => setShowPRModal(true)}
            title="Pull Request Studio & Code Review Hub"
            style={{ backgroundColor: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', borderRadius: '8px', padding: '6px 12px', color: '#38BDF8', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            🔄 Pull Requests
          </button>
          <button
            className={`ci-status-pill ${ciStatus}`}
            onClick={() => setShowCIModal(true)}
            title="Continuous Integration Pipeline Status"
            style={{
              backgroundColor: ciStatus === 'failing' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)',
              border: `1px solid ${ciStatus === 'failing' ? '#EF4444' : '#10B981'}`,
              borderRadius: '20px',
              padding: '6px 14px',
              color: ciStatus === 'failing' ? '#FCA5A5' : '#34D399',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: ciStatus === 'failing' ? '0 0 12px rgba(239,68,68,0.5)' : 'none',
              animation: ciStatus === 'failing' ? 'pulseRed 1.5s infinite' : 'none',
            }}
          >
            <span>⚙️</span> CI: {ciStatus === 'failing' ? 'Broken ❌' : 'Passing ✅'}
          </button>
          <button
            className="cheatsheet-top-btn"
            onClick={() => setShowCheatSheetModal(true)}
            title="Git Encyclopedia & Interactive Cheat-Sheet"
            style={{ backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid #F59E0B', borderRadius: '8px', padding: '6px 12px', color: '#FBBF24', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            📖 Cheat-Sheet
          </button>
          <button
            className="teamlab-top-btn"
            onClick={() => setShowTeamLabModal(true)}
            title="Collaborative Team Lab & Remote Sync Simulator"
            style={{ backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '6px 12px', color: '#34D399', cursor: 'pointer', fontWeight: 600, fontSize: '13px', marginLeft: '6px' }}
          >
            🌐 Team Lab
          </button>
          <button
            className="sound-top-btn"
            onClick={(e) => {
              if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
                setShowSoundModal(true);
              } else {
                soundEngine.toggleMute();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowSoundModal(true);
            }}
            title="Click to toggle Mute/Unmute. Right-click or Ctrl+Click to open Sound & Synth Studio!"
            style={{
              backgroundColor: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.15)',
              border: `1px solid ${isMuted ? '#EF4444' : '#38BDF8'}`,
              borderRadius: '20px',
              padding: '6px 12px',
              color: isMuted ? '#F87171' : '#38BDF8',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              marginLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span> {isMuted ? 'Muted' : 'Sound'}
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowSoundModal(true);
              }}
              style={{ marginLeft: '4px', opacity: 0.8, fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', cursor: 'pointer' }}
              title="Open Sound Settings Studio"
            >
              ⚙️
            </span>
          </button>

          {mode !== 'visualizer' && mode !== 'speedrun' && (
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
        ) : mode === 'speedrun' ? (
          <div className="full-width-visualizer" style={{ width: '100%', overflowY: 'auto' }}>
            <SpeedrunArena />
          </div>
        ) : mode === 'studio' ? (
          <div className="full-width-visualizer" style={{ width: '100%', overflowY: 'auto' }}>
            <LevelStudio
              onPlayTest={(chal) => {
                loadCustomChallenge(chal);
                setMode('campaign');
              }}
              onAwardBadge={handleAwardBadge}
            />
          </div>
        ) : mode === 'boss' ? (
          <div className="full-width-visualizer" style={{ width: '100%', overflowY: 'auto' }}>
            <BossBattles
              onStartBattle={(chal) => {
                loadCustomChallenge(chal);
                setMode('campaign');
              }}
              onAwardBadge={handleAwardBadge}
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
              <GitDashboardBar gitState={activeGitState} />

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
                  🔍 Inspector ({selectedCommit ? '1' : '0'})
                </button>
              </div>

              {/* 1. Top Panel: Inspector when node selected, Objectives otherwise */}
              <div className={`responsive-panel-section ${mobileTab !== 'instructions' && mobileTab !== 'inspector' ? 'mobile-hidden' : ''}`}>
                {selectedCommit ? (
                  <div className="top-inspector-card" style={{ marginBottom: '14px' }}>
                    <NodeInspector
                      commit={selectedCommit}
                      onClose={() => setSelectedCommitHash(null)}
                      onCompareWithHead={(hash) => {
                        setDiffInitialHashA(hash);
                        setShowDiffModal(true);
                      }}
                      onViewBlame={(hash) => {
                        handleExecuteCommand(`git checkout ${hash}`);
                        setShowBlameModal(true);
                      }}
                    />
                  </div>
                ) : mode === 'campaign' ? (
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
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button
                        className="open-3d-guide-btn"
                        style={{ flex: 1, margin: 0, backgroundColor: '#3B82F6' }}
                        onClick={() => {
                          const cmds = sandboxHistory.map(h => h.command).filter(Boolean);
                          const url = encodeSandboxUrl(cmds);
                          navigator.clipboard.writeText(url);
                          soundEngine.playSuccess();
                          alert('🔗 Sandbox URL copied to clipboard!');
                        }}
                      >
                        🔗 Share URL
                      </button>
                      <button
                        className="open-3d-guide-btn"
                        style={{ flex: 1, margin: 0, backgroundColor: '#10B981', color: '#030712' }}
                        onClick={() => {
                          const cmds = sandboxHistory.map(h => h.command).filter(Boolean);
                          exportSandboxJson(cmds);
                          soundEngine.playSuccess();
                        }}
                      >
                        📥 Export JSON
                      </button>
                    </div>
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
                  onOpenHint={() => setShowAssistantModal(true)}
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

      {/* Theme Shop Modal */}
      {showThemeModal && (
        <ThemeShopModal
          activeProfile={activeProfile}
          onThemeChange={(p) => setActiveProfile(p)}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Interactive Merge Conflict Resolver */}
      {activeGitState.activeConflict && (
        <ConflictResolverModal
          conflict={activeGitState.activeConflict}
          onResolve={(resolvedContent) => {
            const res = resolveMergeConflict(activeGitState, resolvedContent);
            if (mode === 'sandbox') {
              setSandboxState(res.state);
              setSandboxHistory(prev => [...prev, { command: 'git merge --resolve', output: res.output }]);
            } else {
              setCampaignState(res.state);
              setCampaignHistory(prev => [...prev, { command: 'git merge --resolve', output: res.output }]);
            }
          }}
          onCancel={() => {
            const clearedState = { ...activeGitState };
            delete clearedState.activeConflict;
            if (mode === 'sandbox') setSandboxState(clearedState);
            else setCampaignState(clearedState);
          }}
        />
      )}

      {/* Natural Language Git Assistant & Mentor */}
      {showAssistantModal && (
        <GitAssistantModal
          lastError={assistantError}
          onExecuteCommand={(cmd) => handleExecuteCommand(cmd)}
          onClose={() => setShowAssistantModal(false)}
        />
      )}

      {/* Interactive Rebase Studio */}
      {activeGitState.activeRebase && (
        <InteractiveRebaseModal
          rebaseState={activeGitState.activeRebase}
          onExecute={(rebaseState) => {
            const res = executeInteractiveRebase(activeGitState, rebaseState);
            if (mode === 'sandbox') {
              setSandboxState(res.state);
              setSandboxHistory(prev => [...prev, { command: 'git rebase -i --continue', output: res.output }]);
            } else {
              setCampaignState(res.state);
              setCampaignHistory(prev => [...prev, { command: 'git rebase -i --continue', output: res.output }]);
            }
          }}
          onCancel={() => {
            const clearedState = { ...activeGitState };
            delete clearedState.activeRebase;
            if (mode === 'sandbox') setSandboxState(clearedState);
            else setCampaignState(clearedState);
          }}
        />
      )}

      {/* Git Bisect Modal */}
      {(showBisectModal || activeGitState.bisect?.active) && activeGitState.bisect && (
        <GitBisectModal
          bisect={activeGitState.bisect}
          onCommand={(cmd) => {
            handleExecuteCommand(cmd);
            if (cmd === 'git bisect reset') setShowBisectModal(false);
          }}
          onClose={() => setShowBisectModal(false)}
        />
      )}

      {/* Stash Stack Modal */}
      {showStashModal && (
        <StashStackModal
          stashList={activeGitState.stash || []}
          stashEntries={activeGitState.stashEntries || []}
          onAction={(action, index, branchName) => {
            let cmd = `git stash ${action} stash@{${index}}`;
            if (action === 'branch' && branchName) {
              cmd = `git stash branch ${branchName} stash@{${index}}`;
            }
            handleExecuteCommand(cmd);
          }}
          onClose={() => setShowStashModal(false)}
        />
      )}

      {/* Reflog Time Machine Modal */}
      {showReflogModal && (
        <ReflogModal
          reflogEntries={activeGitState.reflogEntries || []}
          onRestore={(idx) => {
            handleExecuteCommand(`git reset --hard HEAD@{${idx}}`);
            setShowReflogModal(false);
          }}
          onClose={() => setShowReflogModal(false)}
        />
      )}

      {/* Visual Diff Modal */}
      {showDiffModal && (
        <DiffModal
          commits={activeGitState.commits}
          initialHashA={diffInitialHashA}
          headCommitHash={activeGitState.headCommitHash}
          onClose={() => setShowDiffModal(false)}
        />
      )}

      {/* Git Blame Inspector Modal */}
      {showBlameModal && (
        <BlameModal
          commits={activeGitState.commits}
          headCommitHash={activeGitState.headCommitHash}
          onSelectCommit={(hash) => {
            setSelectedCommitHash(hash);
          }}
          onClose={() => setShowBlameModal(false)}
        />
      )}

      {/* Pull Request Studio Modal */}
      {showPRModal && (
        <PullRequestModal
          state={activeGitState}
          onMergePR={handleMergePR}
          onAwardBadge={handleAwardBadge}
          onClose={() => setShowPRModal(false)}
        />
      )}

      {/* CI/CD Pipeline Modal */}
      {showCIModal && (
        <CIPipelineModal
          ciStatus={ciStatus}
          onTriggerBreakage={handleTriggerCIBreakage}
          onTriggerRepair={handleTriggerCIRepair}
          onAwardBadge={handleAwardBadge}
          onClose={() => setShowCIModal(false)}
        />
      )}

      {/* Sound & Synth Studio Modal */}
      {showSoundModal && (
        <SoundSettingsModal
          onAwardBadge={handleAwardBadge}
          onClose={() => setShowSoundModal(false)}
        />
      )}

      {/* Git Encyclopedia & Cheat-Sheet Modal */}
      {showCheatSheetModal && (
        <CheatSheetModal
          onSelectCommand={(cmd) => {
            handleModeChange('sandbox');
            handleExecuteCommand(cmd);
          }}
          onAwardBadge={handleAwardBadge}
          onClose={() => setShowCheatSheetModal(false)}
        />
      )}

      {/* Collaborative Team Lab Modal */}
      {showTeamLabModal && (
        <TeamLabModal
          onAwardBadge={handleAwardBadge}
          onClose={() => setShowTeamLabModal(false)}
        />
      )}

      {/* Achievement Badge Notification Toast */}
      <BadgeToast badge={activeToastBadge} onClose={() => setActiveToastBadge(null)} />
    </div>
  );
}

export default App;
