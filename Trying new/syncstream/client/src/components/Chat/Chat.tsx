import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ChatMessage } from '../../hooks/useRoom';
import { ChatSkeleton } from '../Skeleton/Skeleton';
import './Chat.css';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  mySocketId: string | undefined;
}

export function Chat({ messages, onSend, mySocketId }: ChatProps) {
  const [input, setInput] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Show skeleton briefly
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to latest message
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
                    <span className="chat-text">{msg.message}</span>
                    <span className="chat-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          id="chat-input"
          className="input chat-input"
          type="text"
          placeholder="Type a message…"
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
