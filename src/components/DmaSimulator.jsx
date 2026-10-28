import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Cpu, Layers, Activity, Clock, Database } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';
import HardwareGaugesCluster from './HardwareGaugesCluster';
import CpuXrayModal from './CpuXrayModal';

export default function DmaSimulator() {
  const [mode, setMode] = useState('burst');
  const [blockSize, setBlockSize] = useState(16);
  const [speed, setSpeed] = useState(700);
  const [isRunning, setIsRunning] = useState(false);
  const [showCpuXray, setShowCpuXray] = useState(false);
  const [stressInjected, setStressInjected] = useState(false);
  const [pcieGen, setPcieGen] = useState('gen4');
  const [clockFreqGhz, setClockFreqGhz] = useState('3.20');

  const handleToggleStress = () => {
    setStressInjected(!stressInjected);
    try { soundFx.playClick(); } catch (e) {}
  };

  const handleCyclePcieGen = () => {
    try { soundFx.playClick(); } catch (e) {}
    if (pcieGen === 'gen4') {
      setPcieGen('gen5');
      setSpeed(350);
    } else if (pcieGen === 'gen5') {
      setPcieGen('legacy');
      setSpeed(1200);
    } else {
      setPcieGen('gen4');
      setSpeed(700);
    }
  };

  const handleCycleClockFreq = () => {
    try { soundFx.playClick(); } catch (e) {}
    if (clockFreqGhz === '3.20') {
      setClockFreqGhz('4.80');
      setSpeed(350);
    } else if (clockFreqGhz === '4.80') {
      setClockFreqGhz('1.60');
      setSpeed(1200);
    } else {
      setClockFreqGhz('3.20');
      setSpeed(700);
    }
  };

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

    let note = 'Burst Mode: Transfers entire block continuously. CPU is stalled throughout.';
    if (targetMode === 'stealing') {
      note = 'Cycle Stealing Mode: DMA steals 1 clock cycle for 1 byte, then yields back to CPU.';
    } else if (targetMode === 'transparent') {
      note = 'Transparent Mode: DMA sneaks cycles only during CPU internal ALU execution. Zero CPU stalls!';
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
        msg: `Step 6: All ${blockSize} bytes written to RAM. DMA releases bus and fires completion interrupt (IRQ) to CPU.`
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
      if (updated.length > 24) updated.shift();
      return updated;
    });

    if (nextTransferred >= blockSize) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    }
  };
  stepCycleRef.current = stepCycle;

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
            <option value="burst">Burst Mode (Block Transfer)</option>
            <option value="stealing">Cycle Stealing Mode (1 Byte/Cycle)</option>
            <option value="transparent">Transparent Mode (CPU Idle Cycles Only)</option>
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

      {/* FEATURE 1: CIRCULAR HUD SPEEDOMETER GAUGES & TELEMETRY CLUSTER (WORKABLE & INTERACTIVE) */}
      <HardwareGaugesCluster
        mode={mode}
        busOwner={busOwner}
        transferredBytes={transferredBytes}
        blockSize={blockSize}
        currentClock={currentClock}
        stressInjected={stressInjected}
        onToggleStress={handleToggleStress}
        pcieGen={pcieGen}
        onCyclePcieGen={handleCyclePcieGen}
        clockFreqGhz={clockFreqGhz}
        onCycleClockFreq={handleCycleClockFreq}
      />

      {/* HARDWARE GRID */}
      <div className="layout-grid">
        {/* SCHEMATIC */}
        <div className="glass-card">
          <div className="card-heading">
            <span>Hardware Interconnect & Register State</span>
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

              {/* FEATURE 3: CPU MICROARCHITECTURE X-RAY POPOVER BUTTON */}
              <button
                className="cpu-xray-btn"
                onClick={() => setShowCpuXray(true)}
                title="Inspect CPU ALU Pipeline, Registers and Cache Architecture"
              >
                🔬 CPU Microarchitecture X-Ray
              </button>
            </div>

            {/* DMA CONTROLLER NODE */}
            <div className={`hardware-node card-hud-corner ${busOwner.includes('DMA') ? 'node-master' : ''}`}>
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

          {/* FEATURE 2: MULTI-STRAND FIBER-OPTIC BUS HIGHWAY */}
          <div className="fiber-highway-container card-hud-corner">
            <div className="fiber-highway-header">
              <span className="fiber-highway-title">
                <span className="anim-clock-pulse">⚡</span> MULTI-STRAND SYSTEM HIGHWAY (TRIPARTITE BUS ARCHITECTURE)
              </span>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                <span className="badge-status badge-blue">32-BIT ADDR</span>
                <span className="badge-status badge-green">64-BIT DATA</span>
                <span className="badge-status badge-amber">ASYNC CTRL</span>
              </div>
            </div>

            <div className="fiber-lane-row">
              {/* ADDRESS BUS (CYAN) */}
              <div className="fiber-lane">
                <span className="fiber-lane-badge badge-addr-bus">ADDRESS BUS</span>
                <div className="fiber-core-track">
                  <div className="fiber-laser-line fiber-laser-cyan"></div>
                  <div className="fiber-pulse-bead" style={{ background: '#00d2ff', boxShadow: '0 0 10px #00d2ff', animationDuration: busOwner.includes('DMA') ? '1.1s' : '2.4s' }}></div>
                  {busOwner.includes('DMA') && (
                    <div className="fiber-pulse-bead" style={{ background: '#00d2ff', boxShadow: '0 0 10px #00d2ff', animationDuration: '1.1s', animationDelay: '0.55s' }}></div>
                  )}
                </div>
                <div className="fiber-lane-readout" style={{ color: 'var(--accent-cyan)' }}>
                  {busOwner.includes('DMA') ? `0x${currentRamAddr.toString(16).toUpperCase()} (DMA TGT)` : `0x0400 (PC INST)`}
                </div>
              </div>

              {/* DATA BUS (ELECTRIC COBALT BLUE) */}
              <div className="fiber-lane">
                <span className="fiber-lane-badge badge-data-bus">DATA BUS</span>
                <div className="fiber-core-track">
                  <div className="fiber-laser-line fiber-laser-blue"></div>
                  <div className="fiber-pulse-bead" style={{ background: '#60a5fa', boxShadow: '0 0 12px #0052ff', animationDuration: busOwner.includes('DMA') ? '0.9s' : '2.2s' }}></div>
                  {busOwner.includes('DMA') && (
                    <div className="fiber-pulse-bead" style={{ background: '#60a5fa', boxShadow: '0 0 12px #0052ff', animationDuration: '0.9s', animationDelay: '0.45s' }}></div>
                  )}
                </div>
                <div className="fiber-lane-readout" style={{ color: '#60a5fa' }}>
                  {busOwner.includes('DMA') ? `0x${((transferredBytes * 17 + 0xAA) % 256).toString(16).toUpperCase().padStart(2, '0')} (BYTE ${transferredBytes}/${blockSize})` : '0x90 (NOP / ALU)'}
                </div>
              </div>

              {/* CONTROL BUS (AMBER WITH LIVE LED INDICATORS) */}
              <div className="fiber-lane">
                <span className="fiber-lane-badge badge-ctrl-bus">CONTROL BUS</span>
                <div className="fiber-core-track">
                  <div className="fiber-laser-line fiber-laser-amber"></div>
                  <div className="fiber-pulse-bead" style={{ background: '#fbbf24', boxShadow: '0 0 10px #fbbf24', animationDuration: '1.4s' }}></div>
                </div>
                <div className="fiber-ctrl-leds">
                  <span className={`led-chip ${busOwner.includes('DMA') ? 'active-amber' : ''}`}>HOLD</span>
                  <span className={`led-chip ${busOwner.includes('DMA') ? 'active-green' : ''}`}>HLDA</span>
                  <span className={`led-chip ${transferredBytes < blockSize ? 'active-amber' : ''}`}>DREQ</span>
                  <span className={`led-chip ${busOwner.includes('DMA') ? 'active-green' : ''}`}>DACK</span>
                  <span className={`led-chip ${busOwner.includes('DMA') ? 'active-amber' : ''}`}>MEMW</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROCK-SOLID STABLE RAM BUFFER (ENHANCED HIGH-DENSITY DRAM MATRIX) */}
          <div className="ram-container card-hud-corner cyber-target-container" style={{ position: 'relative' }}>
            {/* HUD TARGET CORNER BRACKETS */}
            <div className="target-corner target-tl"></div>
            <div className="target-corner target-tr"></div>
            <div className="target-corner target-bl"></div>
            <div className="target-corner target-br"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 5, marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} color="#00d2ff" />
                Main Memory DRAM Target Buffer (0x8000)
                <span className="badge-status badge-blue" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>DRAM • 0x8000</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge-status badge-green" style={{ fontSize: '0.7rem' }}>
                  {Math.round((transferredBytes / blockSize) * 100)}% BUFFERED
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {transferredBytes} / {blockSize} Bytes Written
                </span>
              </div>
            </div>

            {/* REAL-TIME BUFFER PROGRESS BAR */}
            <div className="ram-progress-track">
              <div
                className="ram-progress-fill"
                style={{ width: `${(transferredBytes / blockSize) * 100}%` }}
              ></div>
            </div>

            <div className="ram-cells-grid" style={{ position: 'relative', zIndex: 5 }}>
              {Array.from({ length: blockSize }).map((_, idx) => {
                const isWritingNow = idx === transferredBytes - 1 && isRunning;
                const isWritten = idx < transferredBytes;
                const byteVal = isWritten
                  ? `0x${((idx * 17 + 0xAA) % 256).toString(16).toUpperCase().padStart(2, '0')}`
                  : '0x00';
                return (
                  <div
                    key={idx}
                    className={`memory-cell ${isWritten ? 'written' : ''} ${isWritingNow ? 'pulse-write matrix-hex-scramble shockwave-blast' : ''}`}
                    title={`Physical DRAM Address 0x${(0x8000 + idx).toString(16).toUpperCase()} | Value: ${byteVal} | ${isWritten ? 'Committed (DMA)' : 'Pending'}`}
                  >
                    <span className="cell-addr-tag">+0x0{idx.toString(16).toUpperCase()}</span>
                    <span className={`cell-val-tag ${isWritten ? 'val-written' : 'val-pending'}`}>
                      {isWritingNow 
                        ? `0x${((idx * 47 + currentClock * 19) % 256).toString(16).toUpperCase().padStart(2, '0')}`
                        : byteVal
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FEATURE 4: INTEL 8237 DMA HARDWARE PINOUT & VOLTAGE TELEMETRY */}
          <div className="ic-chip-container card-hud-corner sonar-lidar-container">
            <div className="lidar-scan-beam"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={15} /> Intel 8237 DMA Hardware Pinout & TTL Voltage
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
            <span className="stat-label">Theoretical Transfer Formula</span>
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

      {/* GANTT TIMELINE (ENHANCED OSCILLOSCOPE LOGIC ANALYZER) */}
      <div className="timeline-card">
        <div className="oscilloscope-beam"></div>
        <div className="card-heading" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>Cycle-by-Cycle Waveform & Bus Arbitration Timing</span>
            <span className="badge-status badge-blue" style={{ fontSize: '0.7rem' }}>24-CYCLE OSCILLOSCOPE LOGIC</span>
          </div>
          <div className="timing-legend-row">
            <span className="legend-chip legend-blue">⚡ CPU EXEC</span>
            <span className="legend-chip legend-red">⛔ CPU STALL</span>
            <span className="legend-chip legend-green">📡 DMA MASTER</span>
            <span className="legend-chip legend-amber">⏳ ARBITRATION</span>
          </div>
        </div>

        {/* ROW 0: CLOCK CYCLE TIME TICKS (T-STATES) */}
        <div className="gantt-row gantt-clock-header">
          <div className="gantt-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00d2ff' }}>
            <Clock size={13} /> CLK Cycle (T):
          </div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 24 }).map((_, idx) => {
              const item = ganttHistory[idx];
              const isCurrent = idx === ganttHistory.length - 1 && isRunning;
              return (
                <div
                  key={idx}
                  className={`gantt-clock-slot ${isCurrent ? 'active-clock-head' : ''} ${item ? 'slot-recorded' : ''}`}
                >
                  <span className="clock-t-label">T{idx + 1}</span>
                  {isCurrent && <div className="clock-active-caret">▼</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 1: SYNCHRONIZED DIGITAL CLOCK SQUARE WAVE */}
        <div className="gantt-row gantt-wave-row">
          <div className="gantt-title" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Digital Clock (CLK):
          </div>
          <div className="gantt-blocks-grid gantt-wave-grid">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div key={idx} className="gantt-wave-cell">
                <svg viewBox="0 0 32 14" className="gantt-clock-pulse-svg">
                  <path
                    d="M0 12 L8 12 L8 2 L24 2 L24 12 L32 12"
                    fill="none"
                    stroke={idx < ganttHistory.length ? '#00d2ff' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: CPU STATUS */}
        <div className="gantt-row">
          <div className="gantt-title">CPU Status:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 24 }).map((_, idx) => {
              const item = ganttHistory[idx];
              const isCurrent = idx === ganttHistory.length - 1 && isRunning;
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.cpu === 'work' ? 'slot-cpu-running' : 'slot-cpu-stalled') : 'slot-idle-gray'} ${isCurrent ? 'active-col-indicator' : ''}`}
                  title={item ? (item.cpu === 'work' ? 'CPU Active: Executing ALU/Fetch' : 'CPU Stalled: Bus locked by DMA') : `Cycle T${idx + 1} Pending`}
                >
                  {item ? (item.cpu === 'work' ? '⚡ EXEC' : '⛔ STALL') : '·'}
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 3: BUS MASTERSHIP */}
        <div className="gantt-row">
          <div className="gantt-title">Bus Mastership:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 24 }).map((_, idx) => {
              const item = ganttHistory[idx];
              const isCurrent = idx === ganttHistory.length - 1 && isRunning;
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.bus.includes('DMA') ? 'slot-dma-transfer' : 'slot-cpu-running') : 'slot-idle-gray'} ${isCurrent ? 'active-col-indicator' : ''}`}
                  title={item ? `Bus Master: ${item.bus}` : `Cycle T${idx + 1} Pending`}
                >
                  {item ? (item.bus.includes('DMA') ? 'DMA' : 'CPU') : '·'}
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW 4: DMA CONTROLLER */}
        <div className="gantt-row">
          <div className="gantt-title">DMA Controller:</div>
          <div className="gantt-blocks-grid">
            {Array.from({ length: 24 }).map((_, idx) => {
              const item = ganttHistory[idx];
              const isCurrent = idx === ganttHistory.length - 1 && isRunning;
              return (
                <div
                  key={idx}
                  className={`gantt-slot ${item ? (item.dma === 'transfer' ? 'slot-dma-transfer' : 'slot-idle-gray') : 'slot-idle-gray'} ${isCurrent ? 'active-col-indicator' : ''}`}
                  title={item ? (item.dma === 'transfer' ? 'DMA Transferring Byte to DRAM' : 'DMA Idle / Relinquished') : `Cycle T${idx + 1} Pending`}
                >
                  {item ? (item.dma === 'transfer' ? '📡 TX' : 'IDLE') : '·'}
                </div>
              );
            })}
          </div>
        </div>

        {/* TIMING SUMMARY METRICS STRIP */}
        <div className="timing-summary-bar">
          <div className="timing-metric-pill">
            <span className="timing-metric-label">TOTAL CLOCKS:</span>
            <span className="timing-metric-val">{currentClock} T-Cycles</span>
          </div>
          <div className="timing-metric-pill">
            <span className="timing-metric-label">CPU EXEC:</span>
            <span className="timing-metric-val" style={{ color: '#60a5fa' }}>
              {Math.max(0, currentClock - cpuStallCycles)} ({currentClock > 0 ? Math.round(((currentClock - cpuStallCycles) / currentClock) * 100) : 100}%)
            </span>
          </div>
          <div className="timing-metric-pill">
            <span className="timing-metric-label">BUS STALLS:</span>
            <span className="timing-metric-val" style={{ color: '#f43f5e' }}>
              {cpuStallCycles} ({currentClock > 0 ? Math.round((cpuStallCycles / currentClock) * 100) : 0}%)
            </span>
          </div>
          <div className="timing-metric-pill">
            <span className="timing-metric-label">BURST EFFICIENCY:</span>
            <span className="timing-metric-val" style={{ color: '#10b981' }}>
              {transferredBytes > 0 ? Math.round((transferredBytes / (currentClock || 1)) * 100) : 0}% / Cycle
            </span>
          </div>
          <div className="timing-metric-pill">
            <span className="timing-metric-label">ARBITRATION MODE:</span>
            <span className="timing-metric-val" style={{ color: '#fbbf24' }}>
              {mode.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* FEATURE 1: LIVE 4-CHANNEL LOGIC ANALYZER OSCILLOSCOPE */}
      <div className="logic-analyzer-card card-hud-corner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={16} /> Live Hardware Logic Analyzer & Digital Bus Waveforms
          </span>
          <span className="badge-status badge-blue" style={{ fontSize: '0.74rem' }}>
            {isRunning ? 'STREAMING REAL-TIME BUS TIMING' : 'TRIGGER ARMED: READY'}
          </span>
        </div>

        <div className="logic-channels-grid">
          {/* CH1: CLK */}
          <div className="logic-channel-row">
            <div className="logic-channel-label">
              <span>CH1 [CLK]</span>
              <span style={{ color: 'var(--accent-cyan)' }}>3.2 GHz</span>
            </div>
            <div className="logic-wave-track">
              <svg className={`wave-stream-svg ${isRunning ? '' : 'paused'}`} viewBox="0 0 560 24" preserveAspectRatio="none">
                <path
                  d="M0 20 L14 20 L14 4 L28 4 L28 20 L42 20 L42 4 L56 4 L56 20 L70 20 L70 4 L84 4 L84 20 L98 20 L98 4 L112 4 L112 20 L126 20 L126 4 L140 4 L140 20 L154 20 L154 4 L168 4 L168 20 L182 20 L182 4 L196 4 L196 20 L210 20 L210 4 L224 4 L224 20 L238 20 L238 4 L252 4 L252 20 L266 20 L266 4 L280 4 L280 20 L294 20 L294 4 L308 4 L308 20 L322 20 L322 4 L336 4 L336 20 L350 20 L350 4 L364 4 L364 20 L378 20 L378 4 L392 4 L392 20 L406 20 L406 4 L420 4 L420 20 L434 20 L434 4 L448 4 L448 20 L462 20 L462 4 L476 4 L476 20 L490 20 L490 4 L504 4 L504 20 L518 20 L518 4 L532 4 L532 20 L546 20 L546 4 L560 4"
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* CH2: HOLD */}
          <div className="logic-channel-row">
            <div className="logic-channel-label">
              <span>CH2 [HOLD]</span>
              <span style={{ color: busOwner.includes('DMA') ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{busOwner.includes('DMA') ? 'HIGH' : 'LOW'}</span>
            </div>
            <div className="logic-wave-track">
              <svg className={`wave-stream-svg ${isRunning ? '' : 'paused'}`} viewBox="0 0 560 24" preserveAspectRatio="none">
                <path
                  d={busOwner.includes('DMA') ? "M0 4 L560 4" : "M0 20 L560 20"}
                  fill="none"
                  stroke="var(--accent-blue)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* CH3: HLDA */}
          <div className="logic-channel-row">
            <div className="logic-channel-label">
              <span>CH3 [HLDA]</span>
              <span style={{ color: busOwner.includes('DMA') ? 'var(--accent-green)' : 'var(--text-muted)' }}>{busOwner.includes('DMA') ? 'GRANT' : 'IDLE'}</span>
            </div>
            <div className="logic-wave-track">
              <svg className={`wave-stream-svg ${isRunning ? '' : 'paused'}`} viewBox="0 0 560 24" preserveAspectRatio="none">
                <path
                  d={busOwner.includes('DMA') ? "M0 4 L560 4" : "M0 20 L560 20"}
                  fill="none"
                  stroke="var(--accent-green)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* CH4: MEMW */}
          <div className="logic-channel-row">
            <div className="logic-channel-label">
              <span>CH4 [MEMW]</span>
              <span style={{ color: 'var(--accent-amber)' }}>{busOwner.includes('DMA') ? 'STROBE' : 'PULLUP'}</span>
            </div>
            <div className="logic-wave-track">
              <svg className={`wave-stream-svg ${isRunning ? '' : 'paused'}`} viewBox="0 0 560 24" preserveAspectRatio="none">
                <path
                  d={busOwner.includes('DMA')
                    ? "M0 4 L28 4 L28 20 L42 20 L42 4 L84 4 L84 20 L98 20 L98 4 L140 4 L140 20 L154 20 L154 4 L196 4 L196 20 L210 20 L210 4 L252 4 L252 20 L266 20 L266 4 L308 4 L308 20 L322 20 L322 4 L364 4 L364 20 L378 20 L378 4 L420 4 L420 20 L434 20 L434 4 L476 4 L476 20 L490 20 L490 4 L532 4 L532 20 L546 20 L546 4 L560 4"
                    : "M0 4 L560 4"}
                  fill="none"
                  stroke="var(--accent-amber)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
