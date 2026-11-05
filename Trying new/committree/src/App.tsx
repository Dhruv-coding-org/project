import { useState, useEffect } from 'react';
import { type GitState, INITIAL_STATE, runGitCommand, executeInteractiveRebase, executePullRequestMerge } from './git/gitEngine';
import { CHALLENGES, getStartingStateForChallenge, getTargetStateForChallenge, type Challenge } from './git/challenges';
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
        <span className="dash-label">
          <svg className="dash-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
          BRANCH
        </span>
        <span className={`dash-val ${isDetached ? 'val-detached' : 'val-branch'}`}>
          {isDetached ? 'DETACHED' : gitState.activeBranch}
        </span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">
          <svg className="dash-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line></svg>
          HEAD
        </span>
        <span className="dash-val val-hash">{gitState.headCommitHash}</span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">
          <svg className="dash-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
          STASH
        </span>
        <span className="dash-val val-stash">{stashSize}</span>
      </div>
      <div className="dash-stat-item">
        <span className="dash-label">
          <svg className="dash-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          TAGS
        </span>
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
  const [customChallenge, setCustomChallenge] = useState<Challenge | null>(null);

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

  const loadCustomChallenge = (chal: Challenge) => {
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
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><path d="M6 9v6"></path><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
          </span>
          <h1 className="brand-name">CommitTree</h1>
          <span className="brand-subtitle font-sm-hidden">Git Laboratory &amp; State Simulator</span>
        </div>

        <div className="header-controls">
          {/* Profile Switcher Button */}
          <button
            className="profile-top-btn"
            onClick={() => setShowProfileModal(true)}
            title="Switch Player Profile or View Achievements"
          >
            <span className="profile-name-text">{activeProfile.name}</span>
            <span className="profile-rank-pill">{activeProfile.title}</span>
          </button>

          {/* Mode Switcher */}
          <div className="mode-toggle" role="tablist" aria-label="Workbench Mode Selector">
            <button
              className={`mode-btn ${mode === 'campaign' ? 'active' : ''}`}
              onClick={() => handleModeChange('campaign')}
              title="Step-by-step Git curriculum"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"></path><path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path></svg>
              <span>Campaign</span>
            </button>
            <button
              className={`mode-btn ${mode === 'sandbox' ? 'active' : ''}`}
              onClick={() => handleModeChange('sandbox')}
              title="Unrestricted free play sandbox"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span>Sandbox</span>
            </button>
            <button
              className={`mode-btn ${mode === 'visualizer' ? 'active' : ''}`}
              onClick={() => handleModeChange('visualizer')}
              title="3D Command Guide"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.12 6.4-9-5a2 2 0 0 0-2 0l-9 5A2 2 0 0 0 1.12 8.16v7.68a2 2 0 0 0 1.12 1.76l9 5a2 2 0 0 0 2 0l9-5A2 2 0 0 0 22 15.84V8.16a2 2 0 0 0-.88-1.76z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              <span>Command 3D</span>
            </button>
            <button
              className={`mode-btn ${mode === 'speedrun' ? 'active' : ''}`}
              onClick={() => handleModeChange('speedrun')}
              title="Time-trial challenges"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Speedrun</span>
            </button>
            <button
              className={`mode-btn ${mode === 'studio' ? 'active' : ''}`}
              onClick={() => handleModeChange('studio')}
              title="Level creation studio"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="21" y2="21"></line><line x1="4" x2="20" y1="14" y2="14"></line><line x1="4" x2="20" y1="7" y2="7"></line><circle cx="14" cy="21" r="2"></circle><circle cx="8" cy="14" r="2"></circle><circle cx="16" cy="7" r="2"></circle></svg>
              <span>Studio</span>
            </button>
            <button
              className={`mode-btn ${mode === 'boss' ? 'active' : ''}`}
              onClick={() => handleModeChange('boss')}
              title="Complex multi-branch crisis scenarios"
            >
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Bosses</span>
            </button>
          </div>

          <button
            className="top-dock-btn"
            onClick={() => setShowThemeModal(true)}
            title="Custom Graph Color Themes"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
            <span>Themes</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => {
              setAssistantError(null);
              setShowAssistantModal(true);
            }}
            title="Natural Language Git Assistant"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span>Git Mentor</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowStashModal(true)}
            title="Stash Stack Manager"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            <span>Stash ({activeGitState.stash?.length || 0})</span>
          </button>
          <button
            className={`top-dock-btn ${activeGitState.bisect?.active ? 'active-accent' : ''}`}
            onClick={() => {
              if (!activeGitState.bisect?.active) {
                handleExecuteCommand('git bisect start');
              }
              setShowBisectModal(true);
            }}
            title="Git Bisect Bug Hunt"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path><path d="m10 4 1 2"></path><path d="m14 4-1 2"></path></svg>
            <span>{activeGitState.bisect?.active ? 'Bisect Active' : 'Bisect'}</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowReflogModal(true)}
            title="Reflog Time Machine"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline><path d="M3.05 11a9 9 0 0 1 1.5-3.5L2 6"></path></svg>
            <span>Reflog</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => {
              setDiffInitialHashA(undefined);
              setShowDiffModal(true);
            }}
            title="Visual Diff Viewer"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <span>Diff</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowBlameModal(true)}
            title="Git Blame Inspector"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            <span>Blame</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowPRModal(true)}
            title="Pull Request Studio &amp; Code Review Hub"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
            <span>Pull Requests</span>
          </button>
          <button
            className={`top-dock-btn ci-status-pill ${ciStatus}`}
            onClick={() => setShowCIModal(true)}
            title="Continuous Integration Pipeline Status"
          >
            <span className={`status-indicator-dot ${ciStatus === 'failing' ? 'dot-failing' : 'dot-passing'}`}></span>
            <span>CI: {ciStatus === 'failing' ? 'Failed' : 'Passing'}</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowCheatSheetModal(true)}
            title="Git Command Reference"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>
            <span>Cheat Sheet</span>
          </button>
          <button
            className="top-dock-btn"
            onClick={() => setShowTeamLabModal(true)}
            title="Collaborative Team Lab &amp; Remote Sync Simulator"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Team Lab</span>
          </button>
          <button
            className="top-dock-btn"
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
            title="Toggle Audio Feedback"
          >
            <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>{!isMuted && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>}</svg>
            <span>{isMuted ? 'Muted' : 'Audio'}</span>
          </button>

          {mode !== 'visualizer' && mode !== 'speedrun' && (
            <button className="top-dock-btn reset-btn" onClick={handleReset} title="Reset Repository State">
              <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
              <span>Reset</span>
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
                    <svg className="dock-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="3" x2="12" y2="9"></line><line x1="12" y1="15" x2="12" y2="21"></line></svg>
                    <span>Working Tree</span>
                  </button>
                  <button
                    className={`graph-tab-btn ${graphView === 'goal' ? 'active' : ''}`}
                    onClick={() => setGraphView('goal')}
                  >
                    <svg className="dock-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                    <span>Target Goal</span>
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
                  <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                  <span>Objectives</span>
                </button>
                <button
                  className={`mobile-nav-btn ${mobileTab === 'terminal' ? 'active' : ''}`}
                  onClick={() => setMobileTab('terminal')}
                >
                  <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                  <span>Terminal</span>
                </button>
                <button
                  className={`mobile-nav-btn ${mobileTab === 'inspector' ? 'active' : ''}`}
                  onClick={() => setMobileTab('inspector')}
                >
                  <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <span>Inspector ({selectedCommit ? '1' : '0'})</span>
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
                      <svg className="dock-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.12 6.4-9-5a2 2 0 0 0-2 0l-9 5A2 2 0 0 0 1.12 8.16v7.68a2 2 0 0 0 1.12 1.76l9 5a2 2 0 0 0 2 0l9-5A2 2 0 0 0 22 15.84V8.16a2 2 0 0 0-.88-1.76z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      <span>Command 3D Guide</span>
                    </button>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button
                        className="open-3d-guide-btn"
                        style={{ flex: 1, margin: 0, backgroundColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                        onClick={() => {
                          const cmds = sandboxHistory.map(h => h.command).filter(Boolean);
                          const url = encodeSandboxUrl(cmds);
                          navigator.clipboard.writeText(url);
                          soundEngine.playSuccess();
                          alert('Sandbox URL copied to clipboard.');
                        }}
                      >
                        <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        <span>Share Sandbox</span>
                      </button>
                      <button
                        className="open-3d-guide-btn"
                        style={{ flex: 1, margin: 0, backgroundColor: 'var(--accent-terracotta)', color: '#FFFFFF' }}
                        onClick={() => {
                          const cmds = sandboxHistory.map(h => h.command).filter(Boolean);
                          exportSandboxJson(cmds);
                          soundEngine.playSuccess();
                        }}
                      >
                        <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        <span>Export JSON</span>
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
            <div className="celebration-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34"></path><path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path></svg>
            </div>
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
