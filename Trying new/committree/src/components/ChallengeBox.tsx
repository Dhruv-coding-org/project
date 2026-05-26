import React from 'react';
import type { Challenge } from '../git/challenges';

interface ChallengeBoxProps {
  challenges: Challenge[];
  currentChallenge: Challenge;
  completedChallenges: number[];
  onSelectChallenge: (id: number) => void;
  onResetChallenge: () => void;
  isWon: boolean;
  onNextLevel: () => void;
}

export const ChallengeBox: React.FC<ChallengeBoxProps> = ({
  challenges,
  currentChallenge,
  completedChallenges,
  onSelectChallenge,
  onResetChallenge,
  isWon,
  onNextLevel,
}) => {
  const isLastLevel = currentChallenge.id === challenges[challenges.length - 1].id;

  return (
    <div className="challenge-box-container">
      {/* Header & Level Tabs */}
      <div className="challenge-tabs-row">
        {challenges.map((c) => {
          const isCurrent = c.id === currentChallenge.id;
          const isDone = completedChallenges.includes(c.id);
          
          return (
            <button
              key={c.id}
              className={`challenge-tab-btn ${isCurrent ? 'active' : ''} ${
                isDone ? 'completed' : ''
              }`}
              onClick={() => onSelectChallenge(c.id)}
            >
              Lvl {c.id}
              {isDone && <span className="tab-completed-check"> ✓</span>}
            </button>
          );
        })}
      </div>

      {/* Main Level Information */}
      <div className="challenge-body">
        <div className="challenge-meta">
          <h2 className="challenge-title">{currentChallenge.title}</h2>
          <span className={`challenge-status-badge ${isWon ? 'won' : 'pending'}`}>
            {isWon ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>

        <p className="challenge-desc">{currentChallenge.description}</p>

        <div className="objective-panel">
          <div className="objective-hdr">OBJECTIVE:</div>
          <p className="objective-text">{currentChallenge.objective}</p>
        </div>

        {/* Hints accordion */}
        <details className="hint-accordion">
          <summary className="hint-summary">💡 Need a hint?</summary>
          <div className="hint-content">
            <p>{currentChallenge.hint}</p>
          </div>
        </details>

        {/* Buttons / Controls */}
        <div className="challenge-controls">
          <button className="reset-lvl-btn" onClick={onResetChallenge}>
            Reset Level
          </button>
          
          {isWon && (
            <button
              className="next-lvl-btn"
              onClick={isLastLevel ? undefined : onNextLevel}
              disabled={isLastLevel}
            >
              {isLastLevel ? 'Campaign Finished! 🎉' : 'Next Level →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
