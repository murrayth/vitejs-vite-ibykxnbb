import React from "react";

/**
 * Header.jsx
 * Purpose: Branded site header with nav and "Guide me" CTA.
 * Change: Adds a small "Synced via GitHub" badge to verify GitHub → StackBlitz updates.
 */
export default function Header({ onStartGuide }) {
  return (
    <header className="pp-header">
      <div className="pp-header-inner">
        {/* Left: Brand */}
        <a className="pp-brand" href="/" aria-label="ProjectorPoint home">
          <svg
            className="pp-logo"
            viewBox="0 0 64 64"
            role="img"
            aria-label="ProjectorPoint"
          >
            <circle cx="32" cy="32" r="28" fill="#1056d8" />
            <circle cx="32" cy="32" r="14" fill="#fff" />
            <circle cx="32" cy="32" r="7" fill="#1056d8" />
          </svg>
          <span className="pp-brand-text">ProjectorPoint</span>
        </a>

        {/* Middle: Nav */}
        <nav className="pp-nav" aria-label="Primary">
          <a className="pp-nav-link" href="/projectors">
            Projectors
          </a>
          <a className="pp-nav-link" href="/screens">
            Screens
          </a>
          <a className="pp-nav-link" href="/mounts">
            Mounts
          </a>
          <button className="pp-nav-link is-button" onClick={onStartGuide}>
            Guide me
          </button>
        </nav>

        {/* Right: CTA + Sync badge */}
        <div className="pp-actions">
          <div className="pp-search">
            <input
              className="pp-search-input"
              type="search"
              placeholder="Search products…"
              aria-label="Search products"
            />
            <svg className="pp-search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 4a6 6 0 104.472 10.061l4.233 4.234 1.414-1.415-4.234-4.233A6 6 0 0010 4zm-4 6a4 4 0 118 0 4 4 0 01-8 0z"
                fill="currentColor"
              />
            </svg>
          </div>
          <a className="pp-cta" href="tel:+442035143180" title="Talk to an expert">
            Talk to an expert
          </a>

          {/* NEW: GitHub sync badge */}
          <span className="pp-sync-badge" title="Rendered from the latest GitHub commit">
            Synced via GitHub
          </span>
        </div>
      </div>
    </header>
  );
}
