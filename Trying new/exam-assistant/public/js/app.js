// ExamLens - Frontend Application Logic

(function () {
  'use strict';

  // State
  let currentMode = 'survival'; // 'survival' | 'comprehensive'
  let currentAnalysis = null;
  let sampleDatasets = null;
  let activeFilter = 'all';
  let searchQuery = '';
  let selectedTopicId = null;

  // DOM Elements
  const btnModeSurvival = document.getElementById('btnModeSurvival');
  const btnModeComprehensive = document.getElementById('btnModeComprehensive');
  const btnToggleTheme = document.getElementById('btnToggleTheme');
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const bannerSubjectTitle = document.getElementById('bannerSubjectTitle');
  const bannerSubjectSubtitle = document.getElementById('bannerSubjectSubtitle');
  const btnBannerLoadOS = document.getElementById('btnBannerLoadOS');
  const btnBannerLoadDBMS = document.getElementById('btnBannerLoadDBMS');
  const btnQuickSample = document.getElementById('btnQuickSample');

  const topicsContainer = document.getElementById('topicsContainer');
  const topicSearchInput = document.getElementById('topicSearchInput');
  const filterButtons = document.querySelectorAll('.filter-tag-btn');
  const showingTopicsLabel = document.getElementById('showingTopicsLabel');
  const btnJumpToSurvival = document.getElementById('btnJumpToSurvival');

  // Stats
  const statUnits = document.getElementById('statUnits');
  const statTopics = document.getElementById('statTopics');
  const statPyqs = document.getElementById('statPyqs');
  const statHistoricalMarks = document.getElementById('statHistoricalMarks');
  const statCriticalTopics = document.getElementById('statCriticalTopics');
  const paretoDescription = document.getElementById('paretoDescription');
  const badgeTopicsCount = document.getElementById('badgeTopicsCount');

  // Survival
  const survivalTimelineContainer = document.getElementById('survivalTimelineContainer');
  const btnPrintSurvivalPlan = document.getElementById('btnPrintSurvivalPlan');

  // Masterclass
  const topicDropdownSelector = document.getElementById('topicDropdownSelector');
  const masterclassStudyContent = document.getElementById('masterclassStudyContent');
  const btnStudyFirstCritical = document.getElementById('btnStudyFirstCritical');

  // Grader
  const graderQuestionSelect = document.getElementById('graderQuestionSelect');
  const graderQuestionText = document.getElementById('graderQuestionText');
  const graderMaxMarks = document.getElementById('graderMaxMarks');
  const graderStudentAnswer = document.getElementById('graderStudentAnswer');
  const btnEvaluateAnswer = document.getElementById('btnEvaluateAnswer');
  const graderResultContainer = document.getElementById('graderResultContainer');

  // Predicted Paper
  const predictedPaperContainer = document.getElementById('predictedPaperContainer');
  const btnRegeneratePaper = document.getElementById('btnRegeneratePaper');

  // Upload Studio
  const syllabusFileInput = document.getElementById('syllabusFileInput');
  const syllabusDropzone = document.getElementById('syllabusDropzone');
  const syllabusTextarea = document.getElementById('syllabusTextarea');
  const pyqFileInput = document.getElementById('pyqFileInput');
  const pyqDropzone = document.getElementById('pyqDropzone');
  const pyqsTextarea = document.getElementById('pyqsTextarea');
  const btnRunCustomAnalysis = document.getElementById('btnRunCustomAnalysis');

  // --- INITIALIZATION ---
  async function init() {
    setupTheme();
    setupNavigation();
    setupEventListeners();
    await loadSampleDatasets();

    // Auto-load Operating Systems dataset so the dashboard is instantly live
    if (sampleDatasets && sampleDatasets.operatingSystems) {
      loadSubjectDataset(sampleDatasets.operatingSystems);
    }
  }

  // --- THEME MANAGEMENT ---
  function setupTheme() {
    const savedTheme = localStorage.getItem('examlens_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  btnToggleTheme.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('examlens_theme', next);
  });

  // --- NAVIGATION & TABS ---
  function setupNavigation() {
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTabId = tab.getAttribute('data-tab');
        switchTab(targetTabId);
      });
    });
  }

  function switchTab(targetTabId) {
    navTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === targetTabId);
    });

    tabPanes.forEach(pane => {
      pane.style.display = pane.id === targetTabId ? 'block' : 'none';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- MODE SWITCHER ---
  btnModeSurvival.addEventListener('click', () => {
    currentMode = 'survival';
    btnModeSurvival.className = 'mode-btn active-survival';
    btnModeComprehensive.className = 'mode-btn';
    if (selectedTopicId) {
      loadTopicGuide(selectedTopicId);
    }
  });

  btnModeComprehensive.addEventListener('click', () => {
    currentMode = 'comprehensive';
    btnModeComprehensive.className = 'mode-btn active-comprehensive';
    btnModeSurvival.className = 'mode-btn';
    if (selectedTopicId) {
      loadTopicGuide(selectedTopicId);
    }
  });

  // --- DATA LOADING & ANALYTICS ---
  async function loadSampleDatasets() {
    try {
      const res = await fetch('/api/sample-datasets');
      const data = await res.json();
      if (data.success) {
        sampleDatasets = data.datasets;
      }
    } catch (err) {
      console.error('Failed to load sample datasets', err);
    }
  }

  async function loadSubjectDataset(dataset) {
    bannerSubjectTitle.textContent = dataset.title;
    bannerSubjectSubtitle.textContent = `Active Subject: ${dataset.subject}. Analyzing syllabus cross-referenced against historical PYQ examination papers.`;

    syllabusTextarea.value = dataset.syllabus;
    pyqsTextarea.value = dataset.pyqs;

    await executeAnalysis(dataset.syllabus, dataset.pyqs);
  }

  async function executeAnalysis(syllabusText, pyqsText) {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText, pyqsText })
      });

      const json = await res.json();
      if (!json.success) {
        alert('Error: ' + json.error);
        return;
      }

      currentAnalysis = json.data;
      renderAnalysisDashboard();
      renderSurvivalTimeline();
      populateTopicSelectors();
      populateGraderQuestionDropdown();
      renderPredictedPaper();

      // If user is on upload tab, return them to priority heatmap
      switchTab('tab-intelligence');
    } catch (err) {
      console.error('Analysis request failed', err);
      alert('Could not complete analysis: ' + err.message);
    }
  }

  // --- RENDER INTELLIGENCE & HEATMAP ---
  function renderAnalysisDashboard() {
    if (!currentAnalysis) return;

    const { summary, topics } = currentAnalysis;

    statUnits.textContent = `${summary.totalUnits} Units`;
    statTopics.textContent = `${summary.totalTopics} discrete topics parsed`;
    statPyqs.textContent = `${summary.totalQuestionsAnalyzed} Questions`;
    statHistoricalMarks.textContent = `${summary.totalHistoricalMarks} marks analyzed`;
    statCriticalTopics.textContent = `${summary.survivalTopicCount} Topics`;

    paretoDescription.innerHTML = `Based on historical question recurrence, <strong>top ${summary.paretoTopicCount} topics (${summary.paretoPercentage}% of syllabus)</strong> account for over <strong>75% of total exam marks</strong>. Focus on these first!`;
    badgeTopicsCount.textContent = `${summary.totalTopics} Topics`;

    renderTopicCards();
  }

  function renderTopicCards() {
    if (!currentAnalysis) return;

    const filtered = currentAnalysis.topics.filter(t => {
      // Tier filter
      if (activeFilter === 'critical' && t.yieldTier !== 'SURVIVAL_CRITICAL') return false;
      if (activeFilter === 'important' && t.yieldTier !== 'IMPORTANT') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesUnit = t.unitTitle.toLowerCase().includes(q);
        const matchesQuestions = t.matchedQuestions.some(item => item.question.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUnit && !matchesQuestions) return false;
      }

      return true;
    });

    showingTopicsLabel.textContent = `Showing ${filtered.length} of ${currentAnalysis.topics.length} topics`;

    topicsContainer.innerHTML = '';

    if (filtered.length === 0) {
      topicsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          No topics matched your search criteria.
        </div>
      `;
      return;
    }

    filtered.forEach(topic => {
      const card = document.createElement('div');
      const tierClass = topic.yieldTier === 'SURVIVAL_CRITICAL' ? 'survival-critical' : topic.yieldTier === 'IMPORTANT' ? 'important' : '';
      card.className = `topic-card ${tierClass}`;

      let pillText = 'Low Return';
      let pillClass = 'low';
      let fillClass = 'low';

      if (topic.yieldTier === 'SURVIVAL_CRITICAL') {
        pillText = '⚡ Survival Critical';
        pillClass = 'critical';
        fillClass = 'critical';
      } else if (topic.yieldTier === 'IMPORTANT') {
        pillText = 'High Probability';
        pillClass = 'important';
        fillClass = 'important';
      }

      card.innerHTML = `
        <div>
          <div class="topic-header">
            <span class="topic-unit-badge">${escapeHtml(topic.unitTitle)}</span>
            <span class="yield-pill ${pillClass}">${pillText}</span>
          </div>
          <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
        </div>

        <div>
          <div class="topic-stats">
            <div class="topic-stat-item">
              <span>PYQs:</span>
              <strong>${topic.appearanceCount} times</strong>
            </div>
            <div class="topic-stat-item">
              <span>Marks:</span>
              <strong>${topic.totalMarks} M</strong>
            </div>
          </div>

          <div class="hit-rate-bar-container">
            <div class="hit-rate-header">
              <span>Exam Hit Rate:</span>
              <strong style="font-family: var(--font-mono);">${topic.hitRatePercent}%</strong>
            </div>
            <div class="hit-rate-bar">
              <div class="hit-rate-fill ${fillClass}" style="width: ${topic.hitRatePercent}%;"></div>
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openTopicMasterclass(topic.id);
      });

      topicsContainer.appendChild(card);
    });
  }

  // --- RENDER SURVIVAL ONE-NIGHTER TIMELINE ---
  function renderSurvivalTimeline() {
    if (!currentAnalysis || !currentAnalysis.survivalPlan) return;

    const { mustDoTopics, totalAvailableHours, allocatedMinutesPerTopic } = currentAnalysis.survivalPlan;
    survivalTimelineContainer.innerHTML = '';

    mustDoTopics.forEach((topic, idx) => {
      const card = document.createElement('div');
      card.className = 'survival-card';

      card.innerHTML = `
        <div class="survival-time-block">
          <div class="survival-minutes">${topic.suggestedMinutes}m</div>
          <div class="survival-label">Step ${idx + 1}</div>
        </div>

        <div class="survival-body">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 0.2rem;">
            ${escapeHtml(topic.unitTitle)} &bull; Hit Rate: ${topic.hitRate}%
          </div>
          <h4>${escapeHtml(topic.title)}</h4>
          <p>Historical weightage: <strong>${topic.totalMarks} marks</strong> across past papers. Focus strictly on definition, block diagram, and numerical steps.</p>
        </div>

        <div>
          <button class="btn-primary" data-topic-id="${topic.id}">
            <span>⚡ Study Now</span>
          </button>
        </div>
      `;

      card.querySelector('button').addEventListener('click', () => {
        openTopicMasterclass(topic.id);
      });

      survivalTimelineContainer.appendChild(card);
    });
  }

  // --- TOPIC MASTERCLASS & STUDY GUIDE ---
  function populateTopicSelectors() {
    if (!currentAnalysis) return;

    topicDropdownSelector.innerHTML = '<option value="">Select a topic to study...</option>';

    currentAnalysis.topics.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.yieldTier === 'SURVIVAL_CRITICAL' ? '⚡ ' : ''}${t.title} (${t.unitTitle})`;
      topicDropdownSelector.appendChild(opt);
    });
  }

  topicDropdownSelector.addEventListener('change', (e) => {
    if (e.target.value) {
      openTopicMasterclass(e.target.value);
    }
  });

  function openTopicMasterclass(topicId) {
    selectedTopicId = topicId;
    topicDropdownSelector.value = topicId;
    switchTab('tab-masterclass');
    loadTopicGuide(topicId);
  }

  async function loadTopicGuide(topicId) {
    if (!currentAnalysis) return;

    const topic = currentAnalysis.topics.find(t => t.id === topicId);
    if (!topic) return;

    masterclassStudyContent.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <div style="font-family: var(--font-serif); font-size: 1.25rem;">Preparing examiner pedagogical guide for "${escapeHtml(topic.title)}"...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/topic-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: topic.title,
          unitTitle: topic.unitTitle,
          matchedQuestions: topic.matchedQuestions,
          mode: currentMode
        })
      });

      const data = await res.json();
      if (!data.success) {
        masterclassStudyContent.innerHTML = `<div class="card"><p>Failed to load guide: ${data.error}</p></div>`;
        return;
      }

      renderStudyGuideView(data.guide, topic);
    } catch (err) {
      masterclassStudyContent.innerHTML = `<div class="card"><p>Error: ${err.message}</p></div>`;
    }
  }

  function renderStudyGuideView(guide, topic) {
    if (guide.mode === 'one-nighter') {
      // One-Nighter format: Fast, bulletproof, zero fluff
      masterclassStudyContent.innerHTML = `
        <div class="study-drawer">
          <div class="study-header">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
                <span class="yield-pill critical">⚡ 1-Nighter Survival Mode</span>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${guide.readingTime}</span>
              </div>
              <h2 class="study-title">${escapeHtml(guide.topicTitle)}</h2>
              <div class="study-meta">
                <span>Unit: <strong>${escapeHtml(guide.unitTitle)}</strong></span>
                <span>Target Weightage: <strong>${guide.targetMarks}</strong></span>
                <span>Hit Rate: <strong>${topic.hitRatePercent}%</strong></span>
              </div>
            </div>
            <div>
              <button id="btnSwitchToDeepGuide" class="btn-outline" style="font-size: 0.8rem;">
                🎓 Switch to Deep Mode
              </button>
            </div>
          </div>

          <!-- Survival Summary -->
          <div class="card" style="background-color: var(--bg-secondary); margin-bottom: 1.5rem; border-left: 4px solid var(--accent-rust);">
            <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--accent-rust);">Examiner's Grading Strategy:</h4>
            <p style="font-size: 0.9rem; color: var(--text-main);">${escapeHtml(guide.survivalSummary)}</p>
          </div>

          <!-- Core Pillars -->
          <div style="margin-bottom: 1.5rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 1rem;">Core Pillars to Write in the Exam</h3>
            ${guide.corePillars.map(p => `
              <div class="study-pillar-card">
                <h4>${escapeHtml(p.title)}</h4>
                <p>${escapeHtml(p.content)}</p>
              </div>
            `).join('')}
          </div>

          <!-- Guaranteed Question Box -->
          <div class="guaranteed-q-box">
            <h4>⚡ Expected Exam Question & Bulletproof Answer Structure:</h4>
            <div class="guaranteed-q-text">"${escapeHtml(guide.guaranteedQuestion.prompt)}" (${guide.guaranteedQuestion.marks} Marks)</div>
            <ul class="bullet-proof-steps">
              ${guide.guaranteedQuestion.bulletProofAnswer.map(step => `
                <li>${step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
              `).join('')}
            </ul>
          </div>

          <!-- Fatal Mistakes -->
          <div class="card" style="background-color: var(--accent-crimson-soft); border-color: rgba(153, 27, 27, 0.25); margin-bottom: 1.5rem;">
            <h4 style="color: var(--accent-crimson); font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem;">⚠️ Fatal Mistakes That Cost 3-4 Marks:</h4>
            <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-main); display: flex; flex-direction: column; gap: 0.35rem;">
              ${guide.fatalMistakesToAvoid.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
            </ul>
          </div>

          <!-- Mnemonic -->
          <div class="card" style="background-color: var(--accent-ochre-soft); border-color: rgba(180, 83, 9, 0.25);">
            <h4 style="color: var(--accent-ochre); font-size: 0.95rem; font-weight: 700; margin-bottom: 0.3rem;">🧠 Examiner Mnemonic Cheat:</h4>
            <p style="font-size: 0.9rem; color: var(--text-main);">${guide.mnemonicOrMnemonicCheat.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
          </div>
        </div>
      `;

      document.getElementById('btnSwitchToDeepGuide')?.addEventListener('click', () => {
        btnModeComprehensive.click();
      });

    } else {
      // Comprehensive Mode
      masterclassStudyContent.innerHTML = `
        <div class="study-drawer">
          <div class="study-header">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
                <span class="yield-pill" style="background-color: var(--text-main); color: var(--bg-surface);">🎓 Comprehensive Prep</span>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">${guide.readingTime}</span>
              </div>
              <h2 class="study-title">${escapeHtml(guide.topicTitle)}</h2>
              <div class="study-meta">
                <span>Unit: <strong>${escapeHtml(guide.unitTitle)}</strong></span>
                <span>Historical Marks: <strong>${topic.totalMarks} Marks</strong></span>
              </div>
            </div>
            <div>
              <button id="btnSwitchToSurvivalGuide" class="btn-primary" style="font-size: 0.8rem;">
                ⚡ Switch to One-Nighter
              </button>
            </div>
          </div>

          <!-- Marking Scheme Breakdown -->
          <div style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 0.85rem;">Examiner's Official Marking Rubric</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              ${guide.markingSchemeBreakdown.map(rub => `
                <div class="card" style="padding: 1rem; background-color: var(--bg-secondary);">
                  <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-rust); font-weight: 700;">${escapeHtml(rub.marks)}</div>
                  <div style="font-weight: 600; font-size: 0.9rem; margin: 0.25rem 0;">${escapeHtml(rub.component)}</div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(rub.expectation)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Detailed Sections -->
          <div style="margin-bottom: 2rem;">
            <h3 style="font-family: var(--font-serif); font-size: 1.25rem; margin-bottom: 1rem;">Detailed Academic Exposition</h3>
            ${guide.detailedSections.map(sec => `
              <div class="study-pillar-card" style="background-color: var(--bg-surface);">
                <h4 style="font-size: 1.05rem; margin-bottom: 0.5rem;">${escapeHtml(sec.heading)}</h4>
                <p style="font-size: 0.925rem; line-height: 1.65;">${escapeHtml(sec.body)}</p>
              </div>
            `).join('')}
          </div>

          <!-- Past Year Questions -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="font-family: var(--font-serif); font-size: 1.15rem; margin-bottom: 1rem;">Past Questions on this Topic</h4>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${guide.pastYearExamQuestions.map(q => `
                <div style="padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; gap: 1rem;">
                  <div>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--accent-rust);">[${q.year}]</span>
                    <span style="font-size: 0.9rem; color: var(--text-main); margin-left: 0.4rem;">${escapeHtml(q.text)}</span>
                  </div>
                  <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; white-space: nowrap;">${q.marks} Marks</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      document.getElementById('btnSwitchToSurvivalGuide')?.addEventListener('click', () => {
        btnModeSurvival.click();
      });
    }
  }

  // --- ANSWER EVALUATOR & GRADER ---
  function populateGraderQuestionDropdown() {
    if (!currentAnalysis) return;

    graderQuestionSelect.innerHTML = '<option value="">-- Choose from analyzed PYQs or type custom --</option>';

    const allQuestions = [];
    currentAnalysis.topics.forEach(t => {
      t.matchedQuestions.forEach(q => {
        if (!allQuestions.some(existing => existing.question === q.question)) {
          allQuestions.push(q);
        }
      });
    });

    allQuestions.forEach(q => {
      const opt = document.createElement('option');
      opt.value = q.question;
      opt.textContent = `[${q.year} - ${q.marks}M] ${q.question.slice(0, 75)}...`;
      opt.dataset.marks = q.marks;
      graderQuestionSelect.appendChild(opt);
    });
  }

  graderQuestionSelect.addEventListener('change', (e) => {
    const selected = graderQuestionSelect.options[graderQuestionSelect.selectedIndex];
    if (selected && selected.value) {
      graderQuestionText.value = selected.value;
      if (selected.dataset.marks) {
        graderMaxMarks.value = selected.dataset.marks;
      }
    }
  });

  btnEvaluateAnswer.addEventListener('click', async () => {
    const questionText = graderQuestionText.value.trim();
    const studentAnswer = graderStudentAnswer.value.trim();
    const maxMarks = parseInt(graderMaxMarks.value, 10);

    if (!studentAnswer) {
      alert('Please enter or paste your student answer before running evaluation.');
      return;
    }

    graderResultContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <div style="font-family: var(--font-serif); font-size: 1.25rem;">Applying examiner evaluation rubric...</div>
      </div>
    `;

    try {
      const res = await fetch('/api/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, studentAnswer, maxMarks })
      });

      const data = await res.json();
      if (!data.success) {
        graderResultContainer.innerHTML = `<div class="card"><p>Grading error: ${data.error}</p></div>`;
        return;
      }

      renderGraderResult(data.evaluation);
    } catch (err) {
      graderResultContainer.innerHTML = `<div class="card"><p>Error: ${err.message}</p></div>`;
    }
  });

  function renderGraderResult(evaluation) {
    const { awardedMarks, maxMarks, gradePercentage, verdict, rubricScores, examinerCritique, fullMarkRewrite } = evaluation;

    graderResultContainer.innerHTML = `
      <div class="score-display-card">
        <div class="score-header">
          <div>
            <div class="score-number">${awardedMarks} <span style="font-size: 1.25rem; color: var(--text-muted); font-weight: 500;">/ ${maxMarks}</span></div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Evaluated Score (${gradePercentage}%)</div>
          </div>
          <div>
            <div class="score-verdict">${verdict}</div>
          </div>
        </div>

        <!-- Rubric Breakdown -->
        <h4 style="font-family: var(--font-serif); font-size: 1.05rem; margin-bottom: 0.85rem;">Examiner Rubric Breakdown</h4>
        <div class="rubric-list">
          <div class="rubric-item">
            <div class="rubric-item-header">
              <span>Technical Accuracy & Keywords</span>
              <span style="font-family: var(--font-mono); color: var(--accent-rust);">${rubricScores.technicalAccuracy.score} / ${rubricScores.technicalAccuracy.max}</span>
            </div>
            <div class="rubric-item-comment">${escapeHtml(rubricScores.technicalAccuracy.comment)}</div>
          </div>

          <div class="rubric-item">
            <div class="rubric-item-header">
              <span>Structure, Headings & Diagrams</span>
              <span style="font-family: var(--font-mono); color: var(--accent-rust);">${rubricScores.structureAndDiagrams.score} / ${rubricScores.structureAndDiagrams.max}</span>
            </div>
            <div class="rubric-item-comment">${escapeHtml(rubricScores.structureAndDiagrams.comment)}</div>
          </div>

          <div class="rubric-item">
            <div class="rubric-item-header">
              <span>Completeness & Steps</span>
              <span style="font-family: var(--font-mono); color: var(--accent-rust);">${rubricScores.completeness.score} / ${rubricScores.completeness.max}</span>
            </div>
            <div class="rubric-item-comment">${escapeHtml(rubricScores.completeness.comment)}</div>
          </div>
        </div>

        <!-- Examiner Critique -->
        <div class="card" style="background-color: var(--accent-rust-soft); border-color: rgba(191, 76, 40, 0.2); margin-bottom: 1.25rem;">
          <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--accent-rust); text-transform: uppercase; margin-bottom: 0.3rem;">Where You Lost Marks:</h5>
          <p style="font-size: 0.875rem; color: var(--text-main);">${escapeHtml(examinerCritique)}</p>
        </div>

        <!-- Gold Standard Rewrite -->
        <div class="card" style="background-color: var(--bg-secondary);">
          <h5 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">Gold-Standard Answer Structure (${maxMarks}/${maxMarks} Benchmark)</h5>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${escapeHtml(fullMarkRewrite)}</div>
        </div>
      </div>
    `;
  }

  // --- PREDICTED QUESTION PAPER ---
  async function renderPredictedPaper() {
    if (!currentAnalysis) return;

    try {
      const res = await fetch('/api/predicted-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisData: currentAnalysis })
      });

      const data = await res.json();
      if (!data.success || !data.paper) return;

      const paper = data.paper;

      predictedPaperContainer.innerHTML = `
        <div class="paper-header">
          <div class="paper-institution">${escapeHtml(paper.examTitle)}</div>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.25rem;">
            Course: ${bannerSubjectTitle.textContent}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
            ${escapeHtml(paper.instruction)}
          </div>
          <div class="paper-meta-row">
            <span>Time Allowed: ${paper.durationHours} Hours</span>
            <span>Total Marks: ${paper.totalMarks} Marks</span>
          </div>
        </div>

        ${paper.sections.map(sec => `
          <div class="paper-section">
            <div class="paper-section-title">
              <span>${escapeHtml(sec.name)}</span>
              <span>[${sec.totalMarks} Marks]</span>
            </div>
            ${sec.questions.map(q => `
              <div class="paper-question-item">
                <div class="paper-q-body">
                  <strong>${q.qNo}.</strong> ${escapeHtml(q.question)}
                  <div class="paper-q-hint">💡 Examiner Tip: ${escapeHtml(q.hint)} (Recurrence Hit Rate: ${q.hitRate}%)</div>
                </div>
                <div class="paper-q-marks">[${q.marks} M]</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      `;
    } catch (err) {
      console.error('Failed to generate predicted paper', err);
    }
  }

  btnRegeneratePaper.addEventListener('click', () => {
    renderPredictedPaper();
  });

  // --- FILE UPLOADS & CUSTOM STUDIO ---
  function setupUploadDropzone(dropzone, input, textarea) {
    dropzone.addEventListener('click', () => input.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent-rust)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = '';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0], textarea, dropzone);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0], textarea, dropzone);
      }
    });
  }

  async function handleFileUpload(file, textarea, dropzone) {
    if (file.type === 'application/pdf') {
      dropzone.querySelector('.upload-icon').textContent = '⏳';
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          textarea.value = data.text;
          dropzone.querySelector('.upload-icon').textContent = '✅';
          dropzone.querySelector('div:nth-child(2)').textContent = `${file.name} (${data.pages} pages extracted)`;
        } else {
          alert('Could not parse PDF: ' + data.error);
          dropzone.querySelector('.upload-icon').textContent = '❌';
        }
      } catch (err) {
        alert('Upload error: ' + err.message);
        dropzone.querySelector('.upload-icon').textContent = '❌';
      }
    } else {
      // Plain text file
      const reader = new FileReader();
      reader.onload = (e) => {
        textarea.value = e.target.result;
        dropzone.querySelector('.upload-icon').textContent = '✅';
        dropzone.querySelector('div:nth-child(2)').textContent = file.name;
      };
      reader.readAsText(file);
    }
  }

  setupUploadDropzone(syllabusDropzone, syllabusFileInput, syllabusTextarea);
  setupUploadDropzone(pyqDropzone, pyqFileInput, pyqsTextarea);

  btnRunCustomAnalysis.addEventListener('click', () => {
    const syllabusText = syllabusTextarea.value.trim();
    const pyqsText = pyqsTextarea.value.trim();

    if (!syllabusText || !pyqsText) {
      alert('Please provide both syllabus and PYQs content (either upload PDFs or paste text).');
      return;
    }

    bannerSubjectTitle.textContent = 'Custom Uploaded Subject Analysis';
    bannerSubjectSubtitle.textContent = 'Analyzing user provided syllabus cross-referenced against historical PYQ examination papers.';
    executeAnalysis(syllabusText, pyqsText);
  });

  // --- BUTTON EVENT LISTENERS ---
  function setupEventListeners() {
    // Quick load buttons
    btnBannerLoadOS.addEventListener('click', () => {
      if (sampleDatasets?.operatingSystems) loadSubjectDataset(sampleDatasets.operatingSystems);
    });

    btnBannerLoadDBMS.addEventListener('click', () => {
      if (sampleDatasets?.dbms) loadSubjectDataset(sampleDatasets.dbms);
    });

    btnQuickSample.addEventListener('click', () => {
      if (sampleDatasets?.operatingSystems) loadSubjectDataset(sampleDatasets.operatingSystems);
    });

    btnJumpToSurvival.addEventListener('click', () => {
      btnModeSurvival.click();
      switchTab('tab-survival');
    });

    btnStudyFirstCritical.addEventListener('click', () => {
      if (currentAnalysis?.highYieldTopics?.[0]) {
        openTopicMasterclass(currentAnalysis.highYieldTopics[0].id);
      }
    });

    // Filters
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        renderTopicCards();
      });
    });

    topicSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTopicCards();
    });

    btnPrintSurvivalPlan.addEventListener('click', () => {
      window.print();
    });
  }

  // --- UTILS ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  init();
})();
