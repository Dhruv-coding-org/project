// ExamLens AI Agent - Client Controller

(function () {
  'use strict';

  // State
  let currentRequirement = 'one-nighter';
  let currentProvider = localStorage.getItem('examlens_provider') || 'ollama';
  let selectedOllamaModel = localStorage.getItem('examlens_ollama_model') || 'llama3.2:1b';
  let syllabusText = '';
  let syllabusFilename = '';
  let conversationHistory = [];
  let apiKey = localStorage.getItem('examlens_gemini_key') || '';
  let sampleDatasets = null;
  let ollamaInfo = { available: false, models: [] };

  // DOM Elements
  const activeDocPill = document.getElementById('activeDocPill');
  const activeDocName = document.getElementById('activeDocName');
  const btnLoadSampleSyllabus = document.getElementById('btnLoadSampleSyllabus');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnToggleTheme = document.getElementById('btnToggleTheme');

  const syllabusDropzone = document.getElementById('syllabusDropzone');
  const syllabusFileInput = document.getElementById('syllabusFileInput');
  const uploadFeedback = document.getElementById('uploadFeedback');
  const feedbackFilename = document.getElementById('feedbackFilename');
  const feedbackMeta = document.getElementById('feedbackMeta');

  const reqCards = document.querySelectorAll('.req-card');
  const currentPersonaLabel = document.getElementById('currentPersonaLabel');

  const unitsExplorerSection = document.getElementById('unitsExplorerSection');
  const unitsChipContainer = document.getElementById('unitsChipContainer');

  const chatContainer = document.getElementById('chatContainer');
  const quickChips = document.querySelectorAll('.quick-chip');
  const agentUserInput = document.getElementById('agentUserInput');
  const btnSendMessage = document.getElementById('btnSendMessage');

  // Modal
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const engineProviderSelect = document.getElementById('engineProviderSelect');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const ollamaStatusBadge = document.getElementById('ollamaStatusBadge');
  const ollamaModelsContainer = document.getElementById('ollamaModelsContainer');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Requirement labels
  const reqLabels = {
    'one-nighter': '⚡ One-Nighter Survival (80/20 Cram)',
    'comprehensive': '🎓 Deep Exam Masterclass',
    'eli5': "👶 Explain Like I'm 5 (Analogy First)",
    'quiz-me': '✍️ Mock Examiner Viva & Quiz',
    'cheat-sheet': '📝 Mnemonics & Rapid Cheat Sheet'
  };

  // --- INITIALIZATION ---
  async function init() {
    setupTheme();
    setupEventListeners();

    if (engineProviderSelect) {
      engineProviderSelect.value = currentProvider;
    }
    if (apiKeyInput && apiKey) {
      apiKeyInput.value = apiKey;
    }

    // Load sample datasets and auto-ingest immediately
    await fetchSampleDatasets();
    if (sampleDatasets?.operatingSystems) {
      ingestSyllabusText(
        sampleDatasets.operatingSystems.syllabus,
        'Operating_Systems_Syllabus.docx'
      );
    }

    // Check Ollama asynchronously in the background (zero blocking!)
    checkOllamaStatus().catch(() => {});
  }

  // --- OLLAMA STATUS CHECK ---
  async function checkOllamaStatus() {
    try {
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      ollamaInfo = data;

      if (ollamaStatusBadge) {
        if (data.available) {
          ollamaStatusBadge.innerHTML = `<span style="color: #10B981;">● Online (Local PC)</span>`;
          if (data.models && data.models.length > 0) {
            ollamaModelsContainer.innerHTML = `
              <div style="margin-top: 4px;">Detected Local Models: <strong>${data.models.join(', ')}</strong></div>
            `;
            if (!selectedOllamaModel) selectedOllamaModel = data.models[0];
          } else {
            ollamaModelsContainer.innerHTML = `
              <div style="margin-top: 4px; color: var(--accent-ochre);">Ollama is running, but no models found. Run: <code>ollama pull llama3.2</code></div>
            `;
          }
        } else {
          ollamaStatusBadge.innerHTML = `<span style="color: var(--text-muted);">○ Offline / Not Installed</span>`;
          ollamaModelsContainer.innerHTML = ``;
        }
      }
    } catch (e) {
      console.warn('Ollama check failed', e);
    }
  }

  // --- THEME ---
  function setupTheme() {
    const saved = localStorage.getItem('examlens_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }

  btnToggleTheme.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('examlens_theme', next);
  });

  // --- SAMPLE DATASETS ---
  async function fetchSampleDatasets() {
    try {
      const res = await fetch('/api/sample-datasets');
      const data = await res.json();
      if (data.success) {
        sampleDatasets = data.datasets;
      }
    } catch (e) {
      console.warn('Could not load sample datasets', e);
    }
  }

  // --- SYLLABUS INGESTION ---
  async function ingestSyllabusText(text, filename = 'Uploaded_Syllabus.docx') {
    syllabusText = text;
    syllabusFilename = filename;

    try {
      const res = await fetch('/api/set-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText, filename })
      });
      const data = await res.json();

      if (data.success) {
        activeDocPill.classList.add('active');
        activeDocName.textContent = `📄 ${filename} (${data.unitsCount} Units)`;

        uploadFeedback.style.display = 'block';
        feedbackFilename.textContent = filename;
        feedbackMeta.textContent = `${data.unitsCount} Units • ${data.topicsCount} Topics in agent memory`;

        renderUnitChips(data.units);

        chatContainer.innerHTML = '';
        conversationHistory = [];

        const engineNotice = ollamaInfo.available
          ? `(Running via **Local Ollama** on your computer's resources)`
          : apiKey ? `(Running via **Google Gemini Cloud**)` : `(Running via **Dynamic Syllabus Semantic Engine**)`;

        addAgentMessage(
          `### 👋 Private Exam Tutor Initialized!\n\n` +
          `I have ingested your entire syllabus: **${filename}** (${data.unitsCount} Units, ${data.topicsCount} discrete topics loaded).\n\n` +
          `**Active Mode:** \`${reqLabels[currentRequirement]}\` ${engineNotice}\n\n` +
          `Tell me what to teach you, or pick one of the quick prompts below (e.g. *"Teach me Unit 2 from the exam POV"*, *"What are the guaranteed 10-markers?"*, *"Give me the One-Nighter 80/20 plan"*).`,
          'System'
        );
      }
    } catch (err) {
      console.error('Failed to set syllabus on agent', err);
    }
  }

  function renderUnitChips(units) {
    if (!units || units.length === 0) {
      unitsExplorerSection.style.display = 'none';
      return;
    }

    unitsExplorerSection.style.display = 'block';
    unitsChipContainer.innerHTML = '';

    units.forEach(u => {
      const chip = document.createElement('button');
      chip.className = 'unit-chip';
      chip.textContent = `${u.unitNumber ? 'Unit ' + u.unitNumber : u.title}`;
      chip.title = u.title;
      chip.addEventListener('click', () => {
        sendUserRequirement(`Teach me ${u.title} from my uploaded syllabus according to my active requirement.`);
      });
      unitsChipContainer.appendChild(chip);
    });
  }

  // --- UPLOAD HANDLERS ---
  syllabusDropzone.addEventListener('click', () => syllabusFileInput.click());

  syllabusDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    syllabusDropzone.style.borderColor = 'var(--accent-rust)';
  });

  syllabusDropzone.addEventListener('dragleave', () => {
    syllabusDropzone.style.borderColor = '';
  });

  syllabusDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    syllabusDropzone.style.borderColor = '';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  });

  syllabusFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedFile(e.target.files[0]);
    }
  });

  async function handleUploadedFile(file) {
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    syllabusDropzone.querySelector('.upload-icon').textContent = '⏳';
    syllabusDropzone.querySelector('.upload-title').textContent = 'Extracting syllabus...';

    if (isDocx || isPdf) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/parse-document', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          syllabusDropzone.querySelector('.upload-icon').textContent = '✅';
          syllabusDropzone.querySelector('.upload-title').textContent = 'Syllabus Loaded!';
          await ingestSyllabusText(data.text, file.name);
        } else {
          alert('Could not parse document: ' + data.error);
          resetDropzone();
        }
      } catch (err) {
        alert('File upload error: ' + err.message);
        resetDropzone();
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        syllabusDropzone.querySelector('.upload-icon').textContent = '✅';
        syllabusDropzone.querySelector('.upload-title').textContent = 'Syllabus Loaded!';
        await ingestSyllabusText(e.target.result, file.name);
      };
      reader.readAsText(file);
    }
  }

  function resetDropzone() {
    syllabusDropzone.querySelector('.upload-icon').textContent = '📄';
    syllabusDropzone.querySelector('.upload-title').textContent = 'Drop Word (.docx) or PDF here';
  }

  // --- REQUIREMENTS SELECTION ---
  reqCards.forEach(card => {
    card.addEventListener('click', () => {
      reqCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentRequirement = card.getAttribute('data-req');
      currentPersonaLabel.textContent = reqLabels[currentRequirement] || currentRequirement;

      addAgentMessage(
        `🔄 **Requirement Updated:** Switched into **${reqLabels[currentRequirement]}** mode.\n\n` +
        `Every concept or topic will now be structured specifically around this requirement.`
      );
    });
  });

  // --- CHAT SYSTEM ---
  function addUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'agent-msg-row';
    row.innerHTML = `
      <div class="msg-avatar user">You</div>
      <div class="msg-content-box user">${escapeHtml(text)}</div>
    `;
    chatContainer.appendChild(row);
    scrollToBottom();
    conversationHistory.push({ role: 'user', content: text });
  }

  function renderMarkdown(text) {
    if (!text) return '';
    try {
      if (typeof window.marked?.parse === 'function') {
        return window.marked.parse(text);
      } else if (typeof window.marked === 'function') {
        return window.marked(text);
      }
    } catch (e) {
      console.warn('Marked parse error:', e);
    }
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function addAgentMessage(markdownText, source = '', followUps = []) {
    const row = document.createElement('div');
    row.className = 'agent-msg-row';

    const parsedHtml = renderMarkdown(markdownText);

    let sourceBadge = '';
    if (source && source !== 'System') {
      sourceBadge = `<div style="font-size: 0.725rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 600;">⚡ Engine: ${escapeHtml(source)}</div>`;
    }

    let followUpsHtml = '';
    if (followUps && followUps.length > 0) {
      followUpsHtml = `
        <div class="followups-container">
          ${followUps.map(fu => `<button class="followup-btn" data-prompt="${escapeHtml(fu)}">${escapeHtml(fu)}</button>`).join('')}
        </div>
      `;
    }

    row.innerHTML = `
      <div class="msg-avatar agent">AI</div>
      <div class="msg-content-box">
        ${sourceBadge}
        ${parsedHtml}
        ${followUpsHtml}
      </div>
    `;

    row.querySelectorAll('.followup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendUserRequirement(btn.getAttribute('data-prompt'));
      });
    });

    chatContainer.appendChild(row);
    scrollToBottom();
    conversationHistory.push({ role: 'model', content: markdownText });
  }

  function showThinkingIndicator() {
    const id = 'thinking-indicator-' + Date.now();
    const row = document.createElement('div');
    row.id = id;
    row.className = 'agent-msg-row';
    row.innerHTML = `
      <div class="msg-avatar agent">AI</div>
      <div class="msg-content-box" style="color: var(--text-secondary);">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--accent-rust);">
          <span style="display: inline-block; animation: spin 1s infinite linear;">⚙️</span>
          <span id="${id}-step">Thinking &amp; analyzing your syllabus...</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;" id="${id}-sub">
          Cross-referencing topics and marking schemes...
        </div>
      </div>
    `;
    chatContainer.appendChild(row);
    scrollToBottom();

    // Step-by-step thinking simulation
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      const stepEl = document.getElementById(`${id}-step`);
      const subEl = document.getElementById(`${id}-sub`);
      if (!stepEl) {
        clearInterval(interval);
        return;
      }
      if (stepCount === 1) {
        stepEl.textContent = 'Extracting relevant unit & exam topics...';
        subEl.textContent = 'Mapping syllabus concepts to your study requirement...';
      } else if (stepCount === 2) {
        stepEl.textContent = 'Synthesizing examiner rubric & model points...';
        subEl.textContent = 'Drafting diagrams and full-mark answer structures...';
      }
    }, 700);

    return { id, interval };
  }

  function removeThinkingIndicator({ id, interval }) {
    if (interval) clearInterval(interval);
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function sendUserRequirement(message) {
    if (!message || !message.trim()) return;

    if (!syllabusText) {
      if (sampleDatasets?.operatingSystems) {
        await ingestSyllabusText(sampleDatasets.operatingSystems.syllabus, 'Operating_Systems_Syllabus.docx');
      } else {
        alert('Please upload your syllabus Word (.docx) or PDF first, or click "Sample Syllabus" at the top!');
        return;
      }
    }

    addUserMessage(message);
    const thinking = showThinkingIndicator();

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          requirement: currentRequirement,
          syllabusText,
          history: conversationHistory,
          apiKey,
          provider: currentProvider,
          modelName: selectedOllamaModel
        })
      });

      const data = await res.json();
      removeThinkingIndicator(thinking);

      if (data.success) {
        addAgentMessage(data.reply, data.source, data.suggestedFollowUps || []);
      } else {
        addAgentMessage(`⚠️ **Agent Error:** ${data.error || 'Failed to generate response'}`);
      }
    } catch (err) {
      removeThinkingIndicator(thinking);
      addAgentMessage(`⚠️ **Network Error:** Could not reach tutor agent (${err.message}).`);
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    btnSendMessage.addEventListener('click', () => {
      const text = agentUserInput.value.trim();
      if (text) {
        agentUserInput.value = '';
        agentUserInput.style.height = 'auto';
        sendUserRequirement(text);
      }
    });

    agentUserInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = agentUserInput.value.trim();
        if (text) {
          agentUserInput.value = '';
          agentUserInput.style.height = 'auto';
          sendUserRequirement(text);
        }
      }
    });

    agentUserInput.addEventListener('input', () => {
      agentUserInput.style.height = 'auto';
      agentUserInput.style.height = Math.min(140, agentUserInput.scrollHeight) + 'px';
    });

    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        sendUserRequirement(chip.getAttribute('data-prompt'));
      });
    });

    btnLoadSampleSyllabus.addEventListener('click', () => {
      if (sampleDatasets?.operatingSystems) {
        ingestSyllabusText(
          sampleDatasets.operatingSystems.syllabus,
          'Operating_Systems_Syllabus.docx'
        );
      }
    });

    // Settings Modal
    btnOpenSettings.addEventListener('click', async () => {
      await checkOllamaStatus();
      settingsModal.style.display = 'flex';
    });

    btnCloseSettings.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });

    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
      }
    });

    btnSaveSettings.addEventListener('click', () => {
      apiKey = apiKeyInput.value.trim();
      currentProvider = engineProviderSelect.value;
      localStorage.setItem('examlens_gemini_key', apiKey);
      localStorage.setItem('examlens_provider', currentProvider);
      settingsModal.style.display = 'none';

      let msg = 'Settings saved! ';
      if (currentProvider === 'ollama') msg += 'Configured to run locally via Ollama.';
      else if (currentProvider === 'gemini') msg += 'Configured to use Google Gemini Cloud.';
      else msg += 'Configured to Auto (Ollama if running, else Gemini, else Dynamic Engine).';

      alert(msg);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init();
})();
