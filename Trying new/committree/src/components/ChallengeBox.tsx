import React, { useState, useEffect } from 'react';
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
  const [viewMode, setViewMode] = useState<'objective' | 'tutorial'>('objective');
  const isLastLevel = currentChallenge.id === challenges[challenges.length - 1].id;

  // Whenever challenge changes, default to objective mode (or let user explore tutorial)
  useEffect(() => {
    setViewMode('objective');
  }, [currentChallenge.id]);

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

      {/* Mode Switcher: Objective vs Concept Tutorial */}
      <div className="challenge-sub-tabs">
        <button
          className={`sub-tab-btn ${viewMode === 'objective' ? 'active' : ''}`}
          onClick={() => setViewMode('objective')}
        >
          <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          <span>Objective &amp; Task</span>
        </button>
        <button
          className={`sub-tab-btn tutorial-tab ${viewMode === 'tutorial' ? 'active' : ''}`}
          onClick={() => setViewMode('tutorial')}
        >
          <svg className="dock-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>
          <span>Concept Tutorial</span>
        </button>
      </div>

      {/* Main Level Information */}
      <div className="challenge-body">
        <div className="challenge-meta">
          <h2 className="challenge-title">{currentChallenge.title}</h2>
          <span className={`challenge-status-badge ${isWon ? 'won' : 'pending'}`}>
            {isWon ? 'COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>

        {viewMode === 'objective' ? (
          <div className="objective-view-content">
            <p className="challenge-desc">{currentChallenge.description}</p>

            <div className="objective-panel">
              <div className="objective-hdr">OBJECTIVE:</div>
              <p className="objective-text">{currentChallenge.objective}</p>
            </div>

            {/* Hints accordion */}
            <details className="hint-accordion">
              <summary className="hint-summary">💡 Need a quick hint?</summary>
              <div className="hint-content">
                <p>{currentChallenge.hint}</p>
              </div>
            </details>

            {/* Quick link to tutorial */}
            <div className="tutorial-callout">
              <span>Not sure how this works under the hood?</span>
              <button className="open-tutorial-link" onClick={() => setViewMode('tutorial')}>
                Read Concept Tutorial →
              </button>
            </div>
          </div>
        ) : (
          <div className="tutorial-view-content">
            {currentChallenge.tutorial ? (
              <>
                <h3 className="tutorial-concept-title">
                  ✨ {currentChallenge.tutorial.conceptTitle}
                </h3>

                <div className="tutorial-explanation-paragraphs">
                  {currentChallenge.tutorial.explanation.map((para, idx) => (
                    <p key={idx} className="tutorial-para">
                      {para}
                    </p>
                  ))}
                </div>

                {currentChallenge.tutorial.diagram && (
                  <div className="tutorial-diagram-box">
                    <div className="diagram-hdr">VISUALIZED WORKFLOW:</div>
                    <pre className="diagram-ascii">{currentChallenge.tutorial.diagram}</pre>
                  </div>
                )}

                {currentChallenge.beginnerTips && currentChallenge.beginnerTips.length > 0 && (
                  <div className="beginner-tips-box">
                    <div className="tips-hdr">🚀 Beginner Pro-Tips:</div>
                    <ul className="tips-list">
                      {currentChallenge.beginnerTips.map((tip, idx) => (
                        <li key={idx} className="tip-item">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button className="return-to-obj-btn" onClick={() => setViewMode('objective')}>
                  ← Return to Objective & Try It Out!
                </button>
              </>
            ) : (
              <p className="no-tutorial-msg">No tutorial available for this level yet.</p>
            )}
          </div>
        )}

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
