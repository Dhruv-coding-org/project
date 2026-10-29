import React, { useState, useEffect } from 'react';

interface CIPipelineModalProps {
  ciStatus: 'passing' | 'failing' | 'running';
  onTriggerBreakage: () => void;
  onTriggerRepair: () => void;
  onAwardBadge: (badgeId: string) => void;
  onClose: () => void;
}

export const CIPipelineModal: React.FC<CIPipelineModalProps> = ({
  ciStatus,
  onTriggerBreakage,
  onTriggerRepair,
  onAwardBadge,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs'>('pipeline');
  const [simRunning, setSimRunning] = useState<boolean>(ciStatus === 'running');

  useEffect(() => {
    setSimRunning(ciStatus === 'running');
  }, [ciStatus]);

  const handleRunRepairMission = () => {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      onTriggerRepair();
      onAwardBadge('cicd_engineer');
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="ci-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
          border: `1px solid ${ciStatus === 'failing' ? '#EF4444' : '#10B981'}`,
          boxShadow: `0 0 40px ${ciStatus === 'failing' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)'}`,
          borderRadius: '16px',
          padding: '24px',
          width: '880px',
          maxWidth: '94vw',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#F8FAFC',
          fontFamily: "'Inter', sans-serif",
          animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚙️</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: ciStatus === 'failing' ? '#F87171' : '#34D399' }}>
                Continuous Integration (CI/CD) Pipeline Hub
              </h2>
              <span style={{
                background: ciStatus === 'failing' ? 'rgba(239, 68, 68, 0.2)' : simRunning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: `1px solid ${ciStatus === 'failing' ? '#EF4444' : simRunning ? '#F59E0B' : '#10B981'}`,
                color: ciStatus === 'failing' ? '#FCA5A5' : simRunning ? '#FDE68A' : '#A7F3D0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                {simRunning ? '🔄 Executing Job...' : ciStatus === 'failing' ? '❌ Pipeline Failed' : '✅ All Checks Passed'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 36px' }}>
              Automated build verification, test suite execution, and preview deployment environment.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('pipeline')}
            style={{
              background: activeTab === 'pipeline' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'pipeline' ? '#10B981' : 'transparent'}`,
              color: activeTab === 'pipeline' ? '#34D399' : '#94A3B8',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔗</span> Pipeline Stages
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              background: activeTab === 'logs' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'logs' ? '#38BDF8' : 'transparent'}`,
              color: activeTab === 'logs' ? '#38BDF8' : '#94A3B8',
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📜</span> Terminal Output Logs
          </button>
        </div>

        {/* Tab 1: Pipeline Visualization */}
        {activeTab === 'pipeline' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
            {/* 3 Connected Stage Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr 40px 1fr', alignItems: 'center', gap: '8px' }}>
              {/* Stage 1: Build */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '2px solid #10B981', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>Stage 1</span>
                  <span style={{ fontSize: '18px' }}>✅</span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>🔨 Vite React Build</h4>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Compiled 42 modules into ES static assets</div>
                <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  Duration: 142ms
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#64748B', fontSize: '24px', fontWeight: 800 }}>→</div>

              {/* Stage 2: Test Suite */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: `2px solid ${simRunning ? '#F59E0B' : ciStatus === 'failing' ? '#EF4444' : '#10B981'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: ciStatus === 'failing' ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: simRunning ? '#F59E0B' : ciStatus === 'failing' ? '#EF4444' : '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>Stage 2</span>
                  <span style={{ fontSize: '18px' }}>{simRunning ? '🔄' : ciStatus === 'failing' ? '❌' : '✅'}</span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>🧪 Automated Test Suite</h4>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {ciStatus === 'failing' ? 'Failed at Git Engine checkWin assert!' : 'Executed 42 unit tests & graph assertions'}
                </div>
                <div style={{ fontSize: '11px', color: simRunning ? '#FDE68A' : ciStatus === 'failing' ? '#FCA5A5' : '#34D399', fontWeight: 600, background: ciStatus === 'failing' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  {simRunning ? 'Running tests...' : ciStatus === 'failing' ? 'Status: 1 FAILED, 41 PASSED' : 'Status: 42/42 PASSED'}
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#64748B', fontSize: '24px', fontWeight: 800 }}>→</div>

              {/* Stage 3: Deploy Preview */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: `2px solid ${ciStatus === 'failing' ? '#475569' : '#10B981'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                opacity: ciStatus === 'failing' ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: ciStatus === 'failing' ? '#94A3B8' : '#10B981', fontWeight: 800, textTransform: 'uppercase' }}>Stage 3</span>
                  <span style={{ fontSize: '18px' }}>{ciStatus === 'failing' ? '⏸️' : '🚀'}</span>
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>🚀 Preview Edge Deploy</h4>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {ciStatus === 'failing' ? 'Deploy skipped due to failing upstream tests' : 'Deployed commit to edge sandbox preview'}
                </div>
                <div style={{ fontSize: '11px', color: ciStatus === 'failing' ? '#94A3B8' : '#38BDF8', fontWeight: 600, background: ciStatus === 'failing' ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  {ciStatus === 'failing' ? 'Skipped' : 'URL: https://preview-committree.dev/head'}
                </div>
              </div>
            </div>

            {/* Interactive CI Mission Box */}
            <div style={{
              background: ciStatus === 'failing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${ciStatus === 'failing' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginTop: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: ciStatus === 'failing' ? '#FCA5A5' : '#34D399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{ciStatus === 'failing' ? '🚨' : '🎮'}</span>
                    {ciStatus === 'failing' ? 'CI/CD Breakdown Mission: Broken Test Suite!' : 'Interactive CI Chaos Simulation'}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#CBD5E1', margin: '4px 0 0 0', maxWidth: '650px', lineHeight: '1.5' }}>
                    {ciStatus === 'failing'
                      ? 'An orphaned commit introduced a breaking change in app.js! You must use Git commands (or run automated CI diagnostics) to restore the pipeline to green!'
                      : 'Test your DevOps recovery skills by simulating a broken build pipeline! See how Git operations resolve CI/CD blockers.'}
                  </p>
                </div>

                {ciStatus === 'passing' ? (
                  <button
                    onClick={onTriggerBreakage}
                    style={{
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    💥 Simulate Broken CI
                  </button>
                ) : (
                  <button
                    onClick={handleRunRepairMission}
                    disabled={simRunning}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: simRunning ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    {simRunning ? '🔄 Repairing...' : '🔧 Run Git Fix & Re-Test'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Terminal Output Logs */}
        {activeTab === 'logs' && (
          <div style={{ background: '#090D16', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', color: '#CBD5E1' }}>
            <div style={{ color: '#60A5FA' }}>$ ci-runner --pipeline main-branch --verbose</div>
            <div>[build] Using Vite v8.0.14 for production bundle...</div>
            <div>[build] ✓ 42 modules transformed in 142ms.</div>
            <div>[test] Launching automated Git Engine assertion runner...</div>
            {ciStatus === 'failing' ? (
              <>
                <div style={{ color: '#F87171' }}>[test] ✖ FAIL src/git/gitEngine.test.ts</div>
                <div style={{ color: '#FCA5A5', marginLeft: '16px' }}>● GitEngine › should maintain clean commit tree without dangling HEAD</div>
                <div style={{ color: '#FCA5A5', marginLeft: '32px' }}>Expected: merge clean</div>
                <div style={{ color: '#EF4444', marginLeft: '32px' }}>Received: orphaned HEAD at commit C4</div>
                <div style={{ color: '#F87171', marginTop: '12px' }}>[test] Test Suites: 1 failed, 0 passed, 1 total.</div>
                <div style={{ color: '#EF4444', fontWeight: 700 }}>[pipeline] ✖ Pipeline terminated with exit code 1. Deploy preview skipped.</div>
              </>
            ) : (
              <>
                <div style={{ color: '#34D399' }}>[test] ✓ PASS src/git/gitEngine.test.ts (42/42 tests passed)</div>
                <div>[test] Test Suites: 1 passed, 1 total.</div>
                <div style={{ color: '#38BDF8' }}>[deploy] Creating edge deployment for HEAD...</div>
                <div style={{ color: '#34D399', fontWeight: 700 }}>[pipeline] ✓ All checks completed successfully. Preview environment live.</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
