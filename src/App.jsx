import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DmaSimulator from './components/DmaSimulator';
import MultiArchitectureComparator from './components/MultiArchitectureComparator';
import UnifiedSystemLab from './components/UnifiedSystemLab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dma');
  const [theme, setTheme] = useState('cyberpunk');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('os_lab_theme', theme);
  }, [theme]);

  // FEATURE 4: AEROSPACE HUD CROSSHAIR TRACKER (100% GPU-DIRECT COMPOSITED)
  useEffect(() => {
    const reticle = document.getElementById('hudCursorReticle');
    const coordText = document.getElementById('hudCoordText');
    if (!reticle || !coordText) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          reticle.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
          reticle.style.opacity = '0.75';
          coordText.textContent = `LOC: X:${String(targetX).padStart(4, '0')} Y:${String(targetY).padStart(4, '0')} | 3.20GHz`;
          rafId = null;
        });
      }
    };

    const onMouseLeave = () => {
      reticle.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* AEROSPACE HUD RETICLE OVERLAY */}
      <div id="hudCursorReticle" className="hud-crosshair-reticle">
        <div className="hud-crosshair-lines"></div>
        <div className="hud-reticle-box"></div>
        <div id="hudCoordText" className="hud-coord-text">LOC: X:0000 Y:0000 | 3.20GHz</div>
      </div>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main>
        {activeTab === 'dma' && <DmaSimulator />}
        {activeTab === 'multicore' && <MultiArchitectureComparator />}
        {activeTab === 'unified' && <UnifiedSystemLab />}
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 2rem',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        OS-ArchLab • Operating System Overview Module 1 • Academic Research Lab Edition (DMA Modes & Multicore/Multiprocessor)
      </footer>
    </>
  );
}
