const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const engine = require('./engine');
const sampleData = require('./sample-data');
const agent = require('./agent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 } // 30 MB max
});

// Endpoint: Parse DOCX, PDF, or Text documents to clean text
async function parseUploadedDocument(file) {
  const originalName = file.originalname.toLowerCase();

  if (originalName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return {
      text: result.value,
      format: 'Word Document (.docx)',
      warnings: result.messages || []
    };
  } else if (originalName.endsWith('.pdf')) {
    const data = await pdfParse(file.buffer);
    return {
      text: data.text,
      format: 'PDF Document (.pdf)',
      pages: data.numpages
    };
  } else {
    // Fallback to text
    return {
      text: file.buffer.toString('utf-8'),
      format: 'Plain Text'
    };
  }
}

app.post('/api/parse-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await parseUploadedDocument(req.file);
    res.json({
      success: true,
      filename: req.file.originalname,
      text: result.text,
      format: result.format,
      pages: result.pages
    });
  } catch (err) {
    console.error('Document parsing error:', err);
    res.status(500).json({ error: 'Failed to extract text from document: ' + err.message });
  }
});

// Backward-compatible alias for existing callers
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await parseUploadedDocument(req.file);
    res.json({
      success: true,
      filename: req.file.originalname,
      text: result.text,
      format: result.format,
      pages: result.pages
    });
  } catch (err) {
    console.error('Document parsing error:', err);
    res.status(500).json({ error: 'Failed to extract text from document: ' + err.message });
  }
});

// Endpoint: Sample datasets
app.get('/api/sample-datasets', (req, res) => {
  res.json({
    success: true,
    datasets: sampleData
  });
});

// Endpoint: Cross-Analysis of Syllabus & PYQs
app.post('/api/analyze', (req, res) => {
  try {
    const { syllabusText, pyqsText } = req.body;
    if (!syllabusText || !pyqsText) {
      return res.status(400).json({ error: 'Please provide both syllabus and PYQ text.' });
    }

    const units = engine.parseSyllabus(syllabusText);
    const pyqs = engine.parsePYQs(pyqsText);
    const analysis = engine.crossAnalyze(units, pyqs);

    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to execute cross-analysis: ' + err.message });
  }
});

// Endpoint: Topic Study Guide (Comprehensive or One-Nighter)
app.post('/api/topic-guide', async (req, res) => {
  try {
    const { topicTitle, unitTitle, matchedQuestions, mode } = req.body;
    if (!topicTitle) {
      return res.status(400).json({ error: 'Topic title is required' });
    }

    const guide = engine.generateTopicGuide(
      topicTitle,
      unitTitle || 'Core Unit',
      matchedQuestions || [],
      mode || 'one-nighter'
    );

    res.json({
      success: true,
      guide
    });
  } catch (err) {
    console.error('Topic guide error:', err);
    res.status(500).json({ error: 'Failed to generate study guide: ' + err.message });
  }
});

// Endpoint: Student Answer Grading & Rubric
app.post('/api/grade-answer', (req, res) => {
  try {
    const { questionText, studentAnswer, maxMarks } = req.body;
    if (!studentAnswer) {
      return res.status(400).json({ error: 'Student answer is required for grading.' });
    }

    const evaluation = engine.gradeStudentAnswer(
      questionText || 'General Exam Question',
      studentAnswer,
      maxMarks ? parseInt(maxMarks, 10) : 10
    );

    res.json({
      success: true,
      evaluation
    });
  } catch (err) {
    console.error('Grading error:', err);
    res.status(500).json({ error: 'Failed to grade answer: ' + err.message });
  }
});

// Endpoint: Predicted Exam Paper
app.post('/api/predicted-paper', (req, res) => {
  try {
    const { analysisData } = req.body;
    if (!analysisData) {
      return res.status(400).json({ error: 'Analysis data is required' });
    }

    const paper = engine.generatePredictedPaper(analysisData);
    res.json({
      success: true,
      paper
    });
  } catch (err) {
    console.error('Predicted paper error:', err);
    res.status(500).json({ error: 'Failed to build predicted paper: ' + err.message });
  }
});

// Endpoint: Interactive Exam Tutor Chat
app.post('/api/tutor-chat', (req, res) => {
  try {
    const { message, topicContext, mode } = req.body;
    const cleanMsg = (message || '').toLowerCase();

    // Humanized, practical examiner advice
    let reply = "";
    if (cleanMsg.includes('mnemonic') || cleanMsg.includes('remember')) {
      reply = `**Examiner Mnemonic Secret:**\nUse the phrase **"Fast Cars Need Gas"** or create a personalized acronym matching the first letter of each key mechanism. In your answer script, write the acronym in the margin—examiners immediately recognize that you have structured recall.`;
    } else if (cleanMsg.includes('diagram') || cleanMsg.includes('draw')) {
      reply = `**Exam Diagram Protocol:**\n1. Always draw diagrams in the upper half of your answer page, never cramped at the bottom.\n2. Label every single bus/arrow with its function (e.g., "Address Bus", "Interrupt Signal", "Page Table Pointer").\n3. Even if your written description has a small slip, a complete diagram guarantees at least 50% of the question's total marks.`;
    } else if (cleanMsg.includes('difference') || cleanMsg.includes('compare') || cleanMsg.includes('vs')) {
      reply = `**How to Ace Comparison Questions (5/5 Marks Rule):**\nNever write continuous text! Construct a strict table with 4 columns:\n1. **Parameter / Basis of Comparison** (Crucial! Evaluators grade this first)\n2. **Entity A**\n3. **Entity B**\n4. **Example / Use Case**\nProvide at least 5 distinct rows for a 5-mark question.`;
    } else if (cleanMsg.includes('numerical') || cleanMsg.includes('solve')) {
      reply = `**Step-Marking Safeguard for Numericals:**\n1. **Given Data:** Write down all variables and units explicitly at the top (1 mark).\n2. **Formula Statement:** State the algebraic formula before substituting numbers (1 mark).\n3. **Calculation Steps:** Show intermediate arithmetic clearly.\n4. **Boxed Result:** Put a clear rectangle box around your final answer with its units (e.g. [ Average Waiting Time = 4.25 ms ]). Even if arithmetic fails, you preserve 70% of step marks!`;
    } else {
      reply = `**Examiner's Advice for "${message}":**\nFocus on the core intent: university and board examiners grade in 90-second sweeps per paper. Make their job easy: use bulleted subheadings, underline technical keywords, sketch a quick block schematic, and provide one real-world software/hardware application. That is the reliable formula for a 9+ CGPA.`;
    }

    res.json({
      success: true,
      reply
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Ingest syllabus for agent memory
app.post('/api/set-syllabus', (req, res) => {
  try {
    const { syllabusText, filename } = req.body;
    const units = engine.parseSyllabus(syllabusText || "");
    agent.setSyllabus(syllabusText, units);
    res.json({
      success: true,
      filename: filename || 'Custom Syllabus',
      unitsCount: units.length,
      topicsCount: units.reduce((acc, u) => acc + u.topics.length, 0),
      units
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Check local Ollama status
app.get('/api/ollama/status', async (req, res) => {
  try {
    const status = await agent.checkOllamaStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.json({ success: false, available: false, error: err.message });
  }
});

// Endpoint: Interactive AI Tutor Agent Chat
app.post('/api/agent-chat', async (req, res) => {
  try {
    const { message, requirement, syllabusText, history, apiKey, provider, modelName } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await agent.generateResponse({
      message,
      requirement: requirement || 'one-nighter',
      syllabusText,
      history: history || [],
      apiKey,
      provider: provider || 'auto',
      modelName
    });

    res.json({
      success: true,
      ...response
    });
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({ error: 'AI Agent error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Exam Assistant server running on http://localhost:${PORT}`);
});
