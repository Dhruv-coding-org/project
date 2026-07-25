/**
 * subtitleParser.ts — Enhanced SRT / WebVTT / ASS / SSA / SUB Subtitle Parser
 *
 * Accepts the raw text content of subtitle files (.srt, .vtt, .ass, .ssa, .txt)
 * and returns an array of SubtitleCue objects with times in seconds.
 */

export interface SubtitleCue {
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

/**
 * Convert a timestamp string like "01:23:45,678", "01:23:45.678", or "1:23:45.67"
 * to total seconds.
 */
function parseTimestamp(raw: string): number {
  const cleaned = raw.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    return (
      parseInt(parts[0], 10) * 3600 +
      parseInt(parts[1], 10) * 60 +
      parseFloat(parts[2])
    );
  }
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(cleaned) || 0;
}

/**
 * Clean subtitle text tags (strip ASS/SSA format overrides like {\pos(...)} or {\b1})
 */
function cleanSubtitleText(raw: string): string {
  return raw
    .replace(/\\N/gi, '\n') // ASS/SSA newline token
    .replace(/\{[^}]+\}/g, '') // Strip ASS style tags
    .trim();
}

/**
 * Parse raw subtitle text into an array of cues.
 * Supports: SRT, WebVTT, ASS, SSA format lines.
 */
export function parseSubtitles(rawText: string): SubtitleCue[] {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const cues: SubtitleCue[] = [];

  // SRT / WebVTT Regex: 00:01:20,000 --> 00:01:23,500 or 01:20.000 --> 01:23.500
  const srtTimeRegex = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{2,3})/;

  // ASS / SSA Regex: Dialogue: 0,0:01:20.00,0:01:23.50,Default,,0,0,0,,Text
  const assDialogueRegex = /^Dialogue:\s*[^,]*,\s*(\d+:\d{2}:\d{2}[.,]\d+)\s*,\s*(\d+:\d{2}:\d{2}[.,]\d+)\s*,\s*[^,]*(?:,[^,]*){5},(.*)$/i;

  let currentCue: Partial<SubtitleCue> = {};
  let textLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check ASS / SSA line match
    const assMatch = line.match(assDialogueRegex);
    if (assMatch) {
      cues.push({
        startTime: parseTimestamp(assMatch[1]),
        endTime: parseTimestamp(assMatch[2]),
        text: cleanSubtitleText(assMatch[3]),
      });
      continue;
    }

    // Skip WebVTT / ASS header metadata
    if (
      line === 'WEBVTT' ||
      line.startsWith('NOTE') ||
      line.startsWith('STYLE') ||
      line.startsWith('[Script Info]') ||
      line.startsWith('[V4+ Styles]') ||
      line.startsWith('Format:')
    ) {
      continue;
    }

    const match = line.match(srtTimeRegex);

    if (match) {
      // Flush previous cue if any
      if (currentCue.startTime !== undefined && textLines.length > 0) {
        currentCue.text = cleanSubtitleText(textLines.join('\n'));
        cues.push(currentCue as SubtitleCue);
        textLines = [];
      }
      currentCue = {
        startTime: parseTimestamp(match[1]),
        endTime: parseTimestamp(match[2]),
      };
    } else if (line === '' && currentCue.startTime !== undefined) {
      // Blank line = end of cue
      if (textLines.length > 0) {
        currentCue.text = cleanSubtitleText(textLines.join('\n'));
        cues.push(currentCue as SubtitleCue);
        currentCue = {};
        textLines = [];
      }
    } else if (line !== '' && currentCue.startTime !== undefined) {
      // Skip pure-numeric lines (SRT cue indices)
      if (/^\d+$/.test(line)) continue;
      textLines.push(line);
    }
  }

  // Flush last cue
  if (currentCue.startTime !== undefined && textLines.length > 0) {
    currentCue.text = cleanSubtitleText(textLines.join('\n'));
    cues.push(currentCue as SubtitleCue);
  }

  // Sort cues chronologically
  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Binary-search the cues array for the active cue at a given time.
 */
export function getActiveCueText(cues: SubtitleCue[], time: number): string {
  if (cues.length === 0) return '';

  let lo = 0;
  let hi = cues.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cue = cues[mid];

    if (time < cue.startTime) {
      hi = mid - 1;
    } else if (time > cue.endTime) {
      lo = mid + 1;
    } else {
      return cue.text;
    }
  }

  return '';
}
