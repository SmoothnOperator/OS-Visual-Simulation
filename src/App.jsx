import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DmaSimulator from './components/DmaSimulator';
import InstructionCycleLab from './components/InstructionCycleLab';
import MemoryHierarchyLab from './components/MemoryHierarchyLab';
import StartupBootScreen from './components/StartupBootScreen';

const OPCODE_STREAM_LEFT = [
  '0x8000', 'DMA_BURST', 'HLDA=1', '0x4420', 'MOV AX,[BX]', '0x1000',
  'IRQ_LINE_31', 'HOLD_REQ', '0x8024', 'L1_HIT:1.0ns', 'CYCLE_STEAL',
  '0x6210', 'DACK_ACK', 'DREQ_LINE', '0x80FF', 'CACHE_TAG_0x10', 'IO_READ',
  'MEMW_STROBE', '0x0400', 'BUS_GRANT', '0x8000', 'DMA_BURST', 'HLDA=1',
  '0x4420', 'MOV AX,[BX]', '0x1000', 'IRQ_LINE_31', 'HOLD_REQ', '0x8024',
  'L1_HIT:1.0ns', 'CYCLE_STEAL', '0x6210', 'DACK_ACK', 'DREQ_LINE'
];

const OPCODE_STREAM_RIGHT = [
  'SRAM_6T', '0x8A10', 'L2_ACCESS', 'TAG_MATCH', '0x2100', 'AMAT_1.6ns',
  'DRAM_CYCLE', '0x7FF0', 'DMA_BURST', '0x8840', 'LINE_FILL_64B', 'LAT_12ns',
  '0x3020', 'SPATIAL_HIT', 'TEMPORAL', '0x9000', 'PAGE_FRAME', 'SNOOP_BUS',
  '0x1240', 'CACHE_MISS', 'SRAM_6T', '0x8A10', 'L2_ACCESS', 'TAG_MATCH',
  '0x2100', 'AMAT_1.6ns', 'DRAM_CYCLE', '0x7FF0', 'CYCLE_ACC', '0x8840'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dma');
  const [theme, setTheme] = useState('cyberpunk');
  const [showBootScreen, setShowBootScreen] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('os_lab_theme', theme);
  }, [theme]);

  return (
    <>
      {/* STARTUP CYBER BOOT SEQUENCE & LOGO ANIMATION */}
      {showBootScreen && (
        <StartupBootScreen onComplete={() => setShowBootScreen(false)} />
      )}

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
        {activeTab === 'instruction' && <InstructionCycleLab />}
        {activeTab === 'memory' && <MemoryHierarchyLab />}
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 2rem',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        OS-ArchLab • Operating System Overview Hardware Visualizer • DMA Modes • Instruction Cycle • Memory Hierarchy & Cache
      </footer>
    </>
  );
}
