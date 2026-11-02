import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DmaSimulator from './components/DmaSimulator';
import InstructionCycleLab from './components/InstructionCycleLab';
import StartupBootScreen from './components/StartupBootScreen';

const OPCODE_STREAM_LEFT = [
  '0x8000', 'DMA_BURST', 'HLDA=1', '0x4420', 'MOV AX,[BX]', '0x1000',
  'IRQ_LINE_31', 'HOLD_REQ', '0x8024', 'CYCLE_STEAL', '0x6210', 'DACK_ACK',
  'DREQ_LINE', 'IO_READ', 'MEMW_STROBE', '0x0400', 'BUS_GRANT', '0x8000',
  'DMA_BURST', 'HLDA=1', '0x4420', 'MOV AX,[BX]', '0x1000', 'IRQ_LINE_31',
  'HOLD_REQ', '0x8024', 'CYCLE_STEAL', '0x6210', 'DACK_ACK', 'DREQ_LINE'
];

const OPCODE_STREAM_RIGHT = [
  'PC_100', 'MAR_LOAD', 'MEM_READ', 'MDR_FETCH', 'IR_LOAD', 'CU_DECODE',
  'ALU_ADD', 'STORE_700', 'DRAM_CYCLE', '0x7FF0', 'DMA_BURST', '0x8840',
  '0x3020', 'PAGE_FRAME', 'SNOOP_BUS', '0x1240', 'PC_101', 'MAR_LOAD',
  'MEM_READ', 'MDR_FETCH', 'IR_LOAD', 'CU_DECODE', 'ALU_ADD', 'STORE_700'
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

      {/* AMBIENT OPCODE DIGITAL STREAM (LEFT & RIGHT WATERFALLS) */}
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
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 2rem',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        OS-ArchLab • Operating System Overview Hardware Visualizer • DMA Transfer Modes & CPU Instruction Execution Cycle
      </footer>
    </>
  );
}
