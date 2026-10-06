const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const engine = require('./engine');
const sampleData = require('./sample-data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for PDF uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

// Endpoint: Parse PDF to clean text
app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const data = await pdfParse(req.file.buffer);
    res.json({
      success: true,
      filename: req.file.originalname,
      text: data.text,
      pages: data.numpages
    });
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ error: 'Failed to parse PDF document. Ensure it contains selectable text.' });
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

app.listen(PORT, () => {
  console.log(`Exam Assistant server running on http://localhost:${PORT}`);
});
