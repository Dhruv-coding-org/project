// ExamLens AI Agent - Client Controller

(function () {
  'use strict';

  // State
  let currentRequirement = 'one-nighter'; // 'one-nighter' | 'comprehensive' | 'eli5' | 'quiz-me' | 'cheat-sheet'
  let syllabusText = '';
  let syllabusFilename = '';
  let conversationHistory = []; // { role: 'user' | 'model', content: string }
  let apiKey = localStorage.getItem('examlens_gemini_key') || '';
  let sampleDatasets = null;

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
  const apiKeyInput = document.getElementById('apiKeyInput');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Requirement display names
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
    await fetchSampleDatasets();

    if (apiKeyInput && apiKey) {
      apiKeyInput.value = apiKey;
    }

    // Auto-load sample syllabus if no syllabus loaded yet so the agent is immediately alive!
    if (sampleDatasets?.operatingSystems) {
      ingestSyllabusText(
        sampleDatasets.operatingSystems.syllabus,
        'Operating_Systems_Syllabus.docx'
      );
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

  // --- FETCH SAMPLE DATASETS ---
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

    // Notify backend agent memory
    try {
      const res = await fetch('/api/set-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText, filename })
      });
      const data = await res.json();

      if (data.success) {
        // Update header indicator
        activeDocPill.classList.add('active');
        activeDocName.textContent = `📄 ${filename} (${data.unitsCount} Units)`;

        // Update sidebar feedback
        uploadFeedback.style.display = 'block';
        feedbackFilename.textContent = filename;
        feedbackMeta.textContent = `${data.unitsCount} Units • ${data.topicsCount} Topics in agent memory`;

        // Render unit chips
        renderUnitChips(data.units);

        // Clear chat and introduce agent
        chatContainer.innerHTML = '';
        conversationHistory = [];

        addAgentMessage(
          `### 👋 Welcome to your Private Exam Tutor Session!\n\n` +
          `I have ingested your entire syllabus: **${filename}** (${data.unitsCount} Units and ${data.topicsCount} topics are now loaded into my active memory).\n\n` +
          `**My Active Mode:** \`${reqLabels[currentRequirement]}\`\n\n` +
          `Tell me how you would like to proceed: you can ask me to break down any unit, focus strictly on guaranteed 10-mark questions for tonight, or quiz you like a university examiner.`
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
        sendUserRequirement(`Teach me ${u.title} from the syllabus according to my current requirement.`);
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
    syllabusDropzone.querySelector('.upload-title').textContent = 'Reading syllabus...';

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
      // Plain text
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

      // Notify the agent in the chat
      addAgentMessage(
        `🔄 **Requirement Updated:** I have switched into **${reqLabels[currentRequirement]}** mode.\n\n` +
        `Ask me anything or pick a topic from your syllabus, and I will format all my explanations to fit this exact requirement.`
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

  function addAgentMessage(markdownText, followUps = []) {
    const row = document.createElement('div');
    row.className = 'agent-msg-row';

    let parsedHtml = '';
    if (window.marked) {
      parsedHtml = marked.parse(markdownText);
    } else {
      parsedHtml = escapeHtml(markdownText).replace(/\n/g, '<br>');
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
        ${parsedHtml}
        ${followUpsHtml}
      </div>
    `;

    // Attach click events to followup buttons
    row.querySelectorAll('.followup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        sendUserRequirement(prompt);
      });
    });

    chatContainer.appendChild(row);
    scrollToBottom();
    conversationHistory.push({ role: 'model', content: markdownText });
  }

  function showTypingIndicator() {
    const id = 'typing-indicator-' + Date.now();
    const row = document.createElement('div');
    row.id = id;
    row.className = 'agent-msg-row';
    row.innerHTML = `
      <div class="msg-avatar agent">AI</div>
      <div class="msg-content-box" style="color: var(--text-muted); font-style: italic;">
        Consulting your syllabus and preparing exam-oriented response...
      </div>
    `;
    chatContainer.appendChild(row);
    scrollToBottom();
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Send message to backend agent
  async function sendUserRequirement(message) {
    if (!message || !message.trim()) return;

    if (!syllabusText) {
      alert('Please upload your syllabus Word (.docx) or PDF first, or click "Sample Syllabus" at the top!');
      return;
    }

    addUserMessage(message);
    const typingId = showTypingIndicator();

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          requirement: currentRequirement,
          syllabusText,
          history: conversationHistory,
          apiKey
        })
      });

      const data = await res.json();
      removeTypingIndicator(typingId);

      if (data.success) {
        addAgentMessage(data.reply, data.suggestedFollowUps || []);
      } else {
        addAgentMessage(`⚠️ **Agent Error:** ${data.error || 'Failed to generate response'}`);
      }
    } catch (err) {
      removeTypingIndicator(typingId);
      addAgentMessage(`⚠️ **Network Error:** Could not reach tutor agent (${err.message}).`);
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Send button
    btnSendMessage.addEventListener('click', () => {
      const text = agentUserInput.value.trim();
      if (text) {
        agentUserInput.value = '';
        agentUserInput.style.height = 'auto';
        sendUserRequirement(text);
      }
    });

    // Enter to send
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

    // Auto resize textarea
    agentUserInput.addEventListener('input', () => {
      agentUserInput.style.height = 'auto';
      agentUserInput.style.height = Math.min(140, agentUserInput.scrollHeight) + 'px';
    });

    // Quick chips
    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        sendUserRequirement(prompt);
      });
    });

    // Load sample syllabus button
    btnLoadSampleSyllabus.addEventListener('click', () => {
      if (sampleDatasets?.operatingSystems) {
        ingestSyllabusText(
          sampleDatasets.operatingSystems.syllabus,
          'Operating_Systems_Syllabus.docx'
        );
      }
    });

    // Settings Modal
    btnOpenSettings.addEventListener('click', () => {
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
      localStorage.setItem('examlens_gemini_key', apiKey);
      settingsModal.style.display = 'none';
      alert('Settings saved! ' + (apiKey ? 'Gemini API key connected.' : 'Smart local tutor engine enabled.'));
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

  // Launch
  init();
})();
