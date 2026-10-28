import React from 'react';
import { Zap, Cpu, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
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
        </div>
        <div className="brand-subtitle">
          Operating System Overview: Direct Memory Access (DMA) & Multiprocessor vs. Multicore
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'dma' ? 'active' : ''}`}
          onClick={() => setActiveTab('dma')}
        >
          <Cpu size={18} /> DMA Modes
        </button>
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'multicore' ? 'active' : ''}`}
          onClick={() => setActiveTab('multicore')}
        >
          <Layers size={18} /> Multicore vs Multiprocessor
        </button>
        <button
          className={`tab-btn btn-cyber-kinetic ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unified')}
        >
          <Zap size={18} /> Unified System Lab
        </button>
      </nav>
    </header>
  );
}
