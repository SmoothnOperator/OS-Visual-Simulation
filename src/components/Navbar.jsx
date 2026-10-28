import React from 'react';
import { Zap, Cpu, Layers } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header>
      <div className="header-branding">
        <div className="brand-row">
          <span className="brand-title">
            <Zap size={26} color="var(--accent-blue)" /> OS-ArchLab
          </span>
        </div>
        <div className="brand-subtitle">
          Operating System Overview: Direct Memory Access (DMA) & Multiprocessor vs. Multicore
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === 'dma' ? 'active' : ''}`}
          onClick={() => setActiveTab('dma')}
        >
          <Cpu size={18} /> DMA Modes
        </button>
        <button
          className={`tab-btn ${activeTab === 'multicore' ? 'active' : ''}`}
          onClick={() => setActiveTab('multicore')}
        >
          <Layers size={18} /> Multicore vs Multiprocessor
        </button>
        <button
          className={`tab-btn ${activeTab === 'unified' ? 'active' : ''}`}
          onClick={() => setActiveTab('unified')}
        >
          <Zap size={18} /> Unified System Lab
        </button>
      </nav>
    </header>
  );
}
