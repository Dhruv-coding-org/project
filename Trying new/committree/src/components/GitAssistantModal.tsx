import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface GitAssistantModalProps {
  onExecuteCommand: (cmd: string) => void;
  onClose: () => void;
  lastError?: string | null;
}

interface AssistantPrescription {
  title: string;
  symptoms: string[];
  diagnosis: string;
  recommendedCommand: string;
  explanation: string;
}

const COMMON_PRESCRIPTIONS: AssistantPrescription[] = [
  {
    title: 'Undo Last Commit (Keep Files)',
    symptoms: ['undo', 'commit', 'soft', 'keep', 'mistake', 'wrong commit'],
    diagnosis: 'You committed too early or forgot to stage a file, but you do not want to lose your code changes.',
    recommendedCommand: 'git reset --soft HEAD~1',
    explanation: 'Moves the HEAD pointer back by 1 commit while keeping all your modified code inside your staging area ready to re-commit.',
  },
  {
    title: 'Undo Last Commit (Destroy Changes)',
    symptoms: ['hard', 'destroy', 'delete commit', 'scrap', 'start over', 'revert changes'],
    diagnosis: 'Your recent work is completely broken and you want to wipe it out permanently and return to the previous clean snapshot.',
    recommendedCommand: 'git reset --hard HEAD~1',
    explanation: 'WARNING: This rewires HEAD back 1 step and overwrites your working directory, discarding uncommitted modifications.',
  },
  {
    title: 'Recover Deleted Branch / Lost Hash',
    symptoms: ['lost', 'deleted branch', 'reflog', 'recover', 'accidental reset', 'missing commit'],
    diagnosis: 'You ran a hard reset or deleted a feature branch that had important unmerged commits.',
    recommendedCommand: 'git reflog',
    explanation: 'Opens up the chronological record of every pointer movement. Look for the hash before your mistake and run "git checkout <hash>" or "git branch <name> <hash>".',
  },
  {
    title: 'Shelve Dirty Working Directory',
    symptoms: ['stash', 'save temp', 'switch branch error', 'dirty', 'shelve', 'uncommitted'],
    diagnosis: 'You need to switch to another branch (e.g. to fix an urgent bug), but Git complains about your uncommitted modifications.',
    recommendedCommand: 'git stash',
    explanation: 'Safely pushes your working directory changes onto a temporary local stack. When you return later, restore them with "git stash pop".',
  },
  {
    title: 'Sync with Remote / Pull Changes',
    symptoms: ['remote', 'origin', 'pull', 'fetch', 'collaborate', 'download'],
    diagnosis: 'Your local branch is behind your team remote repository.',
    recommendedCommand: 'git pull origin main',
    explanation: 'Fetches the latest commits from the remote server and automatically merges or rebases them into your active local branch.',
  },
];

export const GitAssistantModal: React.FC<GitAssistantModalProps> = ({
  onExecuteCommand,
  onClose,
  lastError,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<AssistantPrescription | null>(
    lastError ? {
      title: '🚨 Automated Crash Diagnosis',
      symptoms: [],
      diagnosis: `Your previous terminal command produced an error: "${lastError}". This usually happens when trying to merge without a branch name, checking out a non-existent branch/commit, or operating in detached HEAD.`,
      recommendedCommand: 'git status',
      explanation: 'Run "git status" or check your branch list with "git branch" to orient your current HEAD pointer.',
    } : COMMON_PRESCRIPTIONS[0]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    soundEngine.playClick();

    const qLower = userQuery.toLowerCase();
    const match = COMMON_PRESCRIPTIONS.find((p) =>
      p.title.toLowerCase().includes(qLower) ||
      p.symptoms.some((s) => qLower.includes(s)) ||
      p.diagnosis.toLowerCase().includes(qLower)
    );

    if (match) {
      setSelectedPrescription(match);
    } else {
      setSelectedPrescription({
        title: '🤖 Custom AI Recommendation',
        symptoms: [userQuery],
        diagnosis: `Analyzing your request: "${userQuery}". For most custom history manipulations, checking the commit graph or viewing command syntax is recommended.`,
        recommendedCommand: 'git log --oneline --graph',
        explanation: 'Displays a visual ascii tree of your commit history to help you locate target hashes.',
      });
    }
  };

  const handleApplyCommand = (cmd: string) => {
    soundEngine.playSuccess();
    onExecuteCommand(cmd);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content git-assistant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🤖</span>
            <div>
              <h3>Natural Language Git Assistant & Mentor</h3>
              <p className="assistant-subtitle">Describe your Git problem in plain English or pick a troubleshooting prescription</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {lastError && (
          <div className="error-diagnosis-banner">
            <span>🚨 LAST COMMAND FAILED: <code>{lastError}</code></span>
          </div>
        )}

        {/* NL Search Form */}
        <form onSubmit={handleSearch} className="assistant-search-box">
          <input
            type="text"
            className="assistant-search-input"
            placeholder="e.g. 'How do I undo a commit?' or 'I lost my branch!'"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="assistant-search-btn">🔍 Diagnose</button>
        </form>

        <div className="assistant-main-grid">
          {/* Quick Prescriptions Sidebar */}
          <div className="prescriptions-list">
            <h4 className="list-hdr">💡 Common Prescriptions:</h4>
            {COMMON_PRESCRIPTIONS.map((p, idx) => (
              <div
                key={idx}
                className={`prescription-pill ${selectedPrescription?.title === p.title ? 'active' : ''}`}
                onClick={() => { soundEngine.playClick(); setSelectedPrescription(p); }}
              >
                <span>{p.title}</span>
              </div>
            ))}
          </div>

          {/* Diagnosis & Action Card */}
          {selectedPrescription && (
            <div className="prescription-detail-card">
              <div className="card-hdr">
                <h4>{selectedPrescription.title}</h4>
                <span className="ai-badge">✨ RECOMMENDED SOLUTION</span>
              </div>

              <div className="diag-section">
                <strong>🩺 Diagnosis:</strong>
                <p>{selectedPrescription.diagnosis}</p>
              </div>

              <div className="diag-section">
                <strong>📖 How it works:</strong>
                <p>{selectedPrescription.explanation}</p>
              </div>

              <div className="command-preview-box">
                <span>Suggested Command:</span>
                <code>{selectedPrescription.recommendedCommand}</code>
              </div>

              <button
                className="btn-primary apply-cmd-btn"
                onClick={() => handleApplyCommand(selectedPrescription.recommendedCommand)}
              >
                ⚡ Execute Command in Terminal ➔
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
