import React, { useState, useEffect } from 'react';
import { soundEngine, type SoundTheme } from '../utils/soundEngine';

interface SoundSettingsModalProps {
  onAwardBadge: (badgeId: string) => void;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  onAwardBadge,
  onClose,
}) => {
  const [muted, setMuted] = useState<boolean>(soundEngine.getMuted());
  const [activeTheme, setActiveTheme] = useState<SoundTheme>(soundEngine.getTheme());

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(() => {
      setMuted(soundEngine.getMuted());
      setActiveTheme(soundEngine.getTheme());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleMute = () => {
    const newMute = soundEngine.toggleMute();
    setMuted(newMute);
    if (!newMute) {
      soundEngine.playClick();
    }
  };

  const handleSelectTheme = (theme: SoundTheme) => {
    soundEngine.setTheme(theme);
    setActiveTheme(theme);
    if (muted) {
      soundEngine.setMuted(false);
      setMuted(false);
    }
    soundEngine.playCommit();
    onAwardBadge('audio_audiophile');
  };

  const themes: Array<{ id: SoundTheme; title: string; icon: string; desc: string; preview: string }> = [
    {
      id: 'cyberpunk',
      title: 'Cyberpunk Synth',
      icon: '🤖',
      desc: 'Retro-futuristic sine & triangle wave synth chords designed for immersion.',
      preview: 'Smooth synth drops on commit & whooshes on branch changes.',
    },
    {
      id: 'mechanical',
      title: 'Mechanical Keyboard',
      icon: '⌨️',
      desc: 'Tactile clickety-clack terminal sound bursts with typewriter bell returns.',
      preview: 'Crisp tactile clicks when typing commands & G6 chime on commits.',
    },
    {
      id: 'arcade',
      title: '8-Bit Arcade',
      icon: '👾',
      desc: 'Classic chiptune square wave blips and 1-up ascending arpeggio fanfares.',
      preview: 'Nostalgic retro gaming chimes that celebrate your Git level progression.',
    },
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#0F172A',
        border: '1px solid #38BDF8',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)',
        color: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🔊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#38BDF8' }}>
                Sound & Synth Studio
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                Web Audio API synthesizer studio — zero external audio files needed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px 12px',
              fontSize: '14px',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Master Mute Toggle Card */}
        <div style={{
          backgroundColor: muted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${muted ? '#EF4444' : '#10B981'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: muted ? '#F87171' : '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{muted ? '🔇' : '🔊'}</span> Master Audio: {muted ? 'Muted (Silent Mode)' : 'Enabled & Active'}
            </div>
            <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
              {muted ? 'All terminal clicks, branch whooshes, and victory fanfares are silenced.' : 'Synthesized audio is active. Click below to customize your sound theme!'}
            </div>
          </div>
          <button
            onClick={handleToggleMute}
            style={{
              backgroundColor: muted ? '#EF4444' : '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: muted ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            {muted ? '🔊 Unmute Sound' : '🔇 Mute All'}
          </button>
        </div>

        {/* SFX Theme Selector */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎵</span> Select Sound Effect Pack (Theme)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {themes.map((t) => {
              const isSelected = activeTheme === t.id && !muted;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: `2px solid ${isSelected ? '#38BDF8' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#38BDF8', color: '#0F172A', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      ACTIVE
                    </div>
                  )}
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{t.icon}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#38BDF8' : '#F8FAFC', marginBottom: '6px' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px', lineHeight: '1.4' }}>
                    {t.desc}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34D399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    ✨ {t.preview}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audio Sample Pad */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#E2E8F0', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎹</span> Interactive Sample Pad (Test Sound Effects)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => soundEngine.playClick()}
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid #8B5CF6',
                color: '#A78BFA',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ⌨️ Test Click SFX
            </button>
            <button
              onClick={() => soundEngine.playCommit()}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              📸 Test Commit SFX
            </button>
            <button
              onClick={() => soundEngine.playBranch()}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🌿 Test Branch SFX
            </button>
            <button
              onClick={() => soundEngine.playSuccess()}
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid #F59E0B',
                color: '#FBBF24',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🏆 Test Victory SFX
            </button>
            <button
              onClick={() => soundEngine.playError()}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ⚠️ Test Error SFX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
