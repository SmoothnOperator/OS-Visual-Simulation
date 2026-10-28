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

  return (
    <>
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
