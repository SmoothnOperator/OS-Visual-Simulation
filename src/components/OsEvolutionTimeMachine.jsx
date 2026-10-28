import React, { useState } from 'react';
import { Play, RotateCcw, Clock, Sparkles, Cpu, HardDrive } from 'lucide-react';

const ERAS = [
  {
    id: 1,
    gen: '1st Gen (1940s-50s)',
    title: 'Vacuum Tubes & Plugboards',
    tech: 'ENIAC (1945), UNIVAC (1951)',
    eraTag: '1st Gen: Vacuum Tubes',
    hardware: '20,000 Vacuum Tubes, Physical Plugboard Wires',
    ioMode: 'Manual Programmed I/O (No OS, No DMA)',
    cpuClock: '100 kHz',
    ioSpeed: '100 Bytes/sec (Punch Cards)',
    cpuUtilization: 8,
    wastedCpu: 92,
    packaging: 'Entire Room (30 Tons)',
    cost: '$500,000 (1950 USD)',
    summary: 'First Generation: Programmers plugged physical wires into plugboards and reserved time on wall sign-up sheets. The CPU directly drove mechanical card readers, wasting 92% of its cycles waiting on human and mechanical delays.',
    simulationTitle: 'ENIAC Punch-Card Read Cycle',
    dmaPresent: false,
    multicorePresent: false
  },
  {
    id: 2,
    gen: '2nd Gen (1950s-60s)',
    title: 'Transistors & Batch Systems',
    tech: 'IBM 7094 Mainframe',
    eraTag: '2nd Gen: Transistors & Batch',
    hardware: 'Discrete Transistors, Magnetic Core Memory',
    ioMode: 'Batch Systems (Separate I/O & Compute Machines)',
    cpuClock: '2 MHz',
    ioSpeed: '20 KB/sec (Magnetic Tape Reels)',
    cpuUtilization: 22,
    wastedCpu: 78,
    packaging: 'Several Large Cabinets',
    cost: '$2,000,000 (1962 USD)',
    summary: 'Second Generation: Transistors made computers dependable. Programs were grouped into "jobs" and read from magnetic tape. However, the CPU still stalled on tape transfers until the entire batch completed.',
    simulationTitle: 'IBM 7094 Tape Reel Batch Feed',
    dmaPresent: false,
    multicorePresent: false
  },
  {
    id: 3,
    gen: '3rd Gen (1960s-70s)',
    title: 'Integrated Circuits & DMA Birth',
    tech: 'IBM System/360, UNIX',
    eraTag: '3rd Gen: ICs & DMA',
    hardware: 'Small-Scale Integrated Circuits (ICs), Magnetic Disks',
    ioMode: 'Direct Memory Access (DMA) + Spooling & Time-Sharing',
    cpuClock: '10 MHz',
    ioSpeed: '1.5 MB/sec (IBM 2314 Disk Drive)',
    cpuUtilization: 78,
    wastedCpu: 22,
    packaging: 'Single Air-Conditioned Server Room',
    cost: '$250,000 (1970 USD)',
    summary: 'Third Generation: THE TURNING POINT! Integrated circuits enabled the invention of DMA ("Station Master") and Multiprogramming. While DMA copied disk sectors to RAM, the CPU switched to another program! CPU utilization jumped from 22% to 78%!',
    simulationTitle: 'IBM System/360 DMA Spooling Cycle',
    dmaPresent: true,
    multicorePresent: false
  },
  {
    id: 4,
    gen: '4th Gen (1980s-90s)',
    title: 'Microchips & Multiprocessors',
    tech: 'Personal Computers, Intel x86, UNIX SMP',
    eraTag: '4th Gen: Multiprocessors',
    hardware: 'VLSI Microprocessors, Multi-Socket Motherboards',
    ioMode: 'PCI Bus Master DMA + Symmetric Multiprocessors (SMP)',
    cpuClock: '100 MHz - 1 GHz',
    ioSpeed: '133 MB/sec (Ultra-ATA / PCI Bus)',
    cpuUtilization: 88,
    wastedCpu: 12,
    packaging: 'Desktop Tower / Server Rack',
    cost: '$2,500 (1995 USD)',
    summary: 'Fourth Generation: Microchips put a full CPU on a single silicon chip. Multiple physical CPUs were plugged into motherboard sockets (Symmetric Multiprocessing) sharing the system bus through a Bus Arbiter.',
    simulationTitle: 'Dual-Socket SMP Bus Arbitration',
    dmaPresent: true,
    multicorePresent: false,
    multiprocessorPresent: true
  },
  {
    id: 5,
    gen: '5th Gen (2000s-Present)',
    title: 'Multicore & NVMe Direct DMA',
    tech: 'Modern PCs, Cloud Datacenters, Smartphones',
    eraTag: '5th Gen: Multicore Era',
    hardware: 'Ultra Large Scale Integration (ULSI), 4-16 Cores on 1 Die',
    ioMode: 'PCIe 5.0 Direct NVMe DMA + Shared On-Chip L3 Cache',
    cpuClock: '3.5 - 5.5 GHz',
    ioSpeed: '7,000 MB/sec (PCIe 5.0 NVMe SSD)',
    cpuUtilization: 96,
    wastedCpu: 4,
    packaging: '140 mm² Silicon Die (Pocket Sized)',
    cost: '$350 (2026 USD)',
    summary: 'Fifth Generation: Multiple execution cores reside on a single integrated silicon chip sharing an ultra-fast on-chip L3 cache. Ultra-high speed direct DMA transfers gigabytes of data per second with virtually zero CPU stalls.',
    simulationTitle: 'Octa-Core On-Chip L3 + NVMe Direct Stream',
    dmaPresent: true,
    multicorePresent: true
  }
];

export default function OsEvolutionTimeMachine() {
  const [selectedEraId, setSelectedEraId] = useState(3); // Start at 3rd Gen (where DMA was born)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const era = ERAS.find(e => e.id === selectedEraId) || ERAS[2];

  const runEraSimulation = () => {
    setIsSimulating(true);
    setSimProgress(0);

    let progress = 0;
    const intervalSpeed = era.id === 1 ? 250 : (era.id === 2 ? 180 : (era.id === 3 ? 120 : (era.id === 4 ? 80 : 40)));

    const timer = setInterval(() => {
      progress += 10;
      setSimProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        setIsSimulating(false);
      }
    }, intervalSpeed);
  };

  return (
    <section className="tab-pane active">
      {/* TIMELINE STEPPER */}
      <div className="era-stepper-container">
        {ERAS.map((item) => (
          <button
            key={item.id}
            className={`era-step-btn ${selectedEraId === item.id ? 'era-active' : ''}`}
            onClick={() => {
              setSelectedEraId(item.id);
              setIsSimulating(false);
              setSimProgress(0);
            }}
          >
            <span className="era-year-badge">{item.gen}</span>
            <span className="era-name-title">{item.title}</span>
            <span className="era-tech-tag">{item.tech}</span>
          </button>
        ))}
      </div>

      {/* PEDAGOGICAL ERA BANNER */}
      <div className="narration-banner" style={{ borderLeftColor: 'var(--accent-amber)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="narration-icon">⏳</div>
          <div className="audio-equalizer">
            <div className="eq-bar" style={{ background: 'var(--accent-amber)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-amber)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-amber)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-amber)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-amber)' }}></div>
          </div>
        </div>
        <div className="narration-text">
          <div className="narration-title">{era.gen}: {era.title}</div>
          <div className="narration-message">{era.summary}</div>
        </div>
      </div>

      {/* SHOWCASE GRID */}
      <div className="era-showcase-grid">
        {/* LEFT: ARCHITECTURAL HARDWARE SIMULATOR FOR THIS ERA */}
        <div className="era-visual-box">
          <div className="card-heading" style={{ borderBottomColor: 'var(--border-strong)' }}>
            <span>Era Hardware Architecture & I/O Flow</span>
            <span className="badge-status badge-amber">{era.tech}</span>
          </div>

          {/* SIMULATION VISUAL BOXES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* CPU NODE IN THIS ERA */}
            <div className={`hardware-node ${isSimulating && era.id <= 2 ? 'node-stalled' : 'node-master'}`}>
              <div className="node-header">
                <span className="node-title" style={{ color: 'var(--accent-blue)' }}>
                  {era.multicorePresent ? '8-Core Silicon Die' : (era.multiprocessorPresent ? 'Dual SMP Sockets' : 'Single CPU')}
                </span>
                <span className={`badge-status ${isSimulating && era.id <= 2 ? 'badge-red' : 'badge-green'}`}>
                  {isSimulating ? (era.id <= 2 ? 'STALLED (WAITING I/O)' : (era.id === 3 ? 'MULTIPROGRAMMING' : 'COMPUTING')) : 'IDLE / READY'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clock: {era.cpuClock}</p>
              <div style={{ fontSize: '0.82rem', color: era.id <= 2 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700, marginTop: '0.5rem' }}>
                {era.id === 1 && 'No DMA: CPU reads card bit-by-bit'}
                {era.id === 2 && 'CPU halted during magnetic tape rewind'}
                {era.id === 3 && 'DMA copies to RAM; CPU runs Job B!'}
                {era.id === 4 && 'SMP CPUs arbitrate over motherboard'}
                {era.id === 5 && 'All 8 cores active; on-chip L3 hit'}
              </div>
            </div>

            {/* I/O CONTROLLER IN THIS ERA */}
            <div className={`hardware-node ${era.dmaPresent ? 'node-master' : ''}`}>
              <div className="node-header">
                <span className="node-title" style={{ color: 'var(--accent-green)' }}>
                  {era.dmaPresent ? 'DMA Controller ("Station Master")' : 'Manual I/O Channel'}
                </span>
                <span className={`badge-status ${era.dmaPresent ? 'badge-green' : 'badge-amber'}`}>
                  {era.dmaPresent ? 'HARDWARE DMA' : 'PROGRAMMED I/O'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Bandwidth: {era.ioSpeed}</p>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {era.ioMode}
              </div>
            </div>
          </div>

          {/* SIMULATION BENCHMARK RUNNER */}
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{era.simulationTitle}</span>
              <button
                className="btn btn-primary"
                onClick={runEraSimulation}
                disabled={isSimulating}
              >
                <Play size={16} /> {isSimulating ? 'Transferring...' : 'Simulate 100 KB Transfer'}
              </button>
            </div>

            {/* LIVE HARDWARE ANIMATION MONITOR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem', background: '#070d1a', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', gap: '1rem', overflow: 'hidden' }}>
              {era.id === 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--accent-amber)' }}>
                  <span className={isSimulating ? 'anim-punch-card' : ''}>🗃️ ═══[Punch Card Feed]═══&gt;</span>
                  <span>{isSimulating ? 'Feeding physical card through punch brush...' : 'Mechanical card reader ready'}</span>
                </div>
              )}
              {era.id === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--accent-blue)' }}>
                  <span className={isSimulating ? 'anim-spin-reel' : ''} style={{ fontSize: '1.25rem' }}>📼</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>═══ [Magnetic Tape] ═══</span>
                  <span className={isSimulating ? 'anim-spin-reel' : ''} style={{ fontSize: '1.25rem', animationDirection: 'reverse' }}>📼</span>
                  <span>{isSimulating ? 'Tape reels spinning at 20 KB/sec...' : 'Tape mounted and primed'}</span>
                </div>
              )}
              {era.id === 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--accent-green)' }}>
                  <span className="anim-clock-pulse">⚡</span>
                  <span className="anim-laser-active" style={{ padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)', borderRadius: '4px' }}>
                    IBM System/360 Multiplexer Channel: DMA Direct to RAM (1.5 MB/s)
                  </span>
                </div>
              )}
              {era.id === 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--accent-purple)', width: '100%', position: 'relative' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>PCI Bus Master DMA:</span>
                  <div className="bus-physical-line packet-stream-track" style={{ flex: 1, height: '6px' }}>
                    <div className="floating-data-packet packet-amber"></div>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>133 MB/s</span>
                </div>
              )}
              {era.id === 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--accent-cyan)', width: '100%', position: 'relative' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>NVMe PCIe 5.0 x4 DMA:</span>
                  <div className="bus-physical-line packet-stream-track" style={{ flex: 1, height: '6px' }}>
                    <div className="floating-data-packet" style={{ animationDuration: '0.5s' }}></div>
                    <div className="floating-data-packet packet-ctrl" style={{ animationDuration: '0.4s', animationDelay: '0.2s' }}></div>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>7,000 MB/s 🔥</span>
                </div>
              )}
            </div>

            <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  width: `${simProgress}%`,
                  height: '100%',
                  background: era.id <= 2 ? 'linear-gradient(90deg, #f43f5e, #f59e0b)' : 'linear-gradient(90deg, #0284c7, #10b981)',
                  transition: 'width 0.1s linear'
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>Progress: <strong>{simProgress}%</strong></span>
              <span>
                {era.id === 1 && 'Takes 15+ minutes in real life'}
                {era.id === 2 && 'Takes 5 seconds on tape'}
                {era.id === 3 && 'DMA finished in 65ms without CPU delay'}
                {era.id === 4 && 'Finished in 0.8ms'}
                {era.id === 5 && 'Finished in 0.014ms (Instant NVMe DMA)'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: HISTORICAL METRICS & HARDWARE SPECS */}
        <div className="glass-card">
          <div className="card-heading">
            <span>Historical Telemetry & Specs</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>Architectural Era</span>
          </div>

          <div className="era-telemetry-grid">
            <div className="stat-card">
              <span className="stat-label">CPU Utilization</span>
              <span
                className="stat-value"
                style={{ color: era.cpuUtilization < 30 ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '2rem' }}
              >
                {era.cpuUtilization}%
              </span>
              <span className="stat-explanation">
                {era.wastedCpu}% of CPU time wasted waiting on mechanical I/O.
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">I/O Bandwidth</span>
              <span className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.45rem' }}>
                {era.ioSpeed}
              </span>
              <span className="stat-explanation">Physical transfer speed to storage.</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Hardware Packaging</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {era.packaging}
              </span>
              <span className="stat-explanation">Physical floor space footprint.</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Approximate Cost</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {era.cost}
              </span>
              <span className="stat-explanation">Cost of hardware deployment.</span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-blue)' }}>Key Takeaway for Faculty:</strong>
            <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
              Without DMA (1st & 2nd Gen), computers were bottlenecked by slow peripheral I/O. The invention of DMA in the 3rd Gen (IBM 360) 
              unlocked <strong>multiprogramming</strong>, and the 5th Gen integrated everything into <strong>multicore silicon dies</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
