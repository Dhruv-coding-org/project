import { useState, useEffect } from 'react';
import type { SubtitleCue } from '../../utils/subtitleParser';
import { getActiveCueText } from '../../utils/subtitleParser';

interface SubtitleOverlayProps {
  cues: SubtitleCue[];
  currentTime: number;
  visible: boolean;
}

export function SubtitleOverlay({ cues, currentTime, visible }: SubtitleOverlayProps) {
  const [activeText, setActiveText] = useState<string>('');

  useEffect(() => {
    if (!visible || cues.length === 0) {
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
        dangerouslySetInnerHTML={{ __html: activeText.replace(/\n/g, '<br/>') }}
      />
    </div>
  );
}
