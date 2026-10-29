import React, { useState } from 'react';
import type { MergeConflict } from '../git/gitEngine';
import { soundEngine } from '../utils/soundEngine';

interface ConflictResolverModalProps {
  conflict: MergeConflict;
  onResolve: (resolvedContent: string) => void;
  onCancel: () => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  conflict,
  onResolve,
  onCancel,
}) => {
  const initialText = `<<<<<<< HEAD (${conflict.branchA})\n${conflict.contentA}\n=======\n${conflict.contentB}\n>>>>>>> ${conflict.branchB}`;
  const [editorText, setEditorText] = useState(initialText);
  const [warning, setWarning] = useState<string | null>(null);

  const handleAcceptCurrent = () => {
    soundEngine.playClick();
    setEditorText(conflict.contentA);
    setWarning(null);
  };

  const handleAcceptIncoming = () => {
    soundEngine.playClick();
    setEditorText(conflict.contentB);
    setWarning(null);
  };

  const handleAcceptBoth = () => {
    soundEngine.playClick();
    setEditorText(`${conflict.contentA}\n${conflict.contentB}`);
    setWarning(null);
  };

  const handleSubmitResolve = () => {
    if (editorText.includes('<<<<<<<') || editorText.includes('>>>>>>>') || editorText.includes('=======')) {
      soundEngine.playError();
      setWarning('Please remove all conflict markers (<<<<<<<, =======, >>>>>>>) before completing the merge!');
      return;
    }
    soundEngine.playSuccess();
    onResolve(editorText);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content conflict-resolver-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⚔️</span>
            <div>
              <h3>Interactive Merge Conflict Resolver</h3>
              <p className="conflict-subtitle">File: <code>{conflict.file}</code> — Divergence between <strong>{conflict.branchA}</strong> and <strong>{conflict.branchB}</strong></p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="conflict-instructions">
          <span className="instruction-badge">⚠️ MERGE PAUSED</span>
          <p>
            Git cannot automatically merge these changes because both branches modified the exact same lines in <code>{conflict.file}</code>. Use the quick action buttons below or edit the code manually to choose what the final file should look like!
          </p>
        </div>

        {/* Quick Resolution Action Bar */}
        <div className="conflict-actions-bar">
          <button className="resolve-action-btn current-btn" onClick={handleAcceptCurrent}>
            ✓ Accept Current Change ({conflict.branchA})
          </button>
          <button className="resolve-action-btn incoming-btn" onClick={handleAcceptIncoming}>
            ✓ Accept Incoming Change ({conflict.branchB})
          </button>
          <button className="resolve-action-btn both-btn" onClick={handleAcceptBoth}>
            ✓ Accept Both Changes (Combine)
          </button>
        </div>

        {warning && <div className="conflict-warning-box">🛑 {warning}</div>}

        {/* 3-Way Code Editor Box */}
        <div className="conflict-editor-wrap">
          <div className="editor-header">
            <span>📝 3-Way Code Editor ({conflict.file})</span>
            <span className="editor-hint">Edit freely before committing</span>
          </div>
          <textarea
            className="conflict-code-textarea"
            value={editorText}
            onChange={(e) => {
              setEditorText(e.target.value);
              if (warning) setWarning(null);
            }}
            rows={10}
            spellCheck={false}
          />
        </div>

        <div className="modal-footer conflict-footer">
          <button className="btn-secondary" onClick={onCancel}>Abort Merge</button>
          <button className="btn-primary resolve-submit-btn" onClick={handleSubmitResolve}>
            ✨ Complete Merge Commit
          </button>
        </div>
      </div>
    </div>
  );
};
