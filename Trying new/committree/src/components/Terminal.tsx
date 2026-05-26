import React, { useState, useRef, useEffect } from 'react';
import type { GitState } from '../git/gitEngine';

interface TerminalProps {
  gitState: GitState;
  onExecuteCommand: (cmd: string) => void;
  commandHistory: { command: string; output: string[]; isError?: boolean }[];
  onClearHistory: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  gitState,
  onExecuteCommand,
  commandHistory,
  onClearHistory,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Command history buffer containing only strings typed by the user
  const userCommands = commandHistory
    .filter((h) => h.command !== '')
    .map((h) => h.command);

  // Auto-scroll to the bottom of the console whenever history changes
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandHistory]);

  // Focus terminal input when clicking anywhere inside the terminal area
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Generate completions list based on current input text
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    const tokens = inputValue.split(/\s+/);
    const mainCommand = tokens[0];
    const subCommand = tokens[1];

    const branchNames = Object.keys(gitState.branches);
    const commitHashes = Object.keys(gitState.commits);

    if (tokens.length === 1) {
      // Suggesting "git"
      if ('git'.startsWith(mainCommand) && mainCommand !== 'git') {
        setSuggestions(['git']);
      } else if (mainCommand === 'git') {
        setSuggestions(['git commit', 'git checkout', 'git branch', 'git merge', 'git rebase', 'git cherry-pick', 'git reset', 'git log', 'git status']);
      } else {
        setSuggestions([]);
      }
    } else if (tokens.length === 2 && mainCommand === 'git') {
      const gitSubcommands = ['commit', 'checkout', 'branch', 'merge', 'rebase', 'cherry-pick', 'reset', 'log', 'status'];
      const filtered = gitSubcommands
        .filter((sc) => sc.startsWith(subCommand))
        .map((sc) => `git ${sc}`);
      setSuggestions(filtered);
    } else if (tokens.length === 3 && mainCommand === 'git') {
      const arg = tokens[2] || '';
      if (subCommand === 'checkout' || subCommand === 'switch') {
        // Suggest branches and commits
        const filtered = [...branchNames, ...commitHashes]
          .filter((item) => item.startsWith(arg))
          .map((item) => `git ${subCommand} ${item}`);
        setSuggestions(filtered);
      } else if (subCommand === 'merge' || subCommand === 'rebase') {
        // Suggest branch names
        const filtered = branchNames
          .filter((item) => item.startsWith(arg))
          .map((item) => `git ${subCommand} ${item}`);
        setSuggestions(filtered);
      } else if (subCommand === 'reset') {
        const resetSuggestions = ['--hard', '--soft', 'HEAD~1', 'HEAD~2', ...branchNames, ...commitHashes];
        const filtered = resetSuggestions
          .filter((item) => item.startsWith(arg))
          .map((item) => `git reset ${item}`);
        setSuggestions(filtered);
      } else if (subCommand === 'cherry-pick') {
        const filtered = commitHashes
          .filter((item) => item.startsWith(arg))
          .map((item) => `git cherry-pick ${item}`);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
    setActiveSuggestionIndex(0);
  }, [inputValue, gitState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Enter Key - Submit Command
    if (e.key === 'Enter') {
      e.preventDefault();
      const commandToRun = inputValue.trim();
      if (commandToRun) {
        onExecuteCommand(commandToRun);
        setInputValue('');
        setHistoryIndex(-1);
        setSuggestions([]);
      }
    }

    // 2. Up Arrow - Previous Command
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (userCommands.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < userCommands.length) {
          setHistoryIndex(nextIndex);
          // Commands are ordered newest-first in the filtered userCommands array
          setInputValue(userCommands[userCommands.length - 1 - nextIndex]);
        }
      }
    }

    // 3. Down Arrow - Next Command
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInputValue(userCommands[userCommands.length - 1 - nextIndex]);
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }

    // 4. Tab Key - Autocomplete
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInputValue(suggestions[activeSuggestionIndex]);
        // If there are multiple suggestions, cycling through them is helpful
        if (suggestions.length > 1) {
          setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        }
      }
    }
  };

  const handleSuggestionClick = (sug: string) => {
    setInputValue(sug);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div
      className="terminal-container"
      ref={terminalRef}
      onClick={handleTerminalClick}
    >
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div className="terminal-title">bash - git-simulator</div>
        <button className="clear-btn" onClick={(e) => { e.stopPropagation(); onClearHistory(); }}>
          Clear Console
        </button>
      </div>

      <div className="terminal-console">
        {/* Welcome message */}
        <div className="console-line system-msg">
          Welcome to CommitTree Terminal. Type your git commands below.
          Press [Tab] for autocomplete, and [Up/Down] for command history.
        </div>

        {commandHistory.map((item, idx) => (
          <div key={idx} className="console-history-block">
            {item.command && (
              <div className="console-line command-input-line">
                <span className="prompt-symbol">user@committree:~$</span>{' '}
                <span className="entered-command">{item.command}</span>
              </div>
            )}
            {item.output.map((outLine, oIdx) => (
              <div
                key={oIdx}
                className={`console-line console-output ${
                  item.isError ? 'output-error' : 'output-success'
                }`}
              >
                {outLine}
              </div>
            ))}
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && (
        <div className="terminal-suggestions">
          <span className="suggestion-label">Suggestions (Tab):</span>
          {suggestions.slice(0, 5).map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              className={`suggestion-chip ${
                sIdx === activeSuggestionIndex ? 'active' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleSuggestionClick(sug);
              }}
            >
              {sug}
            </button>
          ))}
          {suggestions.length > 5 && <span className="suggestion-more">+{suggestions.length - 5} more</span>}
        </div>
      )}

      {/* Input Prompt */}
      <div className="terminal-input-row">
        <span className="prompt-symbol">user@committree:~$</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="git commit -m &quot;my commit&quot;..."
        />
      </div>
    </div>
  );
};
