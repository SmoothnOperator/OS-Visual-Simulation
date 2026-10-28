import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export default function UnifiedSystemLab() {
  const [scenario, setScenario] = useState('gaming');
  const [stress, setStress] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [narration, setNarration] = useState({
    title: 'Hardware Bus Arbitration & Memory Contention (Topic 5 + 6 Crossroads)',
    msg: 'Standby. Select a scenario, adjust memory pressure, and click "Run Workload" to observe how the Memory Bus Arbiter balances CPU computing against DMA I/O throughput.'
  });

  const timerRef = useRef(null);
  const stepSimulationRef = useRef(null);
  stepSimulationRef.current = stepSimulation;

  useEffect(() => {
    if (isRunning) {
      const intervalId = setInterval(() => {
        if (stepSimulationRef.current) {
          stepSimulationRef.current();
        }
      }, 900);
      return () => clearInterval(intervalId);
    }
  }, [isRunning]);

  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    resetLab();

    if (newScenario === 'gaming') {
      setNarration({
        title: 'Scenario A: 3D Gaming + Background Download',
        msg: 'Cycle Stealing Mode in action: DMA sneaks network packets into RAM 1 byte at a time so Core 1 maintains 60 FPS frame rendering without stuttering.'
      });
    } else if (newScenario === 'database') {
      setNarration({
        title: 'Scenario B: Database Transaction Checkpoint (DMA Burst Mode)',
        msg: 'Burst Mode in action: DMA locks down the entire memory bus to flush transaction logs to NVMe SSD. All CPU cores are forced into wait-states until the burst completes (Slide 15)!'
      });
    } else if (newScenario === 'streaming') {
      setNarration({
        title: 'Scenario C: Real-Time 4K Video Streaming',
        msg: 'Balanced Arbitration: Arbiter ensures continuous DMA streaming to prevent buffer underflow, while keeping CPU audio threads responsive.'
      });
    }
  };

  const handleStressChange = (newStress) => {
    const val = parseInt(newStress, 10);
    setStress(val);

    const busSat = Math.min(98, Math.round(val * 1.15));
    setNarration({
      title: `Memory Pressure Adjusted to ${val}%`,
      msg: `As processor memory request rate rises, bus contention jumps to ${busSat}%. Stalls multiply at the arbiter turnstile (Slide 19/24 memory bottleneck).`
    });
  };

  const toggleRun = () => {
    setIsRunning(!isRunning);
  };

  const resetLab = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setStepIndex(0);
  };

  const stepSimulation = () => {
    const nextStep = (stepIndex + 1) % 3;
    setStepIndex(nextStep);

    if (busSat > 70) {
      soundFx.playContentionSpark();
    } else {
      soundFx.playClockTick();
    }

    if (scenario === 'database') {
      if (nextStep === 1 || nextStep === 2) {
        setNarration({
          title: 'Arbiter Phase: DMA Burst Lock (Slide 15 Verification)',
          msg: 'Burst Mode demonstrated: DMA Controller claimed the entire bus to dump database logs. Notice both Core 1 and Core 2 are STALLED (red) with 0% compute throughput!'
        });
        return;
      }
    }

    if (nextStep === 0) {
      setNarration({
        title: 'Arbiter Turnstile: Core 1 Granted Bus',
        msg: 'Arbiter gives memory access to Core 1 for vertex shader calculations. DMA and Core 2 wait in the turnstile queue.'
      });
    } else if (nextStep === 1) {
      setNarration({
        title: 'Arbiter Turnstile: DMA Cycle Stealing Active (Slide 15)',
        msg: 'DMA Controller steals exactly 1 clock cycle to transfer a data packet to RAM. It will immediately yield the bus on next clock to prevent starving Core 2.'
      });
    } else if (nextStep === 2) {
      setNarration({
        title: 'Arbiter Turnstile: Core 2 Granted Bus',
        msg: 'Fair Arbitration complete: Core 2 executes collision calculation memory fetches. Round-robin cycle ensures no processor or peripheral starves.'
      });
    }
  };

  // Dynamic Metrics
  const busSat = Math.min(98, Math.round(stress * 1.15));
  const cpuEff = Math.max(35, Math.round(100 - (stress * 0.65)));
  const waitPenalty = Math.round(4 + (stress * 0.4));

  const isDmaBurstLock = scenario === 'database' && (stepIndex === 1 || stepIndex === 2);

  return (
    <section className="tab-pane active">
      {/* CONTROLS STRIP */}
      <div className="controls-card">
        <div className="control-cluster">
          <span className="control-label">Workload Scenario:</span>
          <select
            className="select-dropdown"
            value={scenario}
            onChange={(e) => handleScenarioChange(e.target.value)}
          >
            <option value="gaming">🎮 3D Gaming + Background File Download (Cycle Stealing)</option>
            <option value="database">💾 Database Checkpoint Disk Flush (DMA Burst)</option>
            <option value="streaming">🎬 Real-Time 4K Video Streaming (Smooth Interleaving)</option>
          </select>
        </div>

        <div className="control-cluster">
          <span className="control-label">CPU Memory Pressure:</span>
          <input
            type="range"
            min="20"
            max="95"
            step="5"
            value={stress}
            className="range-input"
            style={{ width: '130px' }}
            onChange={(e) => handleStressChange(e.target.value)}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: stress > 70 ? 'var(--accent-red)' : (stress > 40 ? 'var(--accent-amber)' : 'var(--accent-green)'),
              fontSize: '0.95rem'
            }}
          >
            {stress}% ({stress > 70 ? 'Extreme Contention!' : (stress > 40 ? 'Moderate' : 'Light')})
          </span>
          {stress > 70 && <span className="spark-alert" style={{ fontSize: '0.78rem', color: 'var(--accent-red)', fontWeight: 800 }}>⚡ CONTENTION SURGE</span>}
        </div>

        <div className="control-cluster">
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleRun}
          >
            {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run Workload</>}
          </button>
          <button className="btn btn-secondary" onClick={stepSimulation}>
            <SkipForward size={16} /> Step Pulse
          </button>
          <button className="btn btn-secondary" onClick={resetLab}>
            <RotateCcw size={16} /> Reset Lab
          </button>
        </div>
      </div>

      {/* NARRATION BANNER */}
      <div className="narration-banner" style={{ borderLeftColor: 'var(--accent-green)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="narration-icon">🔬</div>
          <div className="audio-equalizer">
            <div className="eq-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-green)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-green)' }}></div>
          </div>
        </div>
        <div className="narration-text">
          <div className="narration-title">{narration.title}</div>
          <div className="narration-message">{narration.msg}</div>
        </div>
      </div>

      {/* CROSSBAR HIGHWAY & TURNSTILE */}
      <div className="syn-highway-card">
        <div className="card-heading">
          <span>Memory Bus Highway Crossbar & Hardware Arbiter Turnstile</span>
          <span className={`badge-status ${isDmaBurstLock ? 'badge-green' : (stepIndex === 0 ? 'badge-blue' : (stepIndex === 1 ? 'badge-green' : 'badge-purple'))}`}>
            {isDmaBurstLock ? 'DMA BURST ACTIVE (FULL LOCK)' : (stepIndex === 0 ? 'CORE 1 BUS MASTER' : (stepIndex === 1 ? 'DMA CYCLE STEAL' : 'CORE 2 BUS MASTER'))}
          </span>
        </div>

        {/* TOP CORES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '0.5rem' }}>
          <div className={`hardware-node cyber-tilt-card cyber-target-container ${isDmaBurstLock ? 'node-stalled' : (stepIndex === 0 ? 'node-master target-active' : '')}`}>
            <div className="target-corner target-tl"></div>
            <div className="target-corner target-tr"></div>
            <div className="target-corner target-bl"></div>
            <div className="target-corner target-br"></div>
            <span className="target-badge-telemetry">CORE 1</span>
            <div className="node-header">
              <span className="node-title" style={{ color: 'var(--accent-blue)' }}>Multicore Core 1</span>
              <span className={`badge-status ${isDmaBurstLock ? 'badge-red' : (stepIndex === 0 ? 'badge-green' : 'badge-amber')}`}>
                {isDmaBurstLock ? 'STALLED' : (stepIndex === 0 ? 'COMPUTING' : 'YIELDED')}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {scenario === 'gaming' && 'Vertex Shader Texture Fetch (60 FPS)'}
              {scenario === 'database' && 'OLTP SQL Query Processing'}
              {scenario === 'streaming' && '4K HEVC Video Frame Decoder'}
            </p>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDmaBurstLock ? 'var(--accent-red)' : (stepIndex === 0 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
              {isDmaBurstLock ? 'Bus: WAITING (DMA Lock)' : (stepIndex === 0 ? 'Bus: ACTIVE ACCESS' : 'Bus: YIELDED TO DMA')}
            </div>
            {/* THREAD ACTIVITY EQUALIZER */}
            <div className="core-thread-bars" style={{ opacity: stepIndex === 0 && !isDmaBurstLock ? 1 : 0.25, transition: 'opacity 0.2s ease', marginTop: '0.4rem' }}>
              <div className="core-bar" style={{ animationDuration: '0.65s' }}></div>
              <div className="core-bar" style={{ animationDuration: '0.85s' }}></div>
              <div className="core-bar" style={{ animationDuration: '0.55s' }}></div>
              <div className="core-bar" style={{ animationDuration: '0.75s' }}></div>
              <div className="core-bar" style={{ animationDuration: '0.60s' }}></div>
            </div>
          </div>

          <div className={`hardware-node cyber-tilt-card cyber-target-container ${isDmaBurstLock ? 'node-stalled' : (stepIndex === 2 ? 'node-master target-active' : '')}`}>
            <div className="target-corner target-tl"></div>
            <div className="target-corner target-tr"></div>
            <div className="target-corner target-bl"></div>
            <div className="target-corner target-br"></div>
            <span className="target-badge-telemetry">CORE 2</span>
            <div className="node-header">
              <span className="node-title" style={{ color: 'var(--accent-purple)' }}>Multicore Core 2</span>
              <span className={`badge-status ${isDmaBurstLock ? 'badge-red' : (stepIndex === 2 ? 'badge-green' : 'badge-amber')}`}>
                {isDmaBurstLock ? 'STALLED' : (stepIndex === 2 ? 'COMPUTING' : 'QUEUED')}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {scenario === 'gaming' && 'Physics Collision Calculations'}
              {scenario === 'database' && 'B-Tree Database Index Traversal'}
              {scenario === 'streaming' && 'Spatial Audio Filter Engine'}
            </p>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDmaBurstLock ? 'var(--accent-red)' : (stepIndex === 2 ? 'var(--accent-green)' : 'var(--accent-amber)') }}>
              {isDmaBurstLock ? 'Bus: WAITING (DMA Lock)' : (stepIndex === 2 ? 'Bus: ACTIVE ACCESS' : 'Bus: WAITING ARBITER')}
            </div>
            {/* THREAD ACTIVITY EQUALIZER */}
            <div className="core-thread-bars" style={{ opacity: stepIndex === 2 && !isDmaBurstLock ? 1 : 0.25, transition: 'opacity 0.2s ease', marginTop: '0.4rem' }}>
              <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.75s' }}></div>
              <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.95s' }}></div>
              <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.65s' }}></div>
              <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.80s' }}></div>
            </div>
          </div>
        </div>

        {/* CONNECTING WIRES TO ARBITER WITH MULTI-PHOTON STREAM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', position: 'relative', height: '24px' }}>
          <div className={`wire-connector-line packet-stream-track ${stepIndex === 0 && !isDmaBurstLock ? 'wire-flowing' : ''}`} style={{ height: '8px', margin: '0.4rem 0' }}>
            {stepIndex === 0 && !isDmaBurstLock ? (
              <>
                <div className="floating-data-packet comet-ribbon packet-p1"></div>
                <div className="floating-data-packet comet-ribbon packet-p2"></div>
              </>
            ) : null}
          </div>
          <div className={`wire-connector-line packet-stream-track ${stepIndex === 2 && !isDmaBurstLock ? 'wire-flowing' : ''}`} style={{ height: '8px', margin: '0.4rem 0' }}>
            {stepIndex === 2 && !isDmaBurstLock ? (
              <>
                <div className="floating-data-packet comet-ribbon packet-amber packet-p1"></div>
                <div className="floating-data-packet comet-ribbon packet-amber packet-p2"></div>
              </>
            ) : null}
          </div>
        </div>

        {/* FEATURE 1: CRACKLING SVG LIGHTNING BOLTS & CONTENTION PLASMA */}
        {busSat > 70 && (
          <div style={{ position: 'relative', height: '36px', margin: '-0.3rem 0' }}>
            <svg width="100%" height="36" viewBox="0 0 400 36" preserveAspectRatio="none" className="lightning-arc-svg">
              <path d="M 20 18 L 80 5 L 110 28 L 170 8 L 220 30 L 280 10 L 340 25 L 380 18" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
              <path d="M 20 18 L 90 28 L 130 10 L 190 32 L 240 12 L 300 28 L 350 12 L 380 18" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
              <path d="M 50 18 L 140 20 L 210 16 L 290 20 L 360 18" fill="none" stroke="#ffffff" strokeWidth="1" />
            </svg>
            <div style={{ position: 'absolute', top: '7px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(225, 29, 72, 0.95)', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.75rem', borderRadius: '9999px', boxShadow: '0 0 15px #f43f5e', letterSpacing: '0.05em' }}>
              ⚡ CONTENTION PLASMA SURGE: HIGH BUS PRESSURE ({busSat}%)
            </div>
          </div>
        )}

        {/* TURNSTILE BOX WITH KINETIC ARBITER, LIDAR SCAN & CYBER BRACKETS */}
        <div className={`turnstile-box card-hud-corner sonar-lidar-container cyber-tilt-card cyber-target-container ${busSat > 75 ? 'hazard-stalled-overlay' : ''}`}>
          <div className="lidar-scan-beam"></div>
          <div className="target-corner target-tl"></div>
          <div className="target-corner target-tr"></div>
          <div className="target-corner target-bl"></div>
          <div className="target-corner target-br"></div>
          <span className="target-badge-telemetry" style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>BUS ARBITER</span>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="iris-ring-rotor" style={{ fontSize: '1.15rem' }}>⚙️</span> Hardware Memory Bus Arbiter (Slide 18 Turnstile)
            </span>
            <span className={`badge-status ${isDmaBurstLock || stepIndex === 1 ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.82rem' }}>
              {isDmaBurstLock ? 'DMA Bus Master (Bursting)' : (stepIndex === 0 ? 'Core 1 Granted' : (stepIndex === 1 ? 'DMA Stole Cycle' : 'Core 2 Granted'))}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Resolves simultaneous memory conflicts between multiple CPU cores and high-speed DMA I/O
          </div>

          <div className="turnstile-queue">
            <div className="turnstile-slot slot-active anim-laser-active">
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>1. Active Master ⚡</span>
              <span style={{ fontWeight: 800 }}>{isDmaBurstLock ? 'DMA Controller (LOCK)' : (stepIndex === 0 ? 'Core 1' : (stepIndex === 1 ? 'DMA (Steal)' : 'Core 2'))}</span>
            </div>
            <div className="turnstile-slot slot-queued">
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>2. Next In Line</span>
              <span>{isDmaBurstLock ? 'Core 1 (Stalled)' : (stepIndex === 0 ? 'DMA Controller' : (stepIndex === 1 ? 'Core 2' : 'Core 1'))}</span>
            </div>
            <div className="turnstile-slot">
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>3. Pending</span>
              <span>{isDmaBurstLock ? 'Core 2 (Stalled)' : (stepIndex === 0 ? 'Core 2' : (stepIndex === 1 ? 'Core 1' : 'DMA Controller'))}</span>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: DMA & RAM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', alignItems: 'center', marginTop: '1rem' }}>
          <div className={`hardware-node cyber-tilt-card cyber-target-container ${isDmaBurstLock || stepIndex === 1 ? 'node-master target-active' : ''}`}>
            <div className="target-corner target-tl"></div>
            <div className="target-corner target-tr"></div>
            <div className="target-corner target-bl"></div>
            <div className="target-corner target-br"></div>
            <span className="target-badge-telemetry" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>DMA 8237</span>
            <div className="node-header">
              <span className="node-title" style={{ color: 'var(--accent-green)' }}>DMA Controller (Station Master)</span>
              <span className={`badge-status ${isDmaBurstLock || stepIndex === 1 ? 'badge-green' : 'badge-amber'}`}>
                {isDmaBurstLock ? 'BURSTING' : (stepIndex === 1 ? 'TRANSFERRING' : 'HOLD_REQ')}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {scenario === 'gaming' && 'Background Game Patch Download (Cycle Stealing)'}
              {scenario === 'database' && 'WAL Transaction Checkpoint Flush (Burst Mode)'}
              {scenario === 'streaming' && 'HDMI Capture Card Direct Stream'}
            </p>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDmaBurstLock || stepIndex === 1 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
              {isDmaBurstLock ? 'Bus: MASTER (Writing RAM)' : (stepIndex === 1 ? 'Bus: STEALING CYCLE' : 'Bus: REQUESTING (HOLD)')}
            </div>
            <div className={`wire-connector-line packet-stream-track ${isDmaBurstLock || stepIndex === 1 ? 'wire-dma-flow' : ''}`} style={{ marginTop: '0.5rem' }}>
              {(isDmaBurstLock || stepIndex === 1) && <div className="floating-data-packet packet-ctrl comet-ribbon"></div>}
            </div>
          </div>

          <div className="ram-container sonar-lidar-container cyber-tilt-card cyber-target-container" style={{ background: 'var(--bg-surface-elevated)', border: '2px solid var(--accent-blue)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div className="lidar-scan-beam"></div>
            <div className="target-corner target-tl"></div>
            <div className="target-corner target-tr"></div>
            <div className="target-corner target-bl"></div>
            <div className="target-corner target-br"></div>
            <span className="target-badge-telemetry">SHARED DRAM</span>
            <div className="memory-radar-scanner"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', position: 'relative', zIndex: 3 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Shared Main Memory (DRAM Highway)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {isDmaBurstLock ? 'Servicing: DMA Burst Write (0x8000 -> 0x8FFF)' : (stepIndex === 0 ? 'Servicing: Core 1 Read (0x4420)' : (stepIndex === 1 ? 'Servicing: DMA Direct Write (0x8024)' : 'Servicing: Core 2 Read (0x6210)'))}
              </span>
            </div>
            <div className={`wire-connector-line packet-stream-track ${isDmaBurstLock || stepIndex === 1 ? 'wire-dma-flow' : 'wire-flowing'}`} style={{ position: 'relative', zIndex: 3 }}>
              <div className="floating-data-packet packet-p1 comet-ribbon"></div>
              <div className="floating-data-packet packet-amber packet-p2 comet-ribbon"></div>
            </div>

            {/* LIVE ANIMATED DRAM HEX BLOCK GRID */}
            <div className="ram-cells-grid" style={{ position: 'relative', zIndex: 5, marginTop: '0.6rem', gridTemplateColumns: 'repeat(8, 1fr)' }}>
              <div className={`memory-cell written ${stepIndex === 0 ? 'pulse-write shockwave-blast' : ''}`}>0x4420</div>
              <div className="memory-cell written">0x4424</div>
              <div className={`memory-cell written ${stepIndex === 2 ? 'pulse-write shockwave-blast' : ''}`}>0x6210</div>
              <div className="memory-cell written">0x6214</div>
              <div className={`memory-cell ${stepIndex === 1 || isDmaBurstLock ? 'written pulse-write shockwave-blast' : ''}`}>0x8000</div>
              <div className={`memory-cell ${stepIndex === 1 || isDmaBurstLock ? 'written pulse-write shockwave-blast' : ''}`}>0x8004</div>
              <div className="memory-cell">0x8008</div>
              <div className="memory-cell">0x800C</div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', position: 'relative', zIndex: 3 }}>
              Single physical bandwidth pool shared across all processors and peripheral controllers
            </div>
          </div>
        </div>

        {/* RADAR METRICS DASHBOARD */}
        <div className="syn-radar-grid">
          <div className="stat-card">
            <span className="stat-label">CPU Compute Efficiency</span>
            <span className="stat-value" style={{ color: isDmaBurstLock ? 'var(--accent-red)' : (cpuEff < 50 ? 'var(--accent-red)' : 'var(--accent-green)'), fontSize: '1.85rem' }}>
              {isDmaBurstLock ? '0% (Stalled)' : `${cpuEff}%`}
            </span>
            <span className="stat-explanation">Effective processor utilization unaffected by bus stall states.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Bus Contention Saturation</span>
            <span className="stat-value" style={{ color: busSat > 75 ? 'var(--accent-red)' : 'var(--accent-amber)', fontSize: '1.85rem' }}>
              {isDmaBurstLock ? '100% (Locked)' : `${busSat}%`}
            </span>
            <span className="stat-explanation">Memory bus bandwidth consumption across active competitors.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">DMA I/O Throughput</span>
            <span className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.85rem' }}>
              {isDmaBurstLock ? '940 MB/s (Peak)' : (stepIndex === 1 ? '580 MB/s' : '0 MB/s (Waiting)')}
            </span>
            <span className="stat-explanation">Data transfer rate directly between disk buffer and RAM.</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Average Bus Wait Penalty</span>
            <span className="stat-value" style={{ color: 'var(--accent-purple)', fontSize: '1.85rem' }}>
              {isDmaBurstLock ? '99+ Clocks' : `${waitPenalty} Clocks`}
            </span>
            <span className="stat-explanation">Cycles processors spent waiting in line at the arbiter turnstile.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
