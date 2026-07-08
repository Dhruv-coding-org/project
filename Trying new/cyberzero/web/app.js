// CyberZero — Core Application Engine (app.js)
// State management, routing, audio engine, terminal, quiz system, keyboard shortcuts.

'use strict';

/* ══════════════════════════════════════════════════════════════
   STATE MANAGEMENT
══════════════════════════════════════════════════════════════ */
const STATE_VERSION = 3;

const defaultState = {
  version:     STATE_VERSION,
  name:        'Guardian',
  avatar:      '🛡️',
  xp:          0,
  level:       1,
  combo:       0,
  theme:       'obsidian',
  sound:       false,
  currentView: 'home',
  badges:      Array(22).fill(false),
  bosses:      Array(4).fill(false),
  quizLives:   3,
  currentModId: 0,
  bossPhase:   0,
};

let S = { ...defaultState };

function saveState() {
  try { localStorage.setItem('cyberzero_v3', JSON.stringify(S)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('cyberzero_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === STATE_VERSION) S = { ...defaultState, ...parsed };
    }
  } catch(e) {}
}

function resetProgress() {
  if (!confirm('⚠️ This will erase ALL XP, badges, boss victories, and progress. Are you sure?')) return;
  localStorage.removeItem('cyberzero_v3');
  location.reload();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'cyberzero_progress.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Progress exported as JSON', 'ok');
}

/* ══════════════════════════════════════════════════════════════
   AUDIO ENGINE
══════════════════════════════════════════════════════════════ */
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playSound(type = 'click') {
  if (!S.sound) return;
  try {
    const ctx = getAudioCtx();
    const play = (freq, dur, gainVal = 0.08, oscType = 'square', freqEnd = null) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + dur);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    };

    if (type === 'click')   play(800, 0.03, 0.06, 'square', 250);
    if (type === 'hover')   play(1200, 0.012, 0.02, 'sine', 1000);
    if (type === 'error')   play(150, 0.2, 0.1, 'sawtooth', 120);
    if (type === 'success') {
      [523, 659, 784].forEach((f, i) => setTimeout(() => play(f, 0.22, 0.07, 'triangle'), i * 75));
    }
    if (type === 'levelup') {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => play(f, 0.3, 0.09, 'triangle'), i * 90));
    }
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'info', icon = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { ok: '✅', err: '🚨', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon || icons[type] || '💡'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

/* ══════════════════════════════════════════════════════════════
   VIEW ROUTING
══════════════════════════════════════════════════════════════ */
function switchView(viewName) {
  playSound('click');
  S.currentView = viewName;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');
  const btn = document.querySelector(`[data-view="${viewName}"]`);
  if (btn) btn.classList.add('active');

  if (viewName === 'home')     updateHomeView();
  if (viewName === 'training') renderModuleGrid(S.currentPhase || 1);
  if (viewName === 'profile' || viewName === 'trophies') renderTrophies();
  if (viewName === 'terminal') document.getElementById('term-input')?.focus();

  closeSidebar();
  saveState();
}

/* ══════════════════════════════════════════════════════════════
   HOME VIEW
══════════════════════════════════════════════════════════════ */
function updateHomeView() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  const el = id => document.getElementById(id);
  if (el('home-greeting')) el('home-greeting').textContent = greet;
  if (el('home-name')) el('home-name').textContent = `Operative ${S.name}`;
  if (el('home-avatar')) el('home-avatar').textContent = S.avatar;
  if (el('sidebar-avatar')) el('sidebar-avatar').textContent = S.avatar;

  const badgeCount = S.badges.filter(Boolean).length;
  const bossCount  = S.bosses.filter(Boolean).length;
  const rank = getRank(badgeCount, bossCount);
  S.level = Math.floor(S.xp / 100) + 1;

  if (el('home-rank')) el('home-rank').textContent = rank;
  if (el('home-stat-badges')) el('home-stat-badges').textContent = `${badgeCount}/22`;
  if (el('home-stat-bosses')) el('home-stat-bosses').textContent = `${bossCount}/4`;
  if (el('home-stat-xp')) el('home-stat-xp').textContent = S.xp;
  if (el('home-stat-combo')) el('home-stat-combo').textContent = `${S.combo}×`;
  if (el('home-stat-level')) el('home-stat-level').textContent = S.level;
  if (el('home-xp-label')) el('home-xp-label').textContent = `${S.xp} XP`;
  if (el('home-level-label')) el('home-level-label').textContent = `Level ${S.level}`;

  const xpInLevel = S.xp % 100;
  if (el('home-xp-bar')) el('home-xp-bar').style.width = `${xpInLevel}%`;

  // Threat of the Day (rotates daily by date)
  const threatIdx = new Date().getDate() % DAILY_THREATS.length;
  const threat = DAILY_THREATS[threatIdx];
  if (el('threat-name')) el('threat-name').textContent = `${threat.type}: ${threat.name}`;
  if (el('threat-desc')) el('threat-desc').textContent = threat.desc;
  if (el('threat-module-btn')) el('threat-module-btn').setAttribute('data-mod', threat.module);

  // Mission Brief — next incomplete module
  const nextMod = CURRICULUM.find(m => !S.badges[m.id - 1]);
  if (nextMod) {
    if (el('mission-title')) el('mission-title').textContent = `Module #${nextMod.id}: ${nextMod.name}`;
    if (el('mission-desc')) el('mission-desc').textContent = nextMod.desc;
  } else {
    if (el('mission-title')) el('mission-title').textContent = '🏆 All modules completed!';
    if (el('mission-desc')) el('mission-desc').textContent = 'You have mastered all 22 modules. Now conquer the boss battles!';
  }
}

function goToThreatModule() {
  const btn = document.getElementById('threat-module-btn');
  const modId = parseInt(btn?.getAttribute('data-mod') || '1');
  switchView('training');
  setTimeout(() => openModule(modId), 100);
}

function getRank(badges, bosses) {
  if (badges >= 22 && bosses >= 4) return '👑 GRANDMASTER SENTINEL';
  if (badges >= 18) return '⚡ Elite Operative';
  if (badges >= 12) return '🛡️ Senior Cyber Scout';
  if (badges >= 6)  return '🔍 Vigilant Defender';
  if (badges >= 1)  return '⚙️ Operative Apprentice';
  return '🔰 Cyber Cadet';
}

/* ══════════════════════════════════════════════════════════════
   MODULE GRID
══════════════════════════════════════════════════════════════ */
let currentPhase = 1;

function renderPhaseSelector() {
  const sel = document.getElementById('phase-selector');
  if (!sel) return;
  sel.innerHTML = PHASES.map(p => `
    <button class="phase-chip ${currentPhase === p.id ? 'active' : ''}"
      onclick="selectPhase(${p.id})" style="--phase-color:${p.color};">
      ${p.icon} ${p.name}
    </button>
  `).join('');
}

function selectPhase(pNum) {
  playSound('click');
  currentPhase = pNum;
  S.currentPhase = pNum;
  renderPhaseSelector();
  renderModuleGrid(pNum);
}

function renderModuleGrid(pNum = 1) {
  renderPhaseSelector();
  const grid = document.getElementById('module-grid');
  const arena = document.getElementById('module-arena');
  const gridView = document.getElementById('training-grid-view');
  if (!grid) return;

  if (arena) arena.style.display = 'none';
  if (gridView) gridView.style.display = 'block';

  const phase = PHASES.find(p => p.id === pNum);
  const mods = CURRICULUM.filter(m => m.phase === pNum);

  grid.innerHTML = mods.map(mod => {
    const done = S.badges[mod.id - 1];
    const diffColor = DIFFICULTY_COLOR[mod.difficulty] || '#64748b';
    return `
      <div class="mod-card ${done ? 'state-completed' : ''}" onclick="openModule(${mod.id})">
        <div>
          <div class="card-mod-num">${phase?.icon} Phase ${pNum} · Module ${mod.id}</div>
          <div class="card-icon">${mod.icon}</div>
          <div class="card-title">${mod.name}</div>
          <div class="card-desc">${mod.desc}</div>
        </div>
        <div class="card-footer">
          <span class="difficulty-dot" style="--difficulty-color:${diffColor}; color:${diffColor};">${mod.difficulty}</span>
          <span class="card-status-badge ${done ? 'badge-done' : 'badge-progress'}">${done ? '🏆 Badge Earned' : '▶ Launch Lab'}</span>
        </div>
      </div>
    `;
  }).join('');

  // Boss Battle Card
  const bossWon = S.bosses[pNum - 1];
  grid.innerHTML += `
    <div class="mod-card state-boss ${bossWon ? 'state-completed' : ''}" onclick="openBoss(${pNum})">
      <div>
        <div class="card-mod-num">💥 Phase ${pNum} · Boss Siege</div>
        <div class="card-icon">💥</div>
        <div class="card-title">Tactical Boss Battle #${pNum}</div>
        <div class="card-desc">Live countdown siege! Defend your citadel under real attack pressure.</div>
      </div>
      <div class="card-footer">
        <span class="difficulty-dot" style="--difficulty-color:var(--c-red); color:var(--c-red);">Boss</span>
        <span class="card-status-badge ${bossWon ? 'badge-done' : 'badge-locked'}">${bossWon ? '👑 Conquered' : '🚨 Engage'}</span>
      </div>
    </div>
  `;
}

function backToGrid() {
  playSound('click');
  clearInterval(bossInterval);
  document.getElementById('boss-hud')?.classList.remove('show');
  S.currentModId = 0;
  renderModuleGrid(currentPhase);
}

function navigateModule(dir) {
  playSound('click');
  const curr = S.currentModId;
  if (curr < 1 || curr > 22) return backToGrid();
  const newId = curr + dir;
  if (newId < 1 || newId > 22) return backToGrid();
  openModule(newId);
}

/* ══════════════════════════════════════════════════════════════
   MODULE ARENA
══════════════════════════════════════════════════════════════ */
let quizTimer = null;
let quizSecsLeft = 20;

function openModule(modId) {
  playSound('click');
  S.currentModId = modId;
  clearInterval(bossInterval);
  document.getElementById('boss-hud')?.classList.remove('show');

  const mod = CURRICULUM.find(m => m.id === modId);
  if (!mod) return;

  const gridView = document.getElementById('training-grid-view');
  const arena    = document.getElementById('module-arena');
  if (gridView) gridView.style.display = 'none';
  if (arena)    arena.style.display = 'block';

  // Set breadcrumb + title
  const phase = PHASES.find(p => p.id === mod.phase);
  setEl('arena-phase-label', phase?.name || `Phase ${mod.phase}`);
  setEl('arena-mod-label', mod.name);
  const titleEl = document.getElementById('arena-title');
  if (titleEl) titleEl.innerHTML = `${mod.icon} #${mod.id}: ${mod.name}`;

  // Tags
  const tagsEl = document.getElementById('arena-tags');
  if (tagsEl) tagsEl.innerHTML = (mod.tags || []).map(t => `<span class="arena-tag">${t}</span>`).join('');

  // Status badge
  updateArenaStatus(modId);

  // Concept Panel
  setEl('concept-text', mod.analogy);
  setEl('incident-text', mod.incident);

  // Lab Panel
  renderLab(modId);

  // Quiz Panel
  setupQuiz(modId);

  // Default to Concept tab
  switchArenaTab('concept');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateArenaStatus(modId) {
  const done = S.badges[modId - 1];
  const btn = document.getElementById('arena-status-btn');
  if (!btn) return;
  if (done) {
    btn.textContent = '🏆 Badge Earned';
    btn.style.color = 'var(--c-green)';
    btn.style.borderColor = 'var(--c-green)';
  } else {
    btn.textContent = '🔒 Badge Locked';
    btn.style.color = 'var(--c-text-dim)';
    btn.style.borderColor = 'var(--c-border)';
  }
}

function switchArenaTab(tabName) {
  playSound('click');
  document.querySelectorAll('.arena-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === tabName);
  });
  document.querySelectorAll('.arena-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });
  if (tabName === 'quiz') startQuizTimer();
  else clearInterval(quizTimer);
}

/* ══════════════════════════════════════════════════════════════
   QUIZ ENGINE
══════════════════════════════════════════════════════════════ */
function setupQuiz(modId) {
  const mod = CURRICULUM.find(m => m.id === modId);
  if (!mod?.quiz) return;

  S.quizLives = 3;
  clearInterval(quizTimer);

  updateLives();
  setEl('quiz-question', mod.quiz.question);

  const optsEl = document.getElementById('quiz-options');
  const explEl = document.getElementById('quiz-explanation');
  const nextBtn = document.getElementById('quiz-next-btn');
  if (!optsEl) return;
  if (explEl) { explEl.className = 'quiz-explanation'; explEl.innerHTML = ''; }
  if (nextBtn) nextBtn.style.display = 'none';

  const letters = ['A','B','C','D'];
  optsEl.innerHTML = mod.quiz.options.map((opt, idx) => `
    <button class="quiz-opt" data-idx="${idx}" onclick="submitQuizAnswer(${modId}, ${idx})">
      <span class="opt-letter">${letters[idx]}</span>${opt.text}
    </button>
  `).join('');

  resetTimerBar();
}

function startQuizTimer() {
  clearInterval(quizTimer);
  quizSecsLeft = 20;
  updateTimerBar();
  quizTimer = setInterval(() => {
    quizSecsLeft--;
    updateTimerBar();
    if (quizSecsLeft <= 0) {
      clearInterval(quizTimer);
      onQuizTimeOut();
    }
  }, 1000);
}

function updateTimerBar() {
  const bar = document.getElementById('quiz-timer-fill');
  if (bar) bar.style.width = `${(quizSecsLeft / 20) * 100}%`;
}

function resetTimerBar() {
  quizSecsLeft = 20;
  const bar = document.getElementById('quiz-timer-fill');
  if (bar) bar.style.width = '100%';
}

function onQuizTimeOut() {
  S.quizLives--;
  playSound('error');
  updateLives();
  const optsEl = document.getElementById('quiz-options');
  if (optsEl) optsEl.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
  showExplanation('⏰ <b>Time\'s up!</b> The timer ran out. Re-read the Concept tab and try again!', false);
  if (S.quizLives <= 0) onQuizFailed();
}

function submitQuizAnswer(modId, selectedIdx) {
  clearInterval(quizTimer);
  const mod = CURRICULUM.find(m => m.id === modId);
  if (!mod?.quiz) return;

  const correct = mod.quiz.correct;
  const isCorrect = selectedIdx === correct;
  const optsEl = document.getElementById('quiz-options');
  const opts = optsEl?.querySelectorAll('.quiz-opt');

  opts?.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct)  btn.classList.add('correct');
    if (idx === selectedIdx && !isCorrect) btn.classList.add('wrong');
  });

  const explanation = mod.quiz.options[selectedIdx].explanation;
  showExplanation(
    isCorrect
      ? `✅ ${explanation}<br><br>🏆 <b>Correct! Badge unlocked!</b>`
      : `${explanation}<br><br>✅ <b>Correct answer:</b> Option ${['A','B','C','D'][correct]}: ${mod.quiz.options[correct].text}`,
    isCorrect
  );

  if (isCorrect) {
    playSound('levelup');
    S.combo++;
    const xpGain = Math.min(80, 30 + S.combo * 5);
    S.xp += xpGain;
    S.badges[modId - 1] = true;
    updateArenaStatus(modId);
    showToast(`+${xpGain} XP! Badge #${modId} unlocked! 🏆 Combo: ${S.combo}×`, 'ok');
    const nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) nextBtn.style.display = 'inline-flex';
  } else {
    playSound('error');
    S.combo = 0;
    S.quizLives--;
    updateLives();
    if (S.quizLives <= 0) onQuizFailed();
  }
  saveState();
}

function showExplanation(html, isCorrect) {
  const el = document.getElementById('quiz-explanation');
  if (!el) return;
  el.className = `quiz-explanation show`;
  el.innerHTML = html;
  el.style.borderColor = isCorrect ? 'var(--c-green)' : 'var(--c-red)';
  el.style.background = isCorrect ? 'var(--c-green-dim)' : 'var(--c-red-dim)';
}

function onQuizFailed() {
  showToast('All 3 lives lost! Re-read the Concept and try again.', 'err');
  setTimeout(() => {
    S.quizLives = 3;
    setupQuiz(S.currentModId);
  }, 2000);
}

function updateLives() {
  ['life-1','life-2','life-3'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('lost', idx >= S.quizLives);
  });
}

/* ══════════════════════════════════════════════════════════════
   BOSS BATTLES
══════════════════════════════════════════════════════════════ */
let bossInterval = null;
let bossTime = 30;
let shieldHP = 100;

function openBoss(pNum) {
  playSound('click');
  S.bossPhase = pNum;
  S.currentModId = 100 + pNum;

  const gridView = document.getElementById('training-grid-view');
  const arena    = document.getElementById('module-arena');
  if (gridView) gridView.style.display = 'none';
  if (arena)    arena.style.display = 'block';

  setEl('arena-phase-label', `Phase ${pNum}`);
  setEl('arena-mod-label', 'Boss Siege');
  const titleEl = document.getElementById('arena-title');
  if (titleEl) titleEl.innerHTML = `💥 Phase ${pNum} — Tactical Boss Siege`;

  setEl('concept-text', `You are now in LIVE SIEGE MODE! An automated botnet assault has begun. You have 30 seconds to activate all defensive countermeasures before your shield hits 0%!`);
  setEl('incident-text', `Real scenario: In 2021, Olympus Corporation suffered a ransomware attack on a Friday night. SOC analysts had minutes to respond. Those who acted immediately limited damage; those who hesitated paid $50 million.`);

  const hud = document.getElementById('boss-hud');
  if (hud) hud.classList.add('show');

  bossTime = 30; shieldHP = 100;
  updateBossHUD();
  clearInterval(bossInterval);
  bossInterval = setInterval(() => {
    bossTime--;
    if (bossTime % 4 === 0 && shieldHP > 0) {
      shieldHP = Math.max(0, shieldHP - 10);
      playSound('error');
    }
    updateBossHUD();
    if (bossTime <= 0 || shieldHP <= 0) {
      clearInterval(bossInterval);
      onBossDefeated(false, pNum);
    }
  }, 1000);

  renderBossControls(pNum);
  document.getElementById('arena-quiz-pillar')?.style && (document.getElementById('arena-quiz-pillar').style.display = 'none');
  switchArenaTab('lab');
}

function updateBossHUD() {
  setEl('boss-timer', `${bossTime}s`);
  setEl('shield-pct', `${shieldHP}%`);
  const fill = document.getElementById('shield-fill');
  if (fill) {
    fill.style.width = `${shieldHP}%`;
    fill.style.background = shieldHP > 60 ? 'var(--c-green)' : shieldHP > 30 ? 'var(--c-yellow)' : 'var(--c-red)';
  }
}

function renderBossControls(pNum) {
  const controls = document.getElementById('lab-controls');
  const hint = document.getElementById('lab-hint');
  if (hint) { hint.style.display = 'block'; hint.innerHTML = '💡 <b>SIEGE MODE:</b> Activate ALL defensive countermeasures below before the shield hits 0%!'; }
  if (!controls) return;

  const bossChallenges = {
    1: `
      <div class="col" style="gap:14px;">
        <div class="row" style="flex-wrap:wrap;">
          <input class="input" id="boss-pwd" type="text" placeholder="Enter password (≥12 chars + numbers + symbols)..." style="max-width:340px;">
          <div class="toggle-row" onclick="boss1_toggle()" style="cursor:pointer;"><div class="toggle-switch" id="boss-mfa-toggle"></div><span class="toggle-label">Enable 2FA Authenticator</span></div>
        </div>
        <button class="btn btn-danger btn-lg" onclick="engageBoss(1)">🚀 Engage Phantom-X Botnet</button>
      </div>`,
    2: `
      <div class="col" style="gap:14px;">
        <div class="toggle-row" onclick="boss2_toggle('quar')" style="cursor:pointer;"><div class="toggle-switch" id="boss-quar-toggle"></div><span class="toggle-label">Quarantine Malware in Sandbox</span></div>
        <div class="toggle-row" onclick="boss2_toggle('backup')" style="cursor:pointer;"><div class="toggle-switch" id="boss-backup-toggle"></div><span class="toggle-label">Restore Air-Gapped Offline Backup</span></div>
        <button class="btn btn-danger btn-lg" onclick="engageBoss(2)">🚀 Engage Glitch-Worm Siege</button>
      </div>`,
    3: `
      <div class="col" style="gap:14px;">
        <div class="toggle-row" onclick="boss3_toggle('fw')" style="cursor:pointer;"><div class="toggle-switch on" id="boss-fw-toggle"></div><span class="toggle-label">Firewall: Close All High-Risk Ports</span></div>
        <div class="toggle-row" onclick="boss3_toggle('enc')" style="cursor:pointer;"><div class="toggle-switch on" id="boss-enc-toggle"></div><span class="toggle-label">Enable AES-256 Data Encryption</span></div>
        <button class="btn btn-danger btn-lg" onclick="engageBoss(3)">🚀 Engage Network Phantom</button>
      </div>`,
    4: `
      <div class="col" style="gap:14px;">
        <div style="font-size:0.88rem; color:var(--c-text-dim);">Activate all 4 citadel defense layers:</div>
        ${[1,2,3,4].map(l => `<div class="toggle-row" onclick="boss4_toggle(${l})" style="cursor:pointer;"><div class="toggle-switch" id="boss-layer-${l}"></div><span class="toggle-label">Layer ${l}: ${['Perimeter Firewall','Identity MFA','App Security','Data Encryption'][l-1]}</span></div>`).join('')}
        <button class="btn btn-danger btn-lg" onclick="engageBoss(4)">👑 Claim Grandmaster Victory</button>
      </div>`,
  };

  controls.innerHTML = bossChallenges[pNum] || '';

  window.boss1On = false;
  window.boss1_toggle = () => {
    window.boss1On = !window.boss1On;
    const t = document.getElementById('boss-mfa-toggle');
    if (t) t.className = `toggle-switch ${window.boss1On ? 'on' : ''}`;
    playSound('click');
  };
  window.boss2State = { quar: false, backup: false };
  window.boss2_toggle = (key) => {
    window.boss2State[key] = !window.boss2State[key];
    const t = document.getElementById(`boss-${key}-toggle`);
    if (t) t.className = `toggle-switch ${window.boss2State[key] ? 'on' : ''}`;
    playSound('click');
  };
  window.boss3State = { fw: true, enc: true };
  window.boss3_toggle = (key) => {
    window.boss3State[key] = !window.boss3State[key];
    const t = document.getElementById(`boss-${key}-toggle`);
    if (t) t.className = `toggle-switch ${window.boss3State[key] ? 'on' : ''}`;
    playSound('click');
  };
  window.boss4Layers = [false, false, false, false];
  window.boss4_toggle = (l) => {
    window.boss4Layers[l-1] = !window.boss4Layers[l-1];
    const t = document.getElementById(`boss-layer-${l}`);
    if (t) t.className = `toggle-switch ${window.boss4Layers[l-1] ? 'on' : ''}`;
    playSound('click');
  };
}

function engageBoss(pNum) {
  let win = false;
  if (pNum === 1) {
    const pwd = document.getElementById('boss-pwd')?.value || '';
    win = pwd.length >= 12 && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd) && window.boss1On;
  }
  if (pNum === 2) win = window.boss2State?.quar && window.boss2State?.backup;
  if (pNum === 3) win = window.boss3State?.fw && window.boss3State?.enc;
  if (pNum === 4) win = window.boss4Layers?.every(Boolean);

  onBossDefeated(win, pNum);
}

function onBossDefeated(win, pNum) {
  clearInterval(bossInterval);
  const out = document.getElementById('sim-output');
  if (!out) return;
  if (win) {
    playSound('levelup');
    S.bosses[pNum - 1] = true;
    S.xp += 200;
    shieldHP = 100; updateBossHUD();
    out.className = 'sim-output show ok';
    out.innerHTML = `👑 SIEGE VICTORY! Phase ${pNum} Boss Defeated!\n+200 XP awarded. Your citadel defenses held impenetrable!\n\nKey: Multi-layered defense is the only reliable protection against coordinated attacks.`;
    showToast(`Boss #${pNum} defeated! +200 XP`, 'ok', '👑');
    saveState();
  } else {
    playSound('error');
    out.className = 'sim-output show err';
    out.innerHTML = `🚨 SIEGE DEFENSE COLLAPSED! Shield hit 0%.\n\nReview what was missing and click Engage again!`;
    showToast('Siege collapsed! Check your defenses and retry.', 'err');
  }
}

/* ══════════════════════════════════════════════════════════════
   CYBER ARCADE
══════════════════════════════════════════════════════════════ */
function startArcade(gameType) {
  playSound('click');
  const area = document.getElementById('arcade-game-area');
  const content = document.getElementById('arcade-game-content');
  const title = document.getElementById('arcade-game-title');
  if (!area || !content || !title) return;
  area.classList.add('show');
  area.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (gameType === 'phish') runPhishGame(title, content);
  if (gameType === 'pwd')   runPwdGame(title, content);
  if (gameType === 'trivia') runTriviaGame(title, content);
  if (gameType === 'log')   runLogGame(title, content);
  if (gameType === 'port')  runPortGame(title, content);
  if (gameType === 'social') runSocialGame(title, content);
}

function closeArcade() {
  const area = document.getElementById('arcade-game-area');
  if (area) area.classList.remove('show');
  playSound('click');
}

function runPhishGame(title, content) {
  title.textContent = '🎣 Phishing Swipe Challenge';
  const emails = [
    { from:'receipts@amazon.com', subject:'Your order #112-9934022 has shipped!', legit:true },
    { from:'security@paypa1-verify.com', subject:'URGENT: Verify account or lose access', legit:false },
    { from:'team@slack.com', subject:'Your workspace invitation is ready', legit:true },
    { from:'noreply@irs-refund-claim.co', subject:'$4,200 tax refund — claim now', legit:false },
    { from:'billing@netflix.com', subject:'Your monthly invoice is ready', legit:true },
    { from:'support@microsoft-security-alert.net', subject:'Your PC has been compromised!', legit:false },
  ];
  let idx = 0, score = 0;

  const render = () => {
    if (idx >= emails.length) {
      playSound('levelup');
      S.xp += score * 20; saveState();
      content.innerHTML = `<div style="text-align:center; padding:40px;">
        <div style="font-size:2.5rem; margin-bottom:16px;">🎣</div>
        <h2 style="font-size:1.8rem; color:var(--c-green);">${score}/${emails.length} Correct!</h2>
        <p style="color:var(--c-text-dim); margin:12px 0;">Awarded +${score*20} Bonus XP</p>
        <button class="btn btn-primary" onclick="runPhishGame(document.getElementById('arcade-game-title'), document.getElementById('arcade-game-content'))">Play Again</button>
      </div>`;
      showToast(`Phishing Game: ${score}/${emails.length} correct! +${score*20} XP`, 'ok');
      return;
    }
    const e = emails[idx];
    content.innerHTML = `
      <div style="background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:var(--r-lg); padding:20px; max-width:560px; margin:0 auto;">
        <div style="font-size:0.72rem; color:var(--c-text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Email ${idx+1} of ${emails.length}</div>
        <div style="font-size:0.95rem; margin-bottom:6px;"><b>From:</b> <span style="font-family:var(--font-code); color:var(--c-cyan);">${e.from}</span></div>
        <div style="font-size:0.95rem;"><b>Subject:</b> ${e.subject}</div>
        <div class="row" style="margin-top:20px; justify-content:center; gap:12px;">
          <button class="btn btn-danger" onclick="phishAns(${e.legit}, false)">🚨 Report Scam</button>
          <button class="btn btn-success" onclick="phishAns(${e.legit}, true)">✅ Legitimate</button>
        </div>
      </div>`;
    window.phishAns = (legit, userSaysLegit) => {
      if (legit === userSaysLegit) { score++; playSound('success'); showToast('Correct!', 'ok'); }
      else { playSound('error'); showToast('Incorrect! Check the sender domain.', 'err'); }
      idx++; render();
    };
  };
  render();
}

function runPwdGame(title, content) {
  title.textContent = '🗝️ Titanium Password Speed Run';
  content.innerHTML = `
    <div style="text-align:center; max-width:500px; margin:0 auto; padding:20px;">
      <p style="color:var(--c-text-dim); margin-bottom:20px;">Type a password with <b>Trillions of Years</b> entropy as fast as you can!</p>
      <input class="input" id="arcade-pwd" type="text" placeholder="Build your titanium password..." oninput="checkArcadePwd()">
      <div id="arcade-pwd-result" style="margin-top:16px; font-size:1rem; font-weight:700; color:var(--c-text-dim);">Strength: Building...</div>
    </div>`;
  window.checkArcadePwd = () => {
    const val = document.getElementById('arcade-pwd').value;
    const res = document.getElementById('arcade-pwd-result');
    const strong = val.length >= 14 && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val);
    if (strong) {
      playSound('levelup'); S.xp += 100; saveState();
      if (res) res.innerHTML = '<span style="color:var(--c-green)">🏆 TITANIUM VAULT! +100 XP Awarded!</span>';
      showToast('+100 XP — Titanium Password achieved!', 'ok', '🗝️');
      window.checkArcadePwd = () => {};
    } else {
      const entropy = val.length > 0 ? (val.length * 5) : 0;
      if (res) res.innerHTML = `<span style="color:${val.length >= 10?'var(--c-yellow)':'var(--c-red)'}">Entropy: ~${entropy} bits — ${val.length >= 10?'Getting there! Add symbols.':'Too weak!'}</span>`;
    }
  };
}

function runTriviaGame(title, content) {
  title.textContent = '🧠 Daily Cyber Survival Trivia';
  const questions = [
    { q:"What's the single most effective defense against ransomware?", opts:["Strong antivirus","Air-gapped offline backup","Firewall rules","VPN"], correct:1 },
    { q:"What does CVSS 9.8 with a known exploit mean for patching urgency?", opts:["Patch in 90 days","Patch in 30 days","Patch in 7 days","Patch immediately (24 hours)"], correct:3 },
    { q:"A website uses SHA-256 to store passwords. Is this secure?", opts:["Yes, SHA-256 is unbreakable","No — passwords need bcrypt/Argon2 with salts. SHA-256 alone is too fast to crack","Yes, if the database is encrypted","No — passwords should be stored in plaintext"], correct:1 },
    { q:"Which port should you close first on an internet-facing web server?", opts:["Port 443 (HTTPS)","Port 80 (HTTP)","Port 3389 (RDP)","Port 53 (DNS)"], correct:2 },
  ];
  const q = questions[new Date().getDate() % questions.length];
  content.innerHTML = `
    <div style="max-width:600px; margin:0 auto; padding:20px;">
      <div style="font-size:1.05rem; font-weight:700; color:var(--c-text); margin-bottom:20px;">Q: ${q.q}</div>
      <div class="col" style="gap:10px;" id="trivia-opts">
        ${q.opts.map((opt, i) => `<button class="quiz-opt" onclick="triviaAns(${i}, ${q.correct})">${['A','B','C','D'][i]}) ${opt}</button>`).join('')}
      </div>
      <div id="trivia-result" class="quiz-explanation" style="margin-top:16px;"></div>
    </div>`;
  window.triviaAns = (selected, correct) => {
    const opts = document.querySelectorAll('#trivia-opts .quiz-opt');
    opts.forEach((b,i) => { b.disabled = true; if (i===correct) b.classList.add('correct'); if (i===selected && selected!==correct) b.classList.add('wrong'); });
    const res = document.getElementById('trivia-result');
    if (selected === correct) {
      playSound('levelup'); S.xp += 50; saveState();
      if (res) { res.className = 'quiz-explanation show'; res.innerHTML = '✅ Correct! +50 Daily Trivia XP!'; res.style.borderColor = 'var(--c-green)'; res.style.background = 'var(--c-green-dim)'; }
      showToast('+50 Daily Trivia XP!', 'ok');
    } else {
      playSound('error');
      if (res) { res.className = 'quiz-explanation show'; res.innerHTML = `❌ Incorrect! The correct answer was Option ${['A','B','C','D'][correct]}: ${q.opts[correct]}`; res.style.borderColor = 'var(--c-red)'; res.style.background = 'var(--c-red-dim)'; }
    }
  };
}

function runLogGame(title, content) {
  title.textContent = '🔍 Log Hunter — Find the Attack!';
  const logs = [
    '[02:10:01] sshd: Accepted password for admin from 10.0.0.5',
    '[02:45:11] httpd: GET /index.html 200 from 203.0.113.4',
    '[03:14:00] sshd: Failed password for root from 185.220.101.5 — attempt 1',
    '[03:14:02] sshd: Failed password for root from 185.220.101.5 — attempt 23',
    '[03:14:05] sshd: Failed password for root from 185.220.101.5 — attempt 47',
    '[03:14:06] sshd: Accepted password for root from 185.220.101.5 ← BREACH',
    '[04:00:01] cron: Daily backup started',
    '[04:01:15] mysqldump: Backup completed successfully',
  ];
  const attackIdx = 5;
  content.innerHTML = `
    <div style="max-width:700px; margin:0 auto;">
      <p style="color:var(--c-text-dim); margin-bottom:12px; font-size:0.88rem;">Analyze the server logs below. Click the line that shows a successful attack.</p>
      <div class="col" style="gap:4px; font-family:var(--font-code); font-size:0.82rem;">
        ${logs.map((l,i) => `<div style="background:var(--c-surface-2); border:1px solid var(--c-border); border-radius:4px; padding:8px 12px; cursor:pointer; transition:all 0.15s;" onmouseover="this.style.borderColor='var(--c-cyan)'" onmouseout="this.style.borderColor='var(--c-border)'" onclick="logHunt(${i}, ${attackIdx})">${l}</div>`).join('')}
      </div>
      <div id="log-hunt-result" style="margin-top:16px;"></div>
    </div>`;
  window.logHunt = (selected, correct) => {
    if (selected === correct) {
      playSound('levelup'); S.xp += 75; saveState();
      document.querySelectorAll('[onclick^="logHunt"]').forEach((el,i) => { if(i===correct) el.style.borderColor='var(--c-green)'; el.onclick = null; });
      document.getElementById('log-hunt-result').innerHTML = '<div style="color:var(--c-green); font-weight:700; margin-top:8px;">✅ Correct! Brute force success event identified! +75 XP</div>';
      showToast('+75 XP — Attack pattern found!', 'ok', '🔍');
    } else {
      playSound('error');
      document.getElementById('log-hunt-result').innerHTML = '<div style="color:var(--c-red); font-weight:700; margin-top:8px;">❌ Incorrect. Look for the line with \'Accepted password\' from the same IP that had many failed attempts.</div>';
    }
  };
}

function runPortGame(title, content) {
  title.textContent = '🏰 Port Defense — Close the Gates!';
  const dangerPorts = [3389, 23, 3306, 5432, 6379];
  let closedCount = 0;
  const render = () => {
    content.innerHTML = `
      <div style="max-width:600px; margin:0 auto;">
        <p style="color:var(--c-text-dim); margin-bottom:16px; font-size:0.88rem;">Close all dangerous open ports before the breach meter fills! <b>${closedCount}/${dangerPorts.length} closed.</b></p>
        <div class="col" style="gap:10px;">
          ${dangerPorts.map(p => `
            <div id="port-row-${p}" style="background:var(--c-surface-2); border:2px solid ${window[`portClosed_${p}`]?'var(--c-green)':'rgba(244,63,94,0.4)'}; border-radius:var(--r-md); padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <span style="font-family:var(--font-code); font-weight:700;">Port ${p} — ${{3389:'RDP',23:'Telnet',3306:'MySQL',5432:'PostgreSQL',6379:'Redis'}[p]}</span>
              <button class="btn btn-sm ${window[`portClosed_${p}`]?'btn-success':'btn-danger'}" ${window[`portClosed_${p}`]?'disabled':''} onclick="closePort(${p})">${window[`portClosed_${p}`]?'✅ Closed':'Close Port'}</button>
            </div>`).join('')}
        </div>
        ${closedCount === dangerPorts.length ? '<div style="color:var(--c-green); font-weight:800; text-align:center; margin-top:20px; font-size:1.1rem;">👑 ALL PORTS CLOSED! +80 XP! Attack surface minimized!</div>' : ''}
      </div>`;
  };
  window.closePort = (p) => {
    window[`portClosed_${p}`] = true;
    closedCount++;
    playSound('success');
    if (closedCount === dangerPorts.length) { S.xp += 80; saveState(); showToast('+80 XP — Port Defense complete!', 'ok', '🏰'); }
    render();
  };
  render();
}

function runSocialGame(title, content) {
  title.textContent = '🎭 Social Engineering Gauntlet';
  const scenarios = [
    { scene:'A caller says "Hi, this is IT support. We need your password to fix a critical server issue." They know your manager\'s name.', correct:'Refuse and call IT directly using the official company phone number', wrong:'Give password since they know your manager' },
    { scene:'Someone in a suit follows you through a secure door saying "I forgot my badge, I\'m new."', correct:'Politely ask them to sign in at reception and get a visitor badge', wrong:'Hold the door open for them' },
    { scene:'An email says "You\'ve won an iPhone! Click to claim." The link goes to apple-prize-claims.com', correct:'Delete the email — this is phishing', wrong:'Click the link to see if it\'s real' },
  ];
  let idx = 0, score = 0;
  const render = () => {
    if (idx >= scenarios.length) {
      playSound('levelup'); S.xp += score * 15; saveState();
      content.innerHTML = `<div style="text-align:center; padding:40px;"><h2 style="color:var(--c-green);">Gauntlet Complete! ${score}/${scenarios.length} correct! +${score*15} XP</h2></div>`;
      showToast(`Gauntlet: +${score*15} XP!`, 'ok'); return;
    }
    const sc = scenarios[idx];
    content.innerHTML = `
      <div style="max-width:580px; margin:0 auto; padding:20px;">
        <div style="font-size:0.72rem; color:var(--c-text-dim); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Scenario ${idx+1} of ${scenarios.length}</div>
        <p style="font-size:1rem; line-height:1.7; color:var(--c-text); margin-bottom:20px;">${sc.scene}</p>
        <div class="col" style="gap:10px;">
          <button class="quiz-opt" onclick="socialAns(true)">${sc.correct}</button>
          <button class="quiz-opt" onclick="socialAns(false)">${sc.wrong}</button>
        </div>
      </div>`;
    window.socialAns = (isCorrect) => {
      if (isCorrect) { score++; playSound('success'); showToast('Correct! Good instinct.', 'ok'); }
      else { playSound('error'); showToast('Incorrect! Never bypass verification.', 'err'); }
      idx++; render();
    };
  };
  render();
}

/* ══════════════════════════════════════════════════════════════
   TERMINAL ENGINE
══════════════════════════════════════════════════════════════ */
let termHistory = [];
let termHistIdx = -1;

const TERM_COMMANDS = {
  help: () => {
    printTerm([
      { t:'info', html:'<b>═══ CYBERZERO NEURAL TERMINAL — COMMAND REFERENCE ═══</b>' },
      { t:'info', html:'<b>profile</b> / stats — View your operative status' },
      { t:'info', html:'<b>lesson [1-22]</b> — Study any module\'s core concept' },
      { t:'info', html:'<b>quiz [1-22] [a-d]</b> — Answer a quiz in terminal mode' },
      { t:'info', html:'<b>scan</b> — Run simulated nmap port scan' },
      { t:'info', html:'<b>whois [domain]</b> — WHOIS domain lookup simulation' },
      { t:'info', html:'<b>hash [text]</b> — Generate SHA-256 hash' },
      { t:'info', html:'<b>name [callsign]</b> — Change operative callsign' },
      { t:'info', html:'<b>avatar [emoji]</b> — Change operative avatar' },
      { t:'info', html:'<b>hint</b> — Random cybersecurity survival tip' },
      { t:'info', html:'<b>clear</b> / cls — Clear terminal screen' },
      { t:'out',  html:'────────────────────────────────────────────────────────' },
    ]);
  },
  profile: () => {
    const b = S.badges.filter(Boolean).length;
    printTerm([
      { t:'info', html:`<b>══ OPERATIVE TELEMETRY ══</b>` },
      { t:'out',  html:`Avatar: ${S.avatar}  |  Callsign: <b>${S.name}</b>` },
      { t:'out',  html:`Level: ${S.level}  |  XP: ${S.xp}  |  Combo: ${S.combo}×` },
      { t:'out',  html:`Badges: ${b}/22  |  Bosses: ${S.bosses.filter(Boolean).length}/4` },
      { t:'out',  html:`Rank: ${getRank(b, S.bosses.filter(Boolean).length)}` },
    ]);
  },
  scan: () => {
    printTerm([{ t:'info', html:'Starting Nmap 7.94 — Neural Defense Grid' }]);
    setTimeout(() => {
      printTerm([
        { t:'out', html:'Scanning 192.168.1.1...' },
        { t:'ok',  html:'443/tcp open  https' },
        { t:'ok',  html:'22/tcp  open  ssh   (restricted to 10.0.0.0/8)' },
        { t:'err', html:'3306/tcp open mysql  ← RISK: Exposed to internet!' },
        { t:'out', html:'Scan completed. 3 ports open. Recommend closing 3306.' },
      ]);
    }, 800);
  },
  hint: () => {
    const hints = [
      '💡 Air-gapped backups are the ONLY ransomware-proof defense. Disconnect that USB drive!',
      '💡 Check sender domains — not display names. Attackers can set any display name.',
      '💡 A password manager + unique passwords + 2FA = 99% of attacks blocked.',
      '💡 CVSS 9.0+ with known exploit = patch in 24 hours. No exceptions.',
      '💡 Never connect to open Wi-Fi without a VPN. Your traffic is visible to anyone.',
      '💡 SQL injection is still the #1 web vulnerability. Always use parameterized queries.',
    ];
    const tip = hints[Math.floor(Math.random() * hints.length)];
    printTerm([{ t:'info', html: tip }]);
  },
  clear: () => clearTerm(),
  cls:   () => clearTerm(),
};

function termKeyDown(e) {
  const input = document.getElementById('term-input');
  if (!input) return;

  if (e.key === 'Enter') { termSubmit(); return; }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (termHistIdx < termHistory.length - 1) { termHistIdx++; input.value = termHistory[termHistory.length - 1 - termHistIdx] || ''; }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (termHistIdx > 0) { termHistIdx--; input.value = termHistory[termHistory.length - 1 - termHistIdx] || ''; }
    else { termHistIdx = -1; input.value = ''; }
    return;
  }
  if (e.ctrlKey && e.key === 'l') { e.preventDefault(); clearTerm(); }
  if (e.key === 'Tab') {
    e.preventDefault();
    const val = input.value.trim().toLowerCase();
    const match = Object.keys(TERM_COMMANDS).find(cmd => cmd.startsWith(val));
    if (match) input.value = match;
  }
}

function termRun(cmd) {
  const input = document.getElementById('term-input');
  if (input) input.value = cmd;
  termSubmit();
}

function termSubmit() {
  const input = document.getElementById('term-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;
  input.value = '';
  termHistIdx = -1;
  termHistory.push(raw);
  if (termHistory.length > 50) termHistory.shift();

  playSound('click');
  printTerm([{ t:'prompt', html: raw }]);

  const parts = raw.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (TERM_COMMANDS[cmd]) {
    TERM_COMMANDS[cmd](args);
    return;
  }

  // Extended commands
  if (cmd === 'lesson') {
    const modId = parseInt(args[0]);
    const mod = modId >= 1 && modId <= 22 ? CURRICULUM.find(m => m.id === modId) : null;
    if (mod) {
      printTerm([
        { t:'info', html:`<b>📖 LESSON #${mod.id}: ${mod.icon} ${mod.name.toUpperCase()}</b>` },
        { t:'out',  html:`Analogy: ${mod.analogy}` },
        { t:'info', html:`→ Type <b>quiz ${mod.id} [a-d]</b> to earn +30 XP!` },
      ]);
    } else {
      printTerm([{ t:'err', html:`Usage: lesson [1-22]` }]);
    }
    return;
  }

  if (cmd === 'quiz') {
    const modId = parseInt(args[0]);
    const ans = (args[1] || '').toLowerCase();
    const mod = modId >= 1 && modId <= 22 ? CURRICULUM.find(m => m.id === modId) : null;
    if (mod && ['a','b','c','d'].includes(ans)) {
      const selectedIdx = ['a','b','c','d'].indexOf(ans);
      const isCorrect = selectedIdx === mod.quiz.correct;
      if (isCorrect) {
        playSound('levelup'); S.xp += 30; S.badges[modId-1] = true; saveState();
        printTerm([{ t:'ok', html:`✅ CORRECT! +30 XP! Badge #${modId} unlocked! Combo: ${++S.combo}×` }]);
      } else {
        playSound('error'); S.combo = 0; saveState();
        printTerm([{ t:'err', html:`❌ INCORRECT! Correct answer: ${['A','B','C','D'][mod.quiz.correct]}. Type <b>lesson ${modId}</b> to review.` }]);
      }
    } else {
      printTerm([{ t:'err', html:`Usage: quiz [1-22] [a|b|c|d]  e.g.: quiz 1 c` }]);
    }
    return;
  }

  if (cmd === 'hash') {
    const text = args.join(' ') || 'CyberZero';
    const hash = simulateSHA256(text);
    printTerm([{ t:'ok', html:`SHA-256("${text}") = <b>${hash}</b>` }]);
    return;
  }

  if (cmd === 'whois') {
    const domain = args[0] || 'example.com';
    printTerm([
      { t:'info', html:`WHOIS: ${domain}` },
      { t:'out',  html:`Registrar: Cloudflare, Inc.` },
      { t:'out',  html:`Registered: 2020-03-14T00:00:00Z` },
      { t:'out',  html:`Nameservers: ns1.cloudflare.com, ns2.cloudflare.com` },
      { t:'out',  html:`DNSSEC: Enabled` },
    ]);
    return;
  }

  if (cmd === 'name') {
    const newName = args.join(' ');
    if (newName) { S.name = newName; saveState(); printTerm([{ t:'ok', html:`Callsign updated to: <b>${S.name}</b>` }]); }
    else printTerm([{ t:'err', html:`Usage: name [your_callsign]` }]);
    return;
  }

  if (cmd === 'avatar') {
    const icon = args[0]; if (icon) { S.avatar = icon; saveState(); updateAllAvatars(); printTerm([{ t:'ok', html:`Avatar updated: ${icon}` }]); }
    else printTerm([{ t:'err', html:`Usage: avatar [emoji]` }]);
    return;
  }

  printTerm([{ t:'err', html:`Command not found: "${raw}". Type <b>help</b> for available commands.` }]);
}

function printTerm(lines) {
  const screen = document.getElementById('term-screen');
  if (!screen) return;
  lines.forEach(({ t, html }) => {
    const div = document.createElement('div');
    const label = document.getElementById('term-prompt')?.textContent || 'cyberzero(cadet) » ';
    if (t === 'prompt') {
      div.innerHTML = `<span style="color:var(--c-cyan); font-weight:600;">${label}</span><span style="color:var(--c-yellow);">${html}</span>`;
    } else {
      div.className = `term-out ${t === 'ok' ? 'ok' : t === 'err' ? 'err' : t === 'info' ? 'info' : ''}`;
      div.innerHTML = html;
    }
    screen.appendChild(div);
  });
  screen.scrollTop = screen.scrollHeight;
}

function clearTerm() {
  const screen = document.getElementById('term-screen');
  if (!screen) return;
  screen.innerHTML = `
    <div class="term-out info">CyberZero Neural Terminal v3.0 — Session cleared.</div>
    <div class="term-out" style="color:var(--c-text-dim)">Type <b>help</b> for commands.</div>
  `;
  playSound('click');
}

/* ══════════════════════════════════════════════════════════════
   CY-BOT
══════════════════════════════════════════════════════════════ */
function toggleCybot() {
  playSound('click');
  const panel = document.getElementById('cybot-panel');
  const backdrop = document.getElementById('cybot-backdrop');
  if (!panel || !backdrop) return;
  const isOpen = panel.classList.toggle('open');
  backdrop.classList.toggle('show', isOpen);
  if (isOpen) document.getElementById('cybot-input')?.focus();
}

function cybotSend() {
  const input = document.getElementById('cybot-input');
  const messages = document.getElementById('cybot-messages');
  if (!input || !messages) return;
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  playSound('click');

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'cybot-msg msg-user';
  userMsg.textContent = query;
  messages.appendChild(userMsg);

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'cybot-msg msg-bot msg-typing';
  typing.textContent = '🤖 Analyzing...';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const match = matchCybotTopic(query);
    const reply = match
      ? `<b>🤖 ${match.title}:</b><br>${match.response.replace(/\n/g,'<br>')}`
      : `<b>🤖 Cy-Bot:</b> I'm trained on all 22 modules! Ask me about: phishing, VPN, 2FA, SQL injection, zero-day patches, ransomware, firewalls, XSS, or any cybersecurity topic.`;

    const botMsg = document.createElement('div');
    botMsg.className = 'cybot-msg msg-bot';
    botMsg.innerHTML = reply;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
    playSound('success');
  }, 400);
}

function askCybotModule() {
  toggleCybot();
  const help = getCybotModuleHelp(S.currentModId);
  if (!help) return;
  const messages = document.getElementById('cybot-messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.className = 'cybot-msg msg-bot';
  msg.innerHTML = `<b>🤖 ${help.title}:</b><br>${help.response.replace(/\n/g,'<br>')}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
  playSound('success');
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════════════════ */
function toggleSettings() {
  playSound('click');
  const modal = document.getElementById('settings-modal');
  const bg    = document.getElementById('settings-modal-bg');
  if (!modal) return;
  const show = !modal.classList.contains('show');
  modal.classList.toggle('show', show);
  if (bg) bg.classList.toggle('show', show);
}

function setTheme(name) {
  playSound('click');
  S.theme = name;
  document.documentElement.setAttribute('data-theme', name);
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.id === `swatch-${name}`));
  saveState();
}

function toggleSound() {
  S.sound = !S.sound;
  const toggle = document.getElementById('sound-toggle');
  if (toggle) toggle.className = `toggle-switch ${S.sound ? 'on' : ''}`;
  playSound('success');
  saveState();
  showToast(S.sound ? 'Mechanical sounds enabled' : 'Sounds disabled', 'info');
}

/* ══════════════════════════════════════════════════════════════
   COMMAND PALETTE
══════════════════════════════════════════════════════════════ */
const PALETTE_ITEMS = [
  { icon:'🏠', text:'Go to Home Base', hint:'view', action:() => switchView('home') },
  { icon:'📡', text:'Open Training Modules', hint:'view', action:() => switchView('training') },
  { icon:'🎮', text:'Open Cyber Arcade', hint:'view', action:() => switchView('arcade') },
  { icon:'💻', text:'Open Hacker Terminal', hint:'view', action:() => switchView('terminal') },
  { icon:'👤', text:'Open My Profile', hint:'view', action:() => switchView('profile') },
  { icon:'🏆', text:'Open Trophy Room', hint:'view', action:() => switchView('trophies') },
  { icon:'🤖', text:'Open Cy-Bot Mentor', hint:'assistant', action:() => toggleCybot() },
  { icon:'⚙️', text:'Open Settings', hint:'settings', action:() => toggleSettings() },
  { icon:'🔄', text:'Reset All Progress', hint:'danger', action:() => { closePalette(); resetProgress(); } },
  ...CURRICULUM.map(m => ({
    icon: m.icon,
    text: `Module #${m.id}: ${m.name}`,
    hint: `Phase ${m.phase} · ${m.difficulty}`,
    action: () => { switchView('training'); setTimeout(() => openModule(m.id), 100); }
  }))
];

let paletteFocusIdx = 0;

function openCommandPalette() {
  const palette = document.getElementById('cmd-palette');
  const input = document.getElementById('cmd-palette-input');
  if (!palette) return;
  palette.classList.add('show');
  input?.focus();
  filterPalette();
  playSound('click');
}

function closePalette() {
  document.getElementById('cmd-palette')?.classList.remove('show');
}

function filterPalette() {
  const query = (document.getElementById('cmd-palette-input')?.value || '').toLowerCase();
  const results = PALETTE_ITEMS.filter(i => i.text.toLowerCase().includes(query) || i.hint.toLowerCase().includes(query)).slice(0, 12);
  paletteFocusIdx = 0;
  const el = document.getElementById('cmd-results');
  if (!el) return;
  el.innerHTML = results.map((item, idx) => `
    <div class="cmd-result-item ${idx === paletteFocusIdx ? 'focused' : ''}" onclick="runPaletteItem(${idx})" data-idx="${idx}">
      <span class="cmd-result-icon">${item.icon}</span>
      <span class="cmd-result-text">${item.text}</span>
      <span class="cmd-result-hint">${item.hint}</span>
    </div>
  `).join('');
  el._items = results;
}

function palettKeyNav(e) {
  const el = document.getElementById('cmd-results');
  if (!el || !el._items) return;
  const items = el.querySelectorAll('.cmd-result-item');
  if (e.key === 'ArrowDown') { paletteFocusIdx = Math.min(paletteFocusIdx + 1, items.length - 1); }
  if (e.key === 'ArrowUp')   { paletteFocusIdx = Math.max(paletteFocusIdx - 1, 0); }
  if (e.key === 'Enter') { runPaletteItem(paletteFocusIdx); return; }
  if (e.key === 'Escape') { closePalette(); return; }
  items.forEach((item, idx) => item.classList.toggle('focused', idx === paletteFocusIdx));
}

function runPaletteItem(idx) {
  const el = document.getElementById('cmd-results');
  if (!el?._items?.[idx]) return;
  closePalette();
  el._items[idx].action();
}

/* ══════════════════════════════════════════════════════════════
   PROFILE / TROPHIES / AVATAR
══════════════════════════════════════════════════════════════ */
function renderTrophies() {
  const el = id => document.getElementById(id);
  const badgeCount = S.badges.filter(Boolean).length;
  const bossCount  = S.bosses.filter(Boolean).length;

  S.level = Math.floor(S.xp / 100) + 1;
  const rank = getRank(badgeCount, bossCount);

  if (el('profile-avatar')) el('profile-avatar').textContent = S.avatar;
  if (el('sidebar-avatar')) el('sidebar-avatar').textContent = S.avatar;
  if (el('profile-name'))   el('profile-name').textContent = `Operative ${S.name}`;
  if (el('profile-rank'))   el('profile-rank').textContent = `Level ${S.level} — ${rank}`;
  if (el('profile-xp-label')) el('profile-xp-label').textContent = `${S.xp} XP`;
  if (el('profile-next-label')) el('profile-next-label').textContent = `→ Level ${S.level+1}: ${S.level * 100} XP`;
  if (el('profile-xp-bar')) el('profile-xp-bar').style.width = `${(S.xp % 100)}%`;

  if (el('callsign-input')) el('callsign-input').value = S.name;

  if (el('stat-xp'))     el('stat-xp').textContent = S.xp;
  if (el('stat-combo'))  el('stat-combo').textContent = `${S.combo}×`;
  if (el('stat-badges')) el('stat-badges').textContent = `${badgeCount}/22`;
  if (el('stat-bosses')) el('stat-bosses').textContent = `${bossCount}/4`;
  if (el('stat-level'))  el('stat-level').textContent = S.level;

  // Avatar grid
  const avatarGrid = el('avatar-grid');
  if (avatarGrid) {
    const avatars = ['🛡️','🤖','🤠','🕶️','🐉','👑','🚀','⚡','🧠','🔐','🔥','💎'];
    avatarGrid.innerHTML = avatars.map(a => `
      <button class="avatar-btn ${S.avatar === a ? 'selected' : ''}" onclick="equipAvatar('${a}')">${a}</button>
    `).join('');
  }

  // Trophy grid
  const trophyGrid = el('trophy-grid');
  if (trophyGrid) {
    trophyGrid.innerHTML = CURRICULUM.map(mod => {
      const earned = S.badges[mod.id - 1];
      return `
        <div class="trophy-tile ${earned ? 'earned' : ''}">
          <div class="trophy-icon">${earned ? mod.icon : '🔒'}</div>
          <div class="trophy-name">#${mod.id}: ${mod.name}</div>
          <div class="trophy-status">${earned ? '🏆 Badge Earned' : 'Locked'}</div>
        </div>
      `;
    }).join('');
  }

  // Diploma
  if (badgeCount >= 22 && bossCount >= 4) {
    const dip = el('diploma');
    if (dip) dip.classList.add('show');
    setEl('diploma-name', `Operative ${S.name}`);
    setEl('diploma-avatar', S.avatar);
    setEl('diploma-date', `Certified on ${new Date().toLocaleDateString()} by CyberZero Neural Defense Grid`);
  }
}

function equipAvatar(icon) {
  playSound('success');
  S.avatar = icon;
  updateAllAvatars();
  saveState();
  renderTrophies();
  showToast(`Avatar updated to ${icon}`, 'ok');
}

function updateCallsign() {
  const input = document.getElementById('callsign-input');
  const val = input?.value.trim();
  if (val) { S.name = val; saveState(); renderTrophies(); updateHomeView(); showToast(`Callsign updated to Operative ${val}`, 'ok'); }
}

function updateAllAvatars() {
  ['sidebar-avatar','home-avatar','profile-avatar','banner-avatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = S.avatar;
  });
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR (MOBILE)
══════════════════════════════════════════════════════════════ */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar?.classList.toggle('open');
  overlay?.classList.toggle('show', isOpen);
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

/* ══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePalette();
    if (document.getElementById('cybot-panel')?.classList.contains('open')) toggleCybot();
    if (document.getElementById('settings-modal')?.classList.contains('show')) toggleSettings();
    if (S.currentModId > 0) backToGrid();
  }
  if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openCommandPalette(); }
  if (e.ctrlKey && e.key === '/') { e.preventDefault(); toggleCybot(); }
  if (e.ctrlKey && e.key === 't') { e.preventDefault(); switchView('terminal'); }
});

/* Hover sounds */
document.addEventListener('mouseover', (e) => {
  const t = e.target;
  if (t.tagName === 'BUTTON' || t.classList.contains('mod-card') || t.classList.contains('quiz-opt') || t.classList.contains('nav-item')) {
    playSound('hover');
  }
});

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */
function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function id(el) { return document.getElementById(el); }

/* ══════════════════════════════════════════════════════════════
   INITIALISATION
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Apply saved theme
  document.documentElement.setAttribute('data-theme', S.theme);
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.id === `swatch-${S.theme}`));

  // Sound toggle state
  const st = document.getElementById('sound-toggle');
  if (st) st.className = `toggle-switch ${S.sound ? 'on' : ''}`;

  // Initialize terminal prompt
  const tPrompt = document.getElementById('term-prompt');
  if (tPrompt) tPrompt.textContent = `⚡ cyberzero(${S.name.toLowerCase().replace(/\s/g,'_')}) » `;

  // Update session label
  const tLabel = document.getElementById('term-session-label');
  if (tLabel) tLabel.textContent = `cyberzero@neural-grid — ${S.name}`;

  // Load initial view
  switchView(S.currentView || 'home');

  // Update module count badge
  const badgeEl = document.getElementById('nav-badge-training');
  if (badgeEl) badgeEl.textContent = S.badges.filter(Boolean).length || '22';
});
