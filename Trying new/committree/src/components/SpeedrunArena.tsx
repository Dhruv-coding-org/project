import React, { useState, useEffect } from 'react';
import { type GitState, INITIAL_STATE, runGitCommand } from '../git/gitEngine';
import { soundEngine } from '../utils/soundEngine';

interface SpeedrunMission {
  id: string;
  title: string;
  difficulty: 'Easy 🟢' | 'Medium 🟡' | 'Hard 🔴';
  parSeconds: number;
  description: string;
  targetCommands: string[];
  checkWin: (state: GitState) => boolean;
}

const MISSIONS: SpeedrunMission[] = [
  {
    id: 'sprint-merge',
    title: 'Sprint to Feature Merge',
    difficulty: 'Easy 🟢',
    parSeconds: 45,
    description: 'Create a snapshot on main, create branch "feat", make a commit on "feat", switch back to "main", and merge "feat"!',
    targetCommands: [
      'git commit -m "update"',
      'git branch feat',
      'git checkout feat',
      'git commit -m "feature"',
      'git checkout main',
      'git merge feat',
    ],
    checkWin: (state) => {
      const hasFeat = !!state.branches['feat'];
      const mainBranch = state.branches['main'];
      const headCommit = state.commits[state.headCommitHash];
      return hasFeat && mainBranch?.targetHash === state.headCommitHash && (headCommit?.isMerge || state.commitCounter >= 3);
    },
  },
  {
    id: 'hotfix-rebase',
    title: 'The Hotfix Rebase Rush',
    difficulty: 'Medium 🟡',
    parSeconds: 50,
    description: 'Create branch "hotfix", make 1 commit on hotfix, switch to "main" and make 1 commit, switch back to "hotfix" and rebase onto "main"!',
    targetCommands: [
      'git branch hotfix',
      'git checkout hotfix',
      'git commit -m "fix"',
      'git checkout main',
      'git commit -m "main work"',
      'git checkout hotfix',
      'git rebase main',
    ],
    checkWin: (state) => {
      const hotfix = state.branches['hotfix'];
      const main = state.branches['main'];
      if (!hotfix || !main) return false;
      const hCommit = state.commits[hotfix.targetHash];
      return hCommit && (hCommit.isRebasedCopy || hotfix.targetHash.includes("'") || state.commitCounter >= 4);
    },
  },
  {
    id: 'detached-escape',
    title: 'Detached HEAD Rescue Operation',
    difficulty: 'Hard 🔴',
    parSeconds: 40,
    description: 'Checkout root commit C0, make an experimental commit in detached HEAD, rescue it by creating branch "rescue", switch to main, and merge "rescue"!',
    targetCommands: [
      'git checkout C0',
      'git commit -m "experiment"',
      'git branch rescue',
      'git checkout main',
      'git merge rescue',
    ],
    checkWin: (state) => {
      return !!state.branches['rescue'] && state.activeBranch === 'main' && state.commitCounter >= 2;
    },
  },
];

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'What happens when you create a commit in "Detached HEAD" state without creating a branch pointer?',
    options: [
      'The commit is permanently locked and cannot be deleted by anyone.',
      'The commit is created, but if you switch branches later, it becomes orphaned and can be garbage collected.',
      'Git throws a fatal error and refuses to create the commit.',
      'The commit automatically attaches itself to the master branch.',
    ],
    correctIdx: 1,
    explanation: 'In detached HEAD, new commits have no branch label pointing to them. If you check out another branch without creating a tag or branch, you lose easy access to that hash!',
  },
  {
    id: 2,
    question: 'What is the critical difference between "git reset" and "git revert"?',
    options: [
      'Reset deletes the repository; revert only deletes untracked files.',
      'Revert rewinds branch pointers backward in time; reset creates new commits.',
      'Reset rewinds branch pointers backward in time (rewriting history); revert generates a brand new safe commit that undoes changes without erasing shared history.',
      'There is no difference; they are exact aliases for the same operation.',
    ],
    correctIdx: 2,
    explanation: 'For public shared branches, always use git revert! git reset rewrites history, which causes major divergence conflicts for teammates.',
  },
  {
    id: 3,
    question: 'Why is "git reflog" considered the ultimate lifesaver command?',
    options: [
      'It backs up your files to AWS cloud storage automatically every hour.',
      'It records a chronological log of every single time the HEAD pointer moved, allowing you to recover lost or hard-reset commits.',
      'It encrypts your commit timestamps with SHA-256 security.',
      'It cleans out untracked temporary node_modules folders instantly.',
    ],
    correctIdx: 1,
    explanation: 'Even after a disastrous git reset --hard or deleted branch, the commit hashes still exist in your local reflog for up to 30 days!',
  },
  {
    id: 4,
    question: 'Which command temporarily shelves dirty working tree modifications without creating a permanent commit?',
    options: [
      'git stash',
      'git archive',
      'git shelve --tmp',
      'git store --hidden',
    ],
    correctIdx: 0,
    explanation: 'git stash pushes your modified and staged files onto a temporary local stack so you can switch branches cleanly, and git stash pop brings them back!',
  },
];

export const SpeedrunArena: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'speedrun' | 'quiz'>('speedrun');

  // Speedrun state
  const [selectedMission, setSelectedMission] = useState<SpeedrunMission>(MISSIONS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runState, setRunState] = useState<GitState>({ ...INITIAL_STATE });
  const [cmdInput, setCmdInput] = useState('');
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [medalWon, setMedalWon] = useState<'🥇 GOLD' | '🥈 SILVER' | '🥉 BRONZE' | null>(null);

  // Quiz state
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedMs((prev) => prev + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startMission = (mission: SpeedrunMission) => {
    soundEngine.playClick();
    setSelectedMission(mission);
    setRunState({ ...INITIAL_STATE });
    setElapsedMs(0);
    setRunLogs([`--- Mission Started: ${mission.title} ---`, `Par Time: ${mission.parSeconds}s — GO!`]);
    setMedalWon(null);
    setIsRunning(true);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRunning || !cmdInput.trim()) return;

    soundEngine.playClick();
    const res = runGitCommand(runState, cmdInput);
    setRunState(res.state);
    setRunLogs((prev) => [...prev, `> ${cmdInput}`, ...res.output]);
    setCmdInput('');

    // Check win condition
    if (selectedMission.checkWin(res.state)) {
      setIsRunning(false);
      soundEngine.playSuccess();
      const seconds = elapsedMs / 1000;
      let medal: '🥇 GOLD' | '🥈 SILVER' | '🥉 BRONZE' = '🥉 BRONZE';
      if (seconds <= selectedMission.parSeconds) medal = '🥇 GOLD';
      else if (seconds <= selectedMission.parSeconds + 15) medal = '🥈 SILVER';
      
      setMedalWon(medal);
      setRunLogs((prev) => [...prev, `🏁 MISSION COMPLETE in ${seconds.toFixed(1)}s! Medal Awarded: ${medal}`]);
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const q = QUIZ_QUESTIONS[currentQuizIdx];
    if (idx === q.correctIdx) {
      soundEngine.playSuccess();
      setQuizScore((prev) => prev + 100);
    } else {
      soundEngine.playError();
    }
  };

  const nextQuestion = () => {
    soundEngine.playClick();
    setSelectedOpt(null);
    setIsAnswered(false);
    if (currentQuizIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIdx((prev) => prev + 1);
    } else {
      setCurrentQuizIdx(0); // Loop or reset
    }
  };

  return (
    <div className="speedrun-arena-container">
      {/* Top Banner */}
      <div className="arena-hero">
        <div className="hero-text-wrap">
          <h2 className="hero-title">⚡ Git Speedrun Arena & Quiz Bowl</h2>
          <p className="hero-subtitle">
            Test your terminal dexterity against the clock in Timed Speedrun Missions, or test your architectural mastery in the multiple-choice Git Quiz Bowl!
          </p>
        </div>
        <div className="arena-tabs">
          <button
            className={`arena-tab-btn ${activeTab === 'speedrun' ? 'active' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('speedrun'); }}
          >
            ⏱️ Timed Speedruns
          </button>
          <button
            className={`arena-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => { soundEngine.playClick(); setActiveTab('quiz'); }}
          >
            🧠 Git Quiz Bowl
          </button>
        </div>
      </div>

      {activeTab === 'speedrun' ? (
        <div className="speedrun-content">
          {/* Mission Selector Card Grid */}
          <div className="missions-sidebar">
            <h4 className="sidebar-title">Select Speedrun Mission:</h4>
            <div className="missions-list">
              {MISSIONS.map((m) => (
                <div
                  key={m.id}
                  className={`mission-item-card ${selectedMission.id === m.id ? 'active' : ''}`}
                  onClick={() => startMission(m)}
                >
                  <div className="mission-item-hdr">
                    <span className="mission-title">{m.title}</span>
                    <span className="mission-diff">{m.difficulty}</span>
                  </div>
                  <div className="mission-meta">
                    <span>Par Time: <strong>{m.parSeconds}s</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Mission Play Area */}
          <div className="mission-play-area">
            <div className="play-area-header">
              <div>
                <h3>{selectedMission.title}</h3>
                <p className="mission-desc">{selectedMission.description}</p>
              </div>
              <div className="stopwatch-display">
                <span className="stopwatch-icon">⏱️</span>
                <span className="time-val">{(elapsedMs / 1000).toFixed(1)}s</span>
                {medalWon && <span className="medal-pill">{medalWon}</span>}
              </div>
            </div>

            {/* Suggested Command Clues */}
            <div className="command-clues-box">
              <span>💡 Target Sequence Clue:</span>
              <div className="clue-tags">
                {selectedMission.targetCommands.map((cmd, i) => (
                  <code key={i} className="clue-tag" onClick={() => setCmdInput(cmd)}>{cmd}</code>
                ))}
              </div>
            </div>

            {/* Mini Terminal Output & Input */}
            <div className="arena-terminal">
              <div className="arena-term-output">
                {runLogs.map((log, idx) => (
                  <div key={idx} className="term-log-line">{log}</div>
                ))}
              </div>
              <form onSubmit={handleRunCommand} className="arena-term-form">
                <span className="term-prompt">&gt;</span>
                <input
                  type="text"
                  className="arena-term-input"
                  placeholder={isRunning ? "Type git command here..." : "Click a mission above to start stopwatch!"}
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  disabled={!isRunning}
                  autoFocus
                />
                <button type="submit" className="arena-submit-btn" disabled={!isRunning}>Execute</button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Quiz Bowl Content */
        <div className="quiz-content">
          <div className="quiz-score-bar">
            <span>Question {currentQuizIdx + 1} of {QUIZ_QUESTIONS.length}</span>
            <span className="quiz-score-badge">🏆 XP Score: {quizScore}</span>
          </div>

          {(() => {
            const q = QUIZ_QUESTIONS[currentQuizIdx];
            return (
              <div className="quiz-card">
                <h3 className="quiz-question-text">{q.id}. {q.question}</h3>
                <div className="quiz-options-grid">
                  {q.options.map((opt, idx) => {
                    let btnClass = 'quiz-opt-btn';
                    if (isAnswered) {
                      if (idx === q.correctIdx) btnClass += ' correct-opt';
                      else if (idx === selectedOpt) btnClass += ' wrong-opt';
                    }
                    return (
                      <button
                        key={idx}
                        className={btnClass}
                        onClick={() => handleSelectAnswer(idx)}
                        disabled={isAnswered}
                      >
                        <span className="opt-idx">{String.fromCharCode(65 + idx)}</span>
                        <span className="opt-text">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="quiz-explanation-box">
                    <div className="exp-hdr">
                      {selectedOpt === q.correctIdx ? '🎉 Correct!' : '❌ Incorrect!'}
                    </div>
                    <p>{q.explanation}</p>
                    <button className="btn-primary next-q-btn" onClick={nextQuestion}>
                      Next Question ➔
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
