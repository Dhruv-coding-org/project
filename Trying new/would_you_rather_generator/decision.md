# Decision Record & Architecture Guide: Would You Rather Generator

## 1. Overview & Purpose
**Would You Rather Generator** is an automated short-form video generation engine (targeted for YouTube Shorts, Instagram Reels, and TikTok). It automatically creates captivating 9:16 vertical dilemma videos featuring high-quality neural voiceover (via Microsoft Edge TTS), animated countdown bars, sound effects (clock ticks and ding chimes), split-screen visual comparison cards, and percentage poll reveals.

---

## 2. Architecture & Component Guide

### 2.1 Core Video Pipeline
The generator operates through a 4-stage pipeline:
1. **Dilemma Selection**: Reads paired choices from `questions.json`.
2. **Neural Speech Synthesis**: Uses `edge-tts` to convert question text and options into natural speech.
3. **Card & Frame Rendering**: Employs Pillow (PIL) to generate high-resolution split-screen frames with fonts, colors, and countdown progress.
4. **MoviePy Compositing & Audio Mixing**: Combines visual clips, voiceover tracks, tick effects, and ding sound into a vertical 1080x1920 MP4 video.

### 2.2 Component Breakdown
- **[generator.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/would_you_rather_generator/generator.py)**:
  - Main pipeline script orchestrating audio generation, timing synchronization, and video export.
  - **MoviePy Patch (`patch_moviepy_reader`)**: Fixes a critical recursion bug in MoviePy's `FFMPEG_AudioReader.get_frame` where boolean slicing in newer NumPy versions caused stack overflows.
  - Asynchronously interfaces with `edge_tts` using voice profiles (such as `en-US-ChristopherNeural`).
  - Stitches `tick.wav` during the 3-second decision countdown and triggers `ding.wav` on the percentage reveal.
- **[renderer.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/would_you_rather_generator/renderer.py)**:
  - Renders custom 1080x1920 graphic frames using Python Imaging Library (Pillow).
  - Handles text wrapping and sizing using the bold `Anton-Regular.ttf` display font.
  - Draws top/bottom split cards (e.g. Red vs Blue or Purple vs Emerald), circular "VS" badge, and animated percentage reveal bars.
- **[assets_manager.py](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/would_you_rather_generator/assets_manager.py)**:
  - Manages asset resolution for fonts, audio clips (`ding.wav`, `tick.wav`), and background textures.
- **[questions.json](file:///c:/Users/dhruv/OneDrive/Desktop/Project/Trying%20new/would_you_rather_generator/questions.json)**:
  - JSON database containing questions, option text, and crowd percentage splits.

---

## 3. Key Architectural Decisions & Change History

| Commit / Phase | Decision / Change | Rationale & Impact |
| :--- | :--- | :--- |
| `2ffe9db` | Initial implementation: "something new" | Built automated video generator with MoviePy, Edge-TTS, and split-screen card layout for automated content creation. |
| `c12f779` | MoviePy recursion bug patch & sound mixing fixes | Resolved crash in `FFMPEG_AudioReader` caused by boolean array indexing changes in modern NumPy. |
| `audit-fix` | FFmpeg pre-flight diagnostics, temp file cleanup, 3x expanded corpus & tests | Added explicit FFmpeg availability check; added `--clean-temp` scratch frame purge; expanded dilemma database from 5 to 15 questions; created automated unit tests (`test_generator.py`); restored Git tracking in root `.gitignore`. |

---

## 4. Usage & Running Instructions

### Prerequisites
1. Ensure Python 3.8+ and FFmpeg are installed and available on your PATH.
2. Install dependencies:
   ```bash
   cd "Trying new/would_you_rather_generator"
   pip install -r requirements.txt
   ```

### Generating Videos
Run the generator script:
```bash
python generator.py
```
- Optional arguments:
  - `--count <N>`: Generate multiple videos in batch.
  - `--voice <voice_name>`: Change Edge-TTS voice (e.g., `en-US-GuyNeural`, `en-US-JennyNeural`).
- Generated videos will be saved in the `outputs/` directory in 1080x1920 (9:16) format ready for upload.

---

## 5. Maintenance & Future Update Protocol
Whenever modifications or new features are introduced to `would_you_rather_generator`:
1. Document changes in the **Key Architectural Decisions & Change History** table.
2. If new visual themes, countdown styles, or sound effects are added, document them in Section 2.
3. Keep the MoviePy monkey patch in `generator.py` intact unless upgrading to a future MoviePy release that officially resolves the audio reader recursion issue.
