import React, { useState, useEffect } from 'react';

export default function StartupBootScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const BOOT_LOGS = [
    'BIOS / POST: HARDWARE BUS DETECTED • 3.20 GHz',
    'INITIALIZING INTEL 8237 DMA CONTROLLER (CH 0-3)...',
    'CONFIGURING BURST, CYCLE STEALING & TRANSPARENT MODES...',
    'SYNCHRONIZING MULTICORE FABRIC & L3 CACHE CROSSBAR...',
    'CALIBRATING HARDWARE MEMORY ARBITER TURNSTILE...',
    'ALL ARCHITECTURAL SUBSYSTEMS NOMINAL • LAUNCHING LAB...'
  ];

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds total duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPct);

      const targetLog = Math.min(
        BOOT_LOGS.length - 1,
        Math.floor((elapsed / duration) * BOOT_LOGS.length)
      );
      setLogIndex(targetLog);

      if (elapsed >= duration) {
        clearInterval(interval);
        handleFinish();
      }
    }, 40);

    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 550);
  };

  return (
    <div
      className={`startup-splash-overlay ${isFadingOut ? 'splash-fade-out' : ''}`}
      onClick={handleFinish}
      role="dialog"
      aria-label="OS-ArchLab Boot Sequence"
    >
      {/* BACKGROUND SCANLINES & RADIAL GLOW */}
      <div className="splash-bg-glow"></div>
      <div className="splash-grid-matrix"></div>

      {/* TOP SKIP PILL */}
      <button
        className="splash-skip-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleFinish();
        }}
        title="Skip intro animation (ESC)"
      >
        <span>SKIP BOOT</span>
        <span className="splash-key-badge">ESC</span>
      </button>

      {/* CENTRAL LOGO & EMBLEM CONTAINER */}
      <div className="splash-content-frame">
        {/* HOLOGRAPHIC ROTATING SILICON CHIP EMBLEM */}
        <div className="splash-emblem-wrapper">
          {/* ORBITING RETICLE RINGS */}
          <div className="splash-reticle-outer"></div>
          <div className="splash-reticle-inner"></div>
          <div className="splash-radar-sweep"></div>

          {/* HIGH-TECH SILICON MICROPROCESSOR CHIP SVG */}
          <svg
            className="splash-chip-svg"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* PIN CONNECTORS (NORTH, SOUTH, EAST, WEST) */}
            <g stroke="#00d2ff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
              {/* TOP PINS */}
              <line x1="36" y1="6" x2="36" y2="18" />
              <line x1="48" y1="6" x2="48" y2="18" />
              <line x1="60" y1="4" x2="60" y2="18" />
              <line x1="72" y1="6" x2="72" y2="18" />
              <line x1="84" y1="6" x2="84" y2="18" />

              {/* BOTTOM PINS */}
              <line x1="36" y1="102" x2="36" y2="114" />
              <line x1="48" y1="102" x2="48" y2="114" />
              <line x1="60" y1="102" x2="60" y2="116" />
              <line x1="72" y1="102" x2="72" y2="114" />
              <line x1="84" y1="102" x2="84" y2="114" />

              {/* LEFT PINS */}
              <line x1="6" y1="36" x2="18" y2="36" />
              <line x1="6" y1="48" x2="18" y2="48" />
              <line x1="4" y1="60" x2="18" y2="60" />
              <line x1="6" y1="72" x2="18" y2="72" />
              <line x1="6" y1="84" x2="18" y2="84" />

              {/* RIGHT PINS */}
              <line x1="102" y1="36" x2="114" y2="36" />
              <line x1="102" y1="48" x2="114" y2="48" />
              <line x1="102" y1="60" x2="116" y2="60" />
              <line x1="102" y1="72" x2="114" y2="72" />
              <line x1="102" y1="84" x2="114" y2="84" />
            </g>

            {/* CHIP PACKAGE BOUNDARY */}
            <rect
              x="18"
              y="18"
              width="84"
              height="84"
              rx="8"
              fill="rgba(4, 9, 24, 0.95)"
              stroke="#0052ff"
              strokeWidth="2.5"
            />

            {/* DIE INNER ETCHING */}
            <rect
              x="30"
              y="30"
              width="60"
              height="60"
              rx="4"
              fill="rgba(0, 82, 255, 0.15)"
              stroke="#00d2ff"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* CORNER NOTCH MARKER */}
            <circle cx="26" cy="26" r="3" fill="#00d2ff" />

            {/* INTERNAL BUS CIRCUITRY */}
            <path
              d="M 40 40 L 52 40 L 52 52 M 80 40 L 68 40 L 68 52 M 40 80 L 52 80 L 52 68 M 80 80 L 68 80 L 68 68"
              stroke="#00d2ff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* CENTER PROCESSOR CORE (OS GLYPH) */}
            <rect
              x="47"
              y="47"
              width="26"
              height="26"
              rx="3"
              fill="#0052ff"
              className="anim-core-pulse"
            />

            <text
              x="60"
              y="64"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="900"
              fontFamily="monospace"
              letterSpacing="0.05em"
            >
              OS
            </text>
          </svg>
        </div>

        {/* LOGO TYPOGRAPHY & BRANDING */}
        <div className="splash-branding-box">
          <div className="splash-sys-tag">KERNEL V4.19 • HARDWARE ACCELERATED</div>
          <h1 className="splash-main-title">
            <span className="splash-title-os">OS</span>
            <span className="splash-title-sep">•</span>
            <span className="splash-title-arch">ARCH</span>
            <span className="splash-title-lab">LAB</span>
          </h1>
          <p className="splash-subtitle">
            OPERATING SYSTEMS ARCHITECTURE & HARDWARE VISUALIZATION PLATFORM
          </p>
        </div>

        {/* PROGRESS TRACK & LIVE TELEMETRY */}
        <div className="splash-progress-container">
          <div className="splash-progress-track">
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            >
              <div className="splash-progress-head"></div>
            </div>
          </div>

          <div className="splash-telemetry-row">
            <span className="splash-log-text">{BOOT_LOGS[logIndex]}</span>
            <span className="splash-pct-text">{progress}%</span>
          </div>
        </div>

        {/* BOTTOM HINT */}
        <div className="splash-hint-row">
          <span>INITIALIZING INTERACTIVE WORKSPACE</span>
          <span className="splash-blinking-cursor">_</span>
        </div>
      </div>
    </div>
  );
}
