import { useState, useEffect } from 'react';
import type { SubtitleCue } from '../../utils/subtitleParser';
import { getActiveCueText } from '../../utils/subtitleParser';

interface SubtitleOverlayProps {
  cues: SubtitleCue[];
  currentTime: number;
  visible: boolean;
}

/**
 * Sanitize subtitle HTML — strips all tags except safe formatting.
 * Prevents XSS from malicious .srt/.vtt files containing <script>, <img onerror=...>, etc.
 */
function sanitizeSubtitleHtml(raw: string): string {
  // Replace newlines with <br/> first
  let html = raw.replace(/\n/g, '<br/>');
  // Strip all tags except <i>, </i>, <b>, </b>, <u>, </u>, <br>, <br/>
  html = html.replace(/<\/?(?!(?:i|b|u|br)\b)[a-z][^>]*>/gi, '');
  // Remove any remaining event handlers that might slip through (e.g., onerror=, onclick=)
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  return html;
}

export function SubtitleOverlay({ cues, currentTime, visible }: SubtitleOverlayProps) {
  const [activeText, setActiveText] = useState<string>('');

  useEffect(() => {
    if (!visible || cues.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveText('');
      return;
    }
    const text = getActiveCueText(cues, currentTime);
    setActiveText(text);
  }, [cues, currentTime, visible]);

  if (!visible || !activeText) return null;

  return (
    <div className="vp-subtitle-container">
      <p
        className="vp-subtitle-text"
        dangerouslySetInnerHTML={{ __html: sanitizeSubtitleHtml(activeText) }}
      />
    </div>
  );
}
