import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DmaSimulator from './components/DmaSimulator';
import MultiArchitectureComparator from './components/MultiArchitectureComparator';
import UnifiedSystemLab from './components/UnifiedSystemLab';
import StartupBootScreen from './components/StartupBootScreen';

const OPCODE_STREAM_LEFT = [
  '0x8000', 'DMA_BURST', 'HLDA=1', '0x4420', 'MOV AX,[BX]', '0x1000',
  'IRQ_LINE_31', 'HOLD_REQ', '0x8024', 'L3_HIT:0.8ns', 'CYCLE_STEAL',
  '0x6210', 'DACK_ACK', 'DREQ_LINE', '0x80FF', 'CACHE_SYNC', 'IO_READ',
  'MEMW_STROBE', '0x0400', 'BUS_GRANT', '0x8000', 'DMA_BURST', 'HLDA=1',
  '0x4420', 'MOV AX,[BX]', '0x1000', 'IRQ_LINE_31', 'HOLD_REQ', '0x8024',
  'L3_HIT:0.8ns', 'CYCLE_STEAL', '0x6210', 'DACK_ACK', 'DREQ_LINE'
];

const OPCODE_STREAM_RIGHT = [
  'SMP_BUS', '0x8A10', 'CORE1_RUN', 'SOCKET2_OK', '0x2100', 'ARBITER_WAIT',
  'DRAM_CYCLE', '0x7FF0', 'DMA_BURST', '0x8840', 'CROSSBAR_RD', 'LAT_15ns',
  '0x3020', 'OCTA_CORE', 'DIE_TEMP', '0x9000', 'DIST_MEM', 'SNOOP_BUS',
  '0x1240', 'LOCK_PF', 'SMP_BUS', '0x8A10', 'CORE1_RUN', 'SOCKET2_OK',
  '0x2100', 'ARBITER_WAIT', 'DRAM_CYCLE', '0x7FF0', 'CYCLE_ACC', '0x8840'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dma');
  const [theme, setTheme] = useState('cyberpunk');
  const [showBootScreen, setShowBootScreen] = useState(true);

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
      {/* STARTUP CYBER BOOT SEQUENCE & LOGO ANIMATION */}
      {showBootScreen && (
        <StartupBootScreen onComplete={() => setShowBootScreen(false)} />
      )}

      {/* AEROSPACE HUD RETICLE OVERLAY */}
      <div id="hudCursorReticle" className="hud-crosshair-reticle">
        <div className="hud-crosshair-lines"></div>
        <div className="hud-reticle-box"></div>
        <div id="hudCoordText" className="hud-coord-text">LOC: X:0000 Y:0000 | 3.20GHz</div>
      </div>

      {/* FEATURE 5: AMBIENT OPCODE DIGITAL STREAM (LEFT & RIGHT WATERFALLS) */}
      <aside className="ambient-stream-gutter left" aria-hidden="true">
        <div className="ambient-stream-content">
          {OPCODE_STREAM_LEFT.map((op, i) => (
            <span key={i}>{op}</span>
          ))}
        </div>
      </aside>

      <aside className="ambient-stream-gutter right" aria-hidden="true">
        <div className="ambient-stream-content">
          {OPCODE_STREAM_RIGHT.map((op, i) => (
            <span key={i}>{op}</span>
          ))}
        </div>
      </aside>

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReboot={() => setShowBootScreen(true)}
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
