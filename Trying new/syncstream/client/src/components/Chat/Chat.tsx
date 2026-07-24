import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from '../../hooks/useRoom';
import { ChatSkeleton } from '../Skeleton/Skeleton';
import './Chat.css';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onSendReaction?: (emoji: string) => void;
  onSeek?: (seconds: number) => void;
  mySocketId: string | undefined;
}

const EMOJI_REACTIONS = ['❤️', '😂', '🔥', '😮', '🎉', '🍿'];

function parseTimestampToSeconds(text: string): number | null {
  const parts = text.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function renderMessageWithTimestamps(text: string, onSeek?: (seconds: number) => void) {
  const timestampRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
  const parts = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const tsStr = match[1];
    const seconds = parseTimestampToSeconds(tsStr);

    if (seconds !== null && onSeek) {
      parts.push(
        <button
          key={`${tsStr}-${match.index}`}
          className="chat-timestamp-btn"
          onClick={() => onSeek(seconds)}
          title={`Seek video to ${tsStr}`}
        >
          ⏱️ {tsStr}
        </button>
      );
    } else {
      parts.push(tsStr);
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : text;
}

export function Chat({ messages, onSend, onSendReaction, onSeek, mySocketId }: ChatProps) {
  const [input, setInput] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (showSkeleton) {
    return <ChatSkeleton />;
  }

  return (
    <div className="chat animate-fade-in">
      <div className="chat-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H5L2 13V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
        Chat
      </div>

      <div className="chat-messages" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((msg, i) => {
          const isSystem = msg.senderId === 'system';
          const isMine = msg.senderId === mySocketId;
          const showName = !isSystem && (i === 0 || messages[i - 1].senderId !== msg.senderId);

          return (
            <div
              key={msg.id}
              className={`chat-msg ${isSystem ? 'system' : isMine ? 'mine' : 'theirs'} ${showName ? 'show-name' : ''}`}
            >
              {isSystem ? (
                <span className="chat-system-text">{msg.message}</span>
              ) : (
                <>
                  {showName && !isMine && (
                    <span className="chat-sender">{msg.username}</span>
                  )}
                  <div className="chat-bubble">
                    <span className="chat-text">
                      {renderMessageWithTimestamps(msg.message, onSeek)}
                    </span>
                    <span className="chat-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Floating Emoji Bar */}
      {onSendReaction && (
        <div className="chat-emoji-bar">
          {EMOJI_REACTIONS.map(emoji => (
            <button
              key={emoji}
              className="chat-emoji-btn"
              onClick={() => onSendReaction(emoji)}
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          id="chat-input"
          className="input chat-input"
          type="text"
          placeholder="Type a message (e.g. 02:15)..."
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={300}
          autoComplete="off"
          aria-label="Chat message input"
        />
        <button
          type="submit"
          className="btn btn-primary chat-send-btn"
          disabled={!input.trim()}
          id="chat-send-btn"
          aria-label="Send message"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7l11-5-5 11-1.5-4.5L1 7z" fill="currentColor"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
