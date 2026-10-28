import React, { useState } from 'react';
import { Zap, Cpu, Layers, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export default function Navbar({ activeTab, setActiveTab }) {
  const [sfxEnabled, setSfxEnabled] = useState(false);

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
          <span className="brand-title">
            <Zap size={26} color="var(--accent-blue)" className="anim-clock-pulse" /> OS-ArchLab
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

      <nav className="nav-tabs">
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'dma' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            setActiveTab('dma');
          }}
        >
          <Cpu size={18} /> DMA Modes
        </button>
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'multicore' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            setActiveTab('multicore');
          }}
        >
          <Layers size={18} /> Multicore vs Multiprocessor
        </button>
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => {
            soundFx.playClick();
            setActiveTab('unified');
          }}
        >
          <Zap size={18} /> Unified System Lab
        </button>
      </nav>
    </header>
  );
}
