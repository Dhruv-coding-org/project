import { useTheme } from '../../utils/theme';
import './ThemeToggle.css';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const getThemeInfo = () => {
    switch (theme) {
      case 'fire':
        return {
          label: 'Inferno',
          nextLabel: 'Modern Dark',
          icon: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c-.3 2.1-1.8 3.8-3.1 5.3C3.6 6.8 2.5 8.2 2.5 10c0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5c0-2.8-2.2-5.1-3.6-7.1C9.1 1.7 8.4.8 8 0zm.2 6.7c.3.5.7 1 1 1.5.8 1.1 1.3 2.1 1.3 3.3 0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5c0-.9.4-1.7 1-2.4.5-.6 1.1-1.3 1.7-2.4z"/>
            </svg>
          )
        };
      case 'dark':
        return {
          label: 'Dark',
          nextLabel: 'Modern Light',
          icon: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.756.756 0 0 1 6 .278z"/>
            </svg>
          )
        };
      case 'light':
        return {
          label: 'Light',
          nextLabel: 'Inferno Fire',
          icon: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="4"/>
              <path d="M8 0v2M8 14v2M0 8h2M14 8h2M2.34 2.34l1.42 1.42M12.24 12.24l1.42 1.42M2.34 13.66l1.42-1.42M12.24 3.76l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          )
        };
      default:
        return {
          label: 'Inferno',
          nextLabel: 'Modern Dark',
          icon: (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0c-.3 2.1-1.8 3.8-3.1 5.3C3.6 6.8 2.5 8.2 2.5 10c0 3 2.5 5.5 5.5 5.5s5.5-2.5 5.5-5.5c0-2.8-2.2-5.1-3.6-7.1C9.1 1.7 8.4.8 8 0z"/>
            </svg>
          )
        };
    }
  };

  const { icon, label, nextLabel } = getThemeInfo();

  return (
    <button
      type="button"
      className={`theme-toggle-btn theme-${theme} ${compact ? 'compact' : ''} ${className}`}
      onClick={toggleTheme}
      title={`Theme: ${label} • Click to switch to ${nextLabel}`}
      aria-label={`Theme: ${label} • Click to switch to ${nextLabel}`}
      id="theme-toggle-btn"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="theme-toggle-text">
        {label}
      </span>
    </button>
  );
}
