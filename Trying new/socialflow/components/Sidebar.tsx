'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header" aria-label="Mobile Navigation Bar">
        <div className="mobile-brand">
          <div className="logo-icon-sm">SF</div>
          <span className="mobile-title">SocialFlow</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/upload" className="btn btn-primary btn-sm" aria-label="Upload Video">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload</span>
          </Link>
          <button 
            type="button"
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop + Mobile Drawer) */}
      <aside 
        className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        aria-label="Primary Navigation"
      >
        <div className="sidebar-logo">
          <div className="logo-icon" aria-hidden="true">SF</div>
          <h1>SocialFlow</h1>
        </div>
        <nav className="sidebar-nav" aria-label="App Navigation">
          <div className="nav-section-title">Main</div>
          <Link 
            href="/" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/upload" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/upload' ? 'active' : ''}`}
            aria-current={pathname === '/upload' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Upload Video</span>
          </Link>
          <Link 
            href="/scheduled" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/scheduled' ? 'active' : ''}`}
            aria-current={pathname === '/scheduled' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Scheduled Posts</span>
          </Link>
          <Link 
            href="/history" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/history' ? 'active' : ''}`}
            aria-current={pathname === '/history' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <span>Post History</span>
          </Link>

          <div className="nav-section-title" style={{ marginTop: '16px' }}>Settings</div>
          <Link 
            href="/accounts" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/accounts' ? 'active' : ''}`}
            aria-current={pathname === '/accounts' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Connected Accounts</span>
          </Link>
          <Link 
            href="/settings" 
            onClick={closeMobile}
            className={`nav-link ${pathname === '/settings' ? 'active' : ''}`}
            aria-current={pathname === '/settings' ? 'page' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </Link>
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div className="card" style={{ padding: '14px', background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Quick Dispatch</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Publish video to YouTube &amp; Instagram</div>
            <Link 
              href="/upload" 
              onClick={closeMobile}
              className="btn btn-primary btn-sm w-full" 
              style={{ justifyContent: 'center' }}
            >
              Upload Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Quick Dock */}
      <nav className="mobile-bottom-dock" aria-label="Mobile Quick Bar">
        <Link
          href="/"
          className={`dock-item ${pathname === '/' ? 'active' : ''}`}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          <span className="dock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
          </span>
          <span className="dock-label">Dashboard</span>
        </Link>
        <Link
          href="/upload"
          className={`dock-item ${pathname === '/upload' ? 'active' : ''}`}
          aria-current={pathname === '/upload' ? 'page' : undefined}
        >
          <span className="dock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <span className="dock-label">Upload</span>
        </Link>
        <Link
          href="/scheduled"
          className={`dock-item ${pathname === '/scheduled' ? 'active' : ''}`}
          aria-current={pathname === '/scheduled' ? 'page' : undefined}
        >
          <span className="dock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className="dock-label">Scheduled</span>
        </Link>
        <Link
          href="/history"
          className={`dock-item ${pathname === '/history' ? 'active' : ''}`}
          aria-current={pathname === '/history' ? 'page' : undefined}
        >
          <span className="dock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span className="dock-label">History</span>
        </Link>
      </nav>
    </>
  );
}
