import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface TeamLabModalProps {
  onAwardBadge: (badgeId: string) => void;
  onClose: () => void;
}

export const TeamLabModal: React.FC<TeamLabModalProps> = ({
  onAwardBadge,
  onClose,
}) => {
  const [syncState, setSyncState] = useState<'idle' | 'pushed' | 'fetched' | 'rebased'>('idle');
  const [activeTeammate, setActiveTeammate] = useState<string>('Sarah Tech-Lead 👩‍💻');
  const [logs, setLogs] = useState<string[]>([
    '🌐 Team Lab initialized. Connected to peer broadcast network [Room: #CT-9824-SYN].',
    '✨ Local branch "main" is currently synchronized with "origin/main".',
  ]);

  const handleSimulatePush = () => {
    soundEngine.playBranch();
    setSyncState('pushed');
    setActiveTeammate('Sarah Tech-Lead 👩‍💻');
    setLogs((prev) => [
      ...prev,
      '📡 [REMOTE EVENT] @sarah-lead pushed 2 new commits to "origin/main" (hashes: a7d3e1f, c94b20a).',
      '⚠️ WARNING: Your local branch "main" has now diverged from "origin/main"! If you push now, git will reject it.',
    ]);
  };

  const handleFetch = () => {
    soundEngine.playClick();
    setSyncState('fetched');
    setLogs((prev) => [
      ...prev,
      '$ git fetch origin',
      'remote: Enumerating objects: 7, done.',
      'remote: Total 7 (delta 4), reused 0 (delta 0)',
      'From https://github.com/committree/simulated-remote',
      '   84b12c0..c94b20a  main       -> origin/main',
      '💡 Notice: Your remote tracking pointer "origin/main" is updated. Inspect differences with "git log origin/main".',
    ]);
  };

  const handleRebaseSync = () => {
    soundEngine.playSuccess();
    setSyncState('rebased');
    setLogs((prev) => [
      ...prev,
      '$ git pull --rebase origin main',
      'First, rewinding head to replay your work on top of it...',
      'Applying: feat(ui): local uncommitted user profile dashboard update',
      '✅ Successfully rebased and updated refs/heads/main.',
      '🚀 SUCCESS: Your local commits were replayed cleanly on top of Sarah\'s work! Graph is 100% linear.',
    ]);
    onAwardBadge('team_collaborator_live');
  };

  const handleResetLab = () => {
    soundEngine.playClick();
    setSyncState('idle');
    setLogs([
      '🌐 Team Lab initialized. Connected to peer broadcast network [Room: #CT-9824-SYN].',
      '✨ Local branch "main" is currently synchronized with "origin/main".',
    ]);
  };

  const teammates = [
    { name: 'Sarah Tech-Lead', avatar: '👩‍💻', role: 'Staff Git Architect', status: syncState === 'pushed' ? 'Just pushed 2 commits to main! 🚀' : 'Online & Coding' },
    { name: 'Alex DevOps', avatar: '🦊', role: 'Principal SRE Engineer', status: 'Monitoring CI/CD Pipelines ✅' },
    { name: 'David Dev', avatar: '👨‍🚀', role: 'Senior Frontend Dev', status: 'Reviewing PR #42 💬' },
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
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)',
        color: '#F8FAFC',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🌐</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Collaborative Team Lab & Remote Sync Simulator
                <span style={{ fontSize: '11px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '2px 8px', borderRadius: '10px' }}>LIVE P2P</span>
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                Practice resolving diverged remote branch histories with simulated coworkers!
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

        {/* Teammates Sidebar & Info */}
        <div style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              📡 Simulated Remote Teammates (Room #CT-9824)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teammates.map((t, idx) => (
                <div key={idx} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{t.avatar}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {t.name}
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                    </div>
                    <div style={{ fontSize: '11px', color: t.status.includes('pushed') ? '#38BDF8' : '#64748B', fontWeight: t.status.includes('pushed') ? 700 : 400 }}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: '2 1 350px', backgroundColor: '#090D16', border: '1px solid #1E293B', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎯</span> Active Mission: Avoid Merge Bubbles (featuring {activeTeammate})
              </h3>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                When multiple developers push to the same branch (`main`), git rejects your push if your local branch is behind. Simply running `git pull` creates messy diamond merge bubbles. In professional teams, we use **`git pull --rebase`** to replay our work cleanly!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {syncState === 'idle' && (
                <button
                  onClick={handleSimulatePush}
                  style={{
                    backgroundColor: '#38BDF8',
                    color: '#0F172A',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📡</span> Step 1: Simulate Teammate Push to Remote
                </button>
              )}

              {syncState === 'pushed' && (
                <button
                  onClick={handleFetch}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#0F172A',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>1️⃣</span> Step 2: Run "git fetch origin" to Inspect
                </button>
              )}

              {syncState === 'fetched' && (
                <button
                  onClick={handleRebaseSync}
                  style={{
                    backgroundColor: '#8B5CF6',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>2️⃣</span> Step 3: Run "git pull --rebase origin main"
                </button>
              )}

              {syncState === 'rebased' && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#34D399', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <span>🎉 Linear Sync Complete! Unlocked Sync Master 🌐 Badge!</span>
                  <button
                    onClick={handleResetLab}
                    style={{ backgroundColor: '#10B981', color: '#0F172A', border: 'none', padding: '4px 10px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                  >
                    🔄 Restart Lab
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Network Log */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>
              📡 Live P2P Sync Terminal & Event Log
            </h3>
            {syncState !== 'idle' && (
              <button
                onClick={handleResetLab}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#CBD5E1', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
              >
                🔄 Reset Simulator
              </button>
            )}
          </div>

          <div style={{ backgroundColor: '#050810', border: '1px solid #1E293B', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '13px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.startsWith('$') ? '#38BDF8' : log.includes('WARNING') ? '#FBBF24' : log.includes('SUCCESS') || log.includes('rebased') ? '#34D399' : '#CBD5E1' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
