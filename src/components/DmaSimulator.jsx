import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Cpu, Layers } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export default function DmaSimulator() {
  const [mode, setMode] = useState('burst');
  const [blockSize, setBlockSize] = useState(16);
  const [speed, setSpeed] = useState(700);
  const [isRunning, setIsRunning] = useState(false);

  const [currentClock, setCurrentClock] = useState(0);
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [cpuWorkCycles, setCpuWorkCycles] = useState(0);
  const [cpuStallCycles, setCpuStallCycles] = useState(0);

  const [busOwner, setBusOwner] = useState('CPU');
  const [cpuState, setCpuState] = useState('work');
  const [dmaState, setDmaState] = useState('idle');

  const [ganttHistory, setGanttHistory] = useState([]);
  const [narration, setNarration] = useState({
    title: 'System Initialized',
    msg: 'DMA configured for 16-byte transfer. CPU is currently bus master.'
  });

  const timerRef = useRef(null);
  const stepCycleRef = useRef(null);
  stepCycleRef.current = stepCycle;

  // Rock-solid non-thrashing interval
  useEffect(() => {
    if (isRunning) {
      const intervalId = setInterval(() => {
        if (stepCycleRef.current) {
          stepCycleRef.current();
        }
      }, speed);
      return () => clearInterval(intervalId);
    }
  }, [isRunning, speed]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetSimulation(newMode, blockSize);
  };

  const handleSizeChange = (newSize) => {
    const size = parseInt(newSize, 10);
    setBlockSize(size);
    resetSimulation(mode, size);
  };

  const toggleExecution = () => {
    if (transferredBytes >= blockSize) {
      resetSimulation(mode, blockSize);
    }
    setIsRunning(!isRunning);
  };

  const resetSimulation = (targetMode = mode, targetSize = blockSize) => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setCurrentClock(0);
    setTransferredBytes(0);
    setCpuWorkCycles(0);
    setCpuStallCycles(0);
    setBusOwner('CPU');
    setCpuState('work');
    setDmaState('idle');
    setGanttHistory([]);

    let note = 'Burst Mode (Slide 15): Transfers entire block continuously. CPU is stalled throughout.';
    if (targetMode === 'stealing') {
      note = 'Cycle Stealing Mode (Slide 15): DMA steals 1 clock cycle for 1 byte, then yields back to CPU.';
    } else if (targetMode === 'transparent') {
      note = 'Transparent Mode (Slide 15): DMA sneaks cycles only during CPU internal ALU execution. Zero CPU stalls!';
    }

    setNarration({
      title: 'Simulation Reset',
      msg: `${note} Click "Start Transfer" to run.`
    });
  };

  const stepCycle = () => {
    if (transferredBytes >= blockSize) {
      setIsRunning(false);
      clearInterval(timerRef.current);
      setNarration({
        title: 'DMA Sequence Completed (Interrupt Triggered)',
        msg: `Slide 14 Step 6: All ${blockSize} bytes written to RAM. DMA releases bus and fires completion interrupt (IRQ) to CPU.`
      });
      return;
    }

    const nextClock = currentClock + 1;
    let nextCpuState = 'work';
    let nextBusOwner = 'CPU';
    let nextDmaState = 'idle';
    let nextTransferred = transferredBytes;
    let nextCpuWork = cpuWorkCycles;
    let nextCpuStall = cpuStallCycles;
    let explanation = '';

    if (mode === 'burst') {
      nextCpuState = 'stall';
      nextBusOwner = 'DMA';
      nextDmaState = 'transfer';
      nextTransferred += 1;
      nextCpuStall += 1;
      explanation = `Cycle ${nextClock} [Burst Mode]: DMA Controller holds the system bus. Transferred Byte ${nextTransferred} directly to RAM 0x${(0x8000 + nextTransferred - 1).toString(16).toUpperCase()}. CPU is STALLED.`;
    } else if (mode === 'stealing') {
      if (nextClock % 2 === 1) {
        nextCpuState = 'stall';
        nextBusOwner = 'DMA';
        nextDmaState = 'transfer';
        nextTransferred += 1;
        nextCpuStall += 1;
        explanation = `Cycle ${nextClock} [Cycle Stealing]: DMA stole this single clock cycle. Transferred Byte ${nextTransferred} to RAM. Bus will be yielded back to CPU on next clock.`;
      } else {
        nextCpuState = 'work';
        nextBusOwner = 'CPU';
        nextDmaState = 'wait';
        nextCpuWork += 1;
        explanation = `Cycle ${nextClock} [Cycle Stealing]: CPU regained bus mastership and executed instructions without delay while DMA prepared next byte.`;
      }
    } else if (mode === 'transparent') {
      nextCpuState = 'work';
      nextBusOwner = 'DMA (Hidden)';
      nextDmaState = 'transfer';
      nextTransferred += 1;
      nextCpuWork += 1;
      explanation = `Cycle ${nextClock} [Transparent Mode]: CPU is executing internal ALU/Decode instructions and does not require system bus. DMA transferred Byte ${nextTransferred} with ZERO CPU stalls!`;
    }

    setCurrentClock(nextClock);
    setTransferredBytes(nextTransferred);
    setCpuWorkCycles(nextCpuWork);
    setCpuStallCycles(nextCpuStall);
    setBusOwner(nextBusOwner);
    setCpuState(nextCpuState);
    setDmaState(nextDmaState);

    if (nextTransferred > transferredBytes) {
      soundFx.playDmaByteTransfer();
    } else {
      soundFx.playClockTick();
    }

    setNarration({
      title: `Clock Cycle ${nextClock} Execution`,
      msg: explanation
    });

    const newRecord = {
      cycle: nextClock,
      cpu: nextCpuState,
      bus: nextBusOwner,
      dma: nextDmaState
    };

    setGanttHistory(prev => {
      const updated = [...prev, newRecord];
      if (updated.length > 20) updated.shift();
      return updated;
    });

    if (nextTransferred >= blockSize) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    }
  };

  const totalMeasured = cpuWorkCycles + cpuStallCycles;
  const cpuUtilization = totalMeasured > 0 ? Math.round((cpuWorkCycles / totalMeasured) * 100) : 100;
  const currentRamAddr = 0x8000 + (transferredBytes > 0 ? transferredBytes - 1 : 0);

  return (
    <section className="tab-pane active">
      {/* CONTROLS STRIP */}
      <div className="controls-card">
        <div className="control-cluster">
          <span className="control-label">Transfer Mode:</span>
          <select
            className="select-dropdown"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value)}
          >
            <option value="burst">Burst Mode (Block Transfer - Slide 15)</option>
            <option value="stealing">Cycle Stealing Mode (1 Byte/Cycle - Slide 15)</option>
            <option value="transparent">Transparent Mode (CPU Idle Cycles Only - Slide 15)</option>
          </select>
        </div>

        <div className="control-cluster">
          <span className="control-label">Block Size:</span>
          <select
            className="select-dropdown"
            value={blockSize}
            onChange={(e) => handleSizeChange(e.target.value)}
          >
            <option value="8">8 Bytes</option>
            <option value="16">16 Bytes (Standard)</option>
            <option value="24">24 Bytes</option>
          </select>
        </div>

        <div className="control-cluster">
          <button
            className={`btn btn-cyber-kinetic ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleExecution}
          >
            {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Start Transfer</>}
          </button>
          <button className="btn btn-secondary btn-cyber-kinetic" onClick={stepCycle}>
            <SkipForward size={16} /> Step Cycle
          </button>
          <button className="btn btn-secondary btn-cyber-kinetic" onClick={() => resetSimulation(mode, blockSize)}>
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="control-cluster">
          <span className="control-label">Speed:</span>
          <select
            className="select-dropdown"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
          >
            <option value="1200">0.5x (Slow)</option>
            <option value="700">1.0x (Standard)</option>
            <option value="350">2.0x (Fast)</option>
          </select>
        </div>
      </div>

      {/* PEDAGOGICAL NARRATION BANNER */}
      <div className="narration-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="narration-icon">🎙️</div>
          <div className="audio-equalizer">
            <div className="eq-bar"></div>
            <div className="eq-bar"></div>
            <div className="eq-bar"></div>
            <div className="eq-bar"></div>
            <div className="eq-bar"></div>
            <div className="eq-bar"></div>
          </div>
        </div>
        <div className="narration-text">
          <div className="narration-title">{narration.title}</div>
          <div className="narration-message">{narration.msg}</div>
        </div>
      </div>

      {/* HARDWARE GRID */}
      <div className="layout-grid">
        {/* SCHEMATIC */}
        <div className="glass-card">
          <div className="card-heading">
            <span>Hardware Interconnect & Register State (Slide 14)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="anim-clock-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid var(--accent-blue)', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.76rem', color: 'var(--accent-blue)', fontWeight: 800 }}>
                ⚡ CLK TICK #{currentClock}
              </div>
              <span className={`badge-status ${busOwner.includes('DMA') ? 'badge-green' : 'badge-blue'}`}>
                {busOwner.includes('DMA') ? 'DMA BUS MASTER' : 'CPU BUS MASTER'}
              </span>
            </div>
          </div>

          <div className="schematic-box-row">
            {/* CPU NODE */}
            <div className={`hardware-node card-hud-corner ${busOwner === 'CPU' ? 'node-master' : ''} ${cpuState === 'stall' ? 'hazard-stalled-overlay' : ''}`}>
              <div className="node-header">
                <span className="node-title">CPU (Processor)</span>
                <span className={`badge-status ${cpuState === 'stall' ? 'badge-red' : 'badge-green'}`}>
                  {cpuState === 'stall' ? '⚠️ STALLED' : 'RUNNING'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Instruction Cycle: Fetch → Decode → Exec
              </p>
              <table className="register-table">
                <tbody>
                  <tr>
                    <td className="reg-label">Program Counter:</td>
                    <td className="reg-value reg-val-live">0x{(0x0400 + currentClock * 4).toString(16).toUpperCase().padStart(4, '0')}</td>
                  </tr>
                  <tr>
                    <td className="reg-label">HOLD In (Req):</td>
                    <td className="reg-value" style={{ color: busOwner.includes('DMA') ? 'var(--accent-red)' : 'inherit' }}>
                      {busOwner.includes('DMA') ? '1 (Active Lock)' : '0 (Low)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="reg-label">HLDA Out (Grant):</td>
                    <td className="reg-value" style={{ color: busOwner.includes('DMA') ? 'var(--accent-red)' : 'inherit' }}>
                      {busOwner.includes('DMA') ? '1 (Buses Tri-Stated)' : '0 (Low)'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.82rem', color: cpuState === 'stall' ? 'var(--accent-red)' : 'var(--accent-blue)', fontWeight: 700 }}>
                  {cpuState === 'stall' ? '⚡ CPU BUS LOCKED' : '⚡ EXECUTING COMPUTE'}
                </span>
                {cpuState !== 'stall' && (
                  <div className="audio-equalizer" style={{ height: '14px' }}>
                    <div className="eq-bar" style={{ width: '2px', height: '10px' }}></div>
                    <div className="eq-bar" style={{ width: '2px', height: '14px' }}></div>
                    <div className="eq-bar" style={{ width: '2px', height: '8px' }}></div>
                  </div>
                )}
              </div>

              {/* 4-STAGE INSTRUCTION PIPELINE CONVEYOR */}
              <div className="pipeline-conveyor-container" title="CPU Instruction Pipeline Execution Stages">
                <div className={`pipeline-stage-box ${cpuState === 'stall' ? 'stage-frozen' : (currentClock % 4 === 1 ? 'stage-active' : '')}`}>
                  {cpuState === 'stall' ? '🔒 FETCH' : '1. FETCH'}
                </div>
                <div className={`pipeline-stage-box ${cpuState === 'stall' ? 'stage-frozen' : (currentClock % 4 === 2 ? 'stage-active' : '')}`}>
                  {cpuState === 'stall' ? '🔒 DECODE' : '2. DECODE'}
                </div>
                <div className={`pipeline-stage-box ${cpuState === 'stall' ? 'stage-frozen' : (currentClock % 4 === 3 ? 'stage-active' : '')}`}>
                  {cpuState === 'stall' ? '🔒 EXEC' : '3. EXEC'}
                </div>
                <div className={`pipeline-stage-box ${cpuState === 'stall' ? 'stage-frozen' : (currentClock % 4 === 0 ? 'stage-active' : '')}`}>
                  {cpuState === 'stall' ? '🔒 WRITE' : '4. WRITE'}
                </div>
              </div>
            </div>

            {/* DMA CONTROLLER NODE */}
            <div className={`hardware-node card-hud-corner ${busOwner.includes('DMA') ? 'node-master' : ''}`} style={{ position: 'relative' }}>
              {busOwner.includes('DMA') && <div className="radar-ping-ring"></div>}
              <div className="node-header">
                <span className="node-title">DMA Controller (8237)</span>
                <span className={`badge-status ${busOwner.includes('DMA') ? 'badge-green' : 'badge-amber'}`}>
                  {transferredBytes >= blockSize ? 'DONE / IRQ' : (busOwner.includes('DMA') ? 'ACTIVE MASTER' : 'IDLE')}
                </span>
              </div>
              <table className="register-table">
                <tbody>
                  <tr>
                    <td className="reg-label">Source Register:</td>
                    <td className="reg-value">0x1000 (NVMe)</td>
                  </tr>
                  <tr>
                    <td className="reg-label">Dest Register:</td>
                    <td className="reg-value reg-val-live">0x{(0x8000 + transferredBytes).toString(16).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td className="reg-label">Byte Count Reg:</td>
                    <td className="reg-value reg-val-live">{blockSize - transferredBytes}</td>
                  </tr>
                  <tr>
                    <td className="reg-label">Bus Master:</td>
                    <td className="reg-value" style={{ color: busOwner.includes('DMA') ? 'var(--accent-green)' : 'inherit', fontWeight: 700 }}>
                      {busOwner.includes('DMA') ? 'YES (CLAIMED)' : 'NO (IDLE)'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  Mode: {mode.toUpperCase()}
                </span>
                {busOwner.includes('DMA') && (
                  <span className="anim-clock-pulse" style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 800 }}>
                    ACTIVE STREAMING ⚡
                  </span>
                )}
              </div>
            </div>

            {/* I/O PERIPHERAL NODE */}
            <div className="hardware-node card-hud-corner">
              <div className="node-header">
                <span className="node-title">I/O Peripheral</span>
                <span className="badge-status badge-blue">BUFFERED</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NVMe SSD FIFO Buffer</p>
              <table className="register-table">
                <tbody>
                  <tr>
                    <td className="reg-label">Buffer Ready:</td>
                    <td className="reg-value">{blockSize} Bytes</td>
                  </tr>
                  <tr>
                    <td className="reg-label">DREQ Line:</td>
                    <td className="reg-value" style={{ color: 'var(--accent-green)' }}>1 (Active)</td>
                  </tr>
                  <tr>
                    <td className="reg-label">DACK Line:</td>
                    <td className="reg-value">{busOwner.includes('DMA') ? '1 (Ack)' : '0'}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Direct RAM DMA Transfer
              </div>
            </div>
          </div>

          {/* FLOWING CONDUIT WIRES (CPU / DMA / I/O -> BUS) */}
          <div style={{ height: '24px', position: 'relative', margin: '-0.5rem 0' }}>
            <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none" style={{ display: 'block' }}>
              <line
                x1="16" y1="0" x2="16" y2="24"
                stroke={busOwner === 'CPU' ? 'var(--accent-blue)' : '#233559'}
                strokeWidth="2.5"
                strokeDasharray={busOwner === 'CPU' ? '4 2' : 'none'}
                className={busOwner === 'CPU' ? 'conduit-flowing' : ''}
              />
              <line
                x1="50" y1="0" x2="50" y2="24"
                stroke={busOwner.includes('DMA') ? 'var(--accent-green)' : '#233559'}
                strokeWidth="2.5"
                strokeDasharray={busOwner.includes('DMA') ? '4 2' : 'none'}
                className={busOwner.includes('DMA') ? 'conduit-flowing' : ''}
              />
              <line
                x1="84" y1="0" x2="84" y2="24"
                stroke={busOwner.includes('DMA') ? 'var(--accent-amber)' : '#233559'}
                strokeWidth="2.5"
                strokeDasharray={busOwner.includes('DMA') ? '4 2' : 'none'}
                className={busOwner.includes('DMA') ? 'conduit-flowing' : ''}
              />
            </svg>
          </div>

          {/* BUS SYSTEM WITH CONTINUOUS PHOTON STREAMS */}
          <div className="bus-system-container card-hud-corner">
            <div className="bus-track">
              <span className="bus-name-badge">CONTROL BUS:</span>
              <div className={`bus-physical-line packet-stream-track ${busOwner.includes('DMA') ? 'active-ctrl' : ''}`}>
                {busOwner.includes('DMA') ? (
                  <>
                    <div className="floating-data-packet packet-ctrl packet-p1"></div>
                    <div className="floating-data-packet packet-ctrl packet-p2"></div>
                    <div className="floating-data-packet packet-ctrl packet-p3"></div>
                  </>
                ) : (
                  <div className="floating-data-packet packet-ctrl" style={{ animationDuration: '2.5s' }}></div>
                )}
              </div>
              <span className="bus-state-display" style={{ color: 'var(--accent-green)' }}>
                {busOwner.includes('DMA') ? 'HOLD=1, HLDA=1, MEMW=1' : 'HLDA=0, IOR=0, MEMR=1'}
              </span>
            </div>
            <div className="bus-track">
              <span className="bus-name-badge">ADDRESS BUS:</span>
              <div className={`bus-physical-line packet-stream-track ${busOwner.includes('DMA') ? 'active-data' : ''}`}>
                {busOwner.includes('DMA') ? (
                  <>
                    <div className="floating-data-packet packet-p1"></div>
                    <div className="floating-data-packet packet-p2"></div>
                    <div className="floating-data-packet packet-p3"></div>
                  </>
                ) : (
                  <div className="floating-data-packet" style={{ animationDuration: '2s' }}></div>
                )}
              </div>
              <span className="bus-state-display" style={{ color: 'var(--accent-blue)' }}>
                {busOwner.includes('DMA') ? `0x${currentRamAddr.toString(16).toUpperCase()} (DMA Direct)` : '0x0400 (PC)'}
              </span>
            </div>
            <div className="bus-track">
              <span className="bus-name-badge">DATA BUS:</span>
              <div className={`bus-physical-line packet-stream-track ${busOwner.includes('DMA') ? 'active-data' : ''}`}>
                {busOwner.includes('DMA') ? (
                  <>
                    <div className="floating-data-packet packet-amber packet-p1"></div>
                    <div className="floating-data-packet packet-amber packet-p2"></div>
                    <div className="floating-data-packet packet-amber packet-p3"></div>
                  </>
                ) : (
                  <div className="floating-data-packet packet-amber" style={{ animationDuration: '2.2s' }}></div>
                )}
              </div>
              <span className="bus-state-display" style={{ color: 'var(--accent-amber)' }}>
                {busOwner.includes('DMA') ? `BYTE ${transferredBytes} -> RAM TARGET` : 'CPU Read'}
              </span>
            </div>
          </div>

          {/* RAM TARGET WITH MATRIX DECRYPTION */}
          <div className="ram-container card-hud-corner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Main Memory DRAM Target Buffer (0x8000)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {transferredBytes} / {blockSize} Bytes Written
              </span>
            </div>
            <div className="ram-cells-grid">
              {Array.from({ length: blockSize }).map((_, idx) => {
                const isWritingNow = idx === transferredBytes - 1 && isRunning;
                return (
                  <div
                    key={idx}
                    className={`memory-cell ${idx < transferredBytes ? 'written' : ''} ${isWritingNow ? 'pulse-write matrix-hex-scramble shockwave-blast' : ''}`}
                    title={`DRAM Address 0x${(0x8000 + idx).toString(16).toUpperCase()}`}
                  >
                    {isWritingNow 
                      ? `0x${((idx * 47 + currentClock * 19) % 256).toString(16).toUpperCase().padStart(2, '0')}`
                      : `0x${(0x8000 + idx).toString(16).toUpperCase().slice(-3)}`
                    }
                  </div>
                );
              })}
            </div>
          </div>

          {/* FEATURE 4: INTEL 8237 DMA HARDWARE PINOUT & VOLTAGE TELEMETRY */}
          <div className="ic-chip-container card-hud-corner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={15} /> Intel 8237 DMA Hardware Pinout & TTL Voltage (Slide 14)
              </span>
              <span className="badge-status badge-green" style={{ fontSize: '0.72rem' }}>
                {busOwner.includes('DMA') ? 'ACTIVE BUS MASTERSHIP' : 'STANDBY SNOOPING'}
              </span>
            </div>

            <div className="ic-pinout-grid">
              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 10 (HOLD)</span>
                  <div className={`pin-led ${busOwner.includes('DMA') ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${busOwner.includes('DMA') ? 'high' : 'low'}`}>
                  {busOwner.includes('DMA') ? '+5.0V (HIGH - Bus Req)' : '0.0V (LOW)'}
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 36 (HLDA)</span>
                  <div className={`pin-led ${busOwner.includes('DMA') ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${busOwner.includes('DMA') ? 'high' : 'low'}`}>
                  {busOwner.includes('DMA') ? '+5.0V (HIGH - Bus Grant)' : '0.0V (LOW)'}
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 18 (DREQ)</span>
                  <div className="pin-led high"></div>
                </div>
                <div className="pin-voltage-text high">+5.0V (HIGH - NVMe Req)</div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 25 (DACK)</span>
                  <div className={`pin-led ${busOwner.includes('DMA') ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${busOwner.includes('DMA') ? 'high' : 'low'}`}>
                  {busOwner.includes('DMA') ? '+5.0V (HIGH - DACK Assert)' : '0.0V (LOW)'}
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 4 (MEMW)</span>
                  <div className={`pin-led ${busOwner.includes('DMA') ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${busOwner.includes('DMA') ? 'high' : 'low'}`}>
                  {busOwner.includes('DMA') ? '+5.0V (RAM Write Active)' : '0.0V (LOW)'}
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 3 (MEMR)</span>
                  <div className="pin-led low"></div>
                  <div className="pin-voltage-text low">0.0V (LOW)</div>
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 1 (IOR)</span>
                  <div className={`pin-led ${busOwner.includes('DMA') ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${busOwner.includes('DMA') ? 'high' : 'low'}`}>
                  {busOwner.includes('DMA') ? '+5.0V (NVMe Egress)' : '0.0V (LOW)'}
                </div>
              </div>

              <div className="ic-pin-card">
                <div className="ic-pin-header">
                  <span>Pin 31 (TC/IRQ)</span>
                  <div className={`pin-led ${transferredBytes >= blockSize ? 'high' : 'low'}`}></div>
                </div>
                <div className={`pin-voltage-text ${transferredBytes >= blockSize ? 'high' : 'low'}`}>
                  {transferredBytes >= blockSize ? '+5.0V (IRQ Interrupt)' : '0.0V (LOW)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS HUD */}
        <div className="metrics-column">
          <div className="stat-card">
            <span className="stat-label">CPU Active Utilization</span>
            <span
              className="stat-value"
              style={{
                color: cpuUtilization < 50 ? 'var(--accent-red)' : (cpuUtilization < 85 ? 'var(--accent-amber)' : 'var(--accent-green)')
              }}
            >
              {cpuUtilization}%
            </span>
            <span className="stat-explanation">Percentage of clock cycles processor was active without bus stalls.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Elapsed System Clocks</span>
            <span className="stat-value" style={{ color: 'var(--accent-blue)' }}>{currentClock}</span>
            <span className="stat-explanation">Discrete clock pulses elapsed since transfer start.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">CPU Stalled Cycles</span>
            <span className="stat-value" style={{ color: 'var(--accent-red)' }}>{cpuStallCycles}</span>
            <span className="stat-explanation">Cycles CPU spent idle waiting for DMA to release bus.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Slide 15 Theoretical Core</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
              {mode === 'burst' ? 'Burst Mode' : (mode === 'stealing' ? 'Cycle Stealing' : 'Transparent Mode')}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {mode === 'burst' && 'Transfers entire block in one continuous burst. The processor is stalled throughout the entire transfer.'}
              {mode === 'stealing' && 'DMA stops processor for only 1 clock cycle to transfer 1 byte, then lets go of the bus repeatedly.'}
              {mode === 'transparent' && 'DMA only controls system bus when not needed by processor (internal ALU cycles). Zero CPU stalls!'}
            </p>
          </div>
        </div>
      </div>

      {/* GANTT TIMELINE */}
      <div className="timeline-card">
        <div className="oscilloscope-beam"></div>
        <div className="card-heading">
          <span>Cycle-by-Cycle Waveform & Bus Arbitration Timing (Slide 15)</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Displaying Last 20 System Clocks</span>
        </div>

        <div className="gantt-row">
          <div className="gantt-title">CPU Status:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 20 }).map((_, idx) => {
              const item = ganttHistory[idx];
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.cpu === 'work' ? 'slot-cpu-running' : 'slot-cpu-stalled') : 'slot-idle-gray'}`}
                >
                  {item ? (item.cpu === 'work' ? 'EXEC' : 'STALL') : '-'}
                </div>
              );
            })}
          </div>
        </div>

        <div className="gantt-row">
          <div className="gantt-title">Bus Mastership:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 20 }).map((_, idx) => {
              const item = ganttHistory[idx];
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.bus.includes('DMA') ? 'slot-dma-transfer' : 'slot-cpu-running') : 'slot-idle-gray'}`}
                >
                  {item ? (item.bus.includes('DMA') ? 'DMA' : 'CPU') : '-'}
                </div>
              );
            })}
          </div>
        </div>

        <div className="gantt-row">
          <div className="gantt-title">DMA Controller:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 20 }).map((_, idx) => {
              const item = ganttHistory[idx];
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.dma === 'transfer' ? 'slot-dma-transfer' : 'slot-idle-gray') : 'slot-idle-gray'}`}
                >
                  {item ? (item.dma === 'transfer' ? 'TX' : '-') : '-'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
