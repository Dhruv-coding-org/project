import './ShortcutsModal.css';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_LIST = [
  { key: 'Space / K', desc: 'Play / Pause Video (Host)' },
  { key: 'F', desc: 'Toggle Video Fullscreen' },
  { key: 'M', desc: 'Mute / Unmute Video Audio' },
  { key: 'T', desc: 'Toggle Theater / Cinema Mode' },
  { key: 'Alt + C', desc: 'Toggle Chat Panel' },
  { key: 'Alt + U', desc: 'Toggle Watchers & Voice Panel' },
  { key: 'Alt + Q', desc: 'Open Media Queue / Playlist' },
  { key: 'Alt + S', desc: 'Change Video Source' },
  { key: '?', desc: 'Show / Hide Keyboard Shortcuts' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="shortcuts-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="shortcuts-modal glass animate-scale-spring"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="shortcuts-header">
          <div className="shortcuts-header-title">
            <span className="shortcuts-icon">⌨️</span>
            <div>
              <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
              <p>Quick controls for seamless navigation</p>
            </div>
          </div>
          <button className="btn-icon shortcuts-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="shortcuts-grid">
          {SHORTCUTS_LIST.map((item) => (
            <div key={item.key} className="shortcut-row">
              <span className="shortcut-desc">{item.desc}</span>
              <kbd className="shortcut-key">{item.key}</kbd>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd className="shortcut-key inline">Esc</kbd> or click anywhere outside to close</p>
          <button className="btn btn-ghost" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
