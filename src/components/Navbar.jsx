import React, { useState, useEffect } from 'react';
import { Zap, Cpu, Layers, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export default function Navbar({ activeTab, setActiveTab, onReboot }) {
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsCinemaMode(isFull);
      if (isFull) {
        document.body.classList.add('cinema-mode-active');
      } else {
        document.body.classList.remove('cinema-mode-active');
      }
    };

    const handleKeyDown = (e) => {
      // Toggle on 'f' or 'F' if not typing in an input
      if ((e.key === 'f' || e.key === 'F') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        toggleCinemaMode();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCinemaMode]);

  const toggleCinemaMode = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      document.body.classList.add('cinema-mode-active');
      setIsCinemaMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.classList.remove('cinema-mode-active');
      setIsCinemaMode(false);
    }
  };

  const handleToggleSound = () => {
    const newState = soundFx.toggle();
    setSfxEnabled(newState);
    if (newState) {
      soundFx.playClick();
    }
  };

  return (
    <header style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="header-laser-line"></div>
      
      <div className="header-branding">
        <div className="brand-row">
          <span
            className="brand-title"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}
            onClick={onReboot}
            title="Click to replay system boot sequence & logo animation"
          >
            <div className="nav-logo-badge">
              <svg width="18" height="18" viewBox="0 0 120 120" fill="none">
                <rect x="18" y="18" width="84" height="84" rx="8" fill="#040918" stroke="#00d2ff" strokeWidth="6" />
                <rect x="42" y="42" width="36" height="36" rx="4" fill="#0052ff" />
                <text x="60" y="68" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900" fontFamily="monospace">OS</text>
              </svg>
            </div>
            OS-ArchLab
          </span>
          <div className="telemetry-ticker-bar">
            <span className="telemetry-item">
              <span className="telemetry-dot"></span> BUS: 3.2 GHz
            </span>
            <span className="telemetry-item">
              <span className="telemetry-dot"></span> DMA 8237: ARMED
            </span>
            <span className="telemetry-item">
              <span className="telemetry-dot amber"></span> ARBITER: READY
            </span>
          </div>

          {/* FEATURE 2: LIVE CLOCK HARMONIC FFT SPECTRUM ANALYZER */}
          <div className="cyber-fft-equalizer" title="Clock Harmonic Frequency Spectrum (3.2 GHz)">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="fft-bar"
                style={{
                  animationDelay: `${(i * 0.06).toFixed(2)}s`,
                  animationDuration: `${0.75 + ((i % 4) * 0.18)}s`
                }}
              />
            ))}
          </div>

          {/* AUDIO SYNTHESIZER TOGGLE */}
          <button
            className={`sfx-toggle-btn ${sfxEnabled ? 'sfx-active' : ''}`}
            onClick={handleToggleSound}
            title="Toggle Synthesized Web Audio FX"
          >
            {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>SFX: {sfxEnabled ? 'ON' : 'OFF'}</span>
            <div className="sfx-wave-bars">
              <div className="sfx-wave-bar" style={{ height: '5px' }}></div>
              <div className="sfx-wave-bar" style={{ height: '9px' }}></div>
              <div className="sfx-wave-bar" style={{ height: '6px' }}></div>
            </div>
          </button>


        </div>
        <div className="brand-subtitle">
          Operating System Overview: Direct Memory Access (DMA) & Multiprocessor vs. Multicore
        </div>
      </div>

      <div className="header-nav-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
        <nav className="nav-tabs">
          <button
            id="tabBtnDma"
            className={`tab-btn btn-cyber-kinetic ${activeTab === 'dma' ? 'active' : ''}`}
            onClick={() => {
              try { soundFx.playClick(); } catch (e) {}
              setActiveTab('dma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Cpu size={18} /> DMA Modes
          </button>
          <button
            id="tabBtnMulticore"
            className={`tab-btn btn-cyber-kinetic ${activeTab === 'multicore' ? 'active' : ''}`}
            onClick={() => {
              try { soundFx.playClick(); } catch (e) {}
              setActiveTab('multicore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Layers size={18} /> Multicore vs Multiprocessor
          </button>
          <button
            id="tabBtnUnified"
            className={`tab-btn btn-cyber-kinetic ${activeTab === 'unified' ? 'active' : ''}`}
            onClick={() => {
              try { soundFx.playClick(); } catch (e) {}
              setActiveTab('unified');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Zap size={18} /> Unified System Lab
          </button>
        </nav>

        {/* FEATURE 4: FULLSCREEN CINEMA / PRESENTATION MODE TOGGLE */}
        <button
          className={`cinema-mode-btn ${isCinemaMode ? 'active' : ''}`}
          onClick={toggleCinemaMode}
          title="Toggle Presentation / Fullscreen Cinema Mode (Press F or ESC)"
        >
          {isCinemaMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span>{isCinemaMode ? 'EXIT CINEMA' : 'CINEMA MODE'}</span>
        </button>
      </div>

      {/* FLOATING CINEMA HUD CONTROLS */}
      {isCinemaMode && (
        <div className="cinema-floating-hud">
          <span className="cinema-pill-tag">⛶ CINEMA VIEW</span>
          <button
            className={`tab-btn ${activeTab === 'dma' ? 'active' : ''}`}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', borderRadius: '9999px' }}
            onClick={() => {
              setActiveTab('dma');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            DMA
          </button>
          <button
            className={`tab-btn ${activeTab === 'multicore' ? 'active' : ''}`}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', borderRadius: '9999px' }}
            onClick={() => {
              setActiveTab('multicore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            MULTICORE
          </button>
          <button
            className={`tab-btn ${activeTab === 'unified' ? 'active' : ''}`}
            style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', borderRadius: '9999px' }}
            onClick={() => {
              setActiveTab('unified');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            UNIFIED LAB
          </button>
          <button className="cinema-exit-btn" onClick={toggleCinemaMode} title="Exit Cinema Mode (ESC)">
            ✕ EXIT
          </button>
        </div>
      )}
    </header>
  );
}
