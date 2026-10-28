import React, { useState, useRef, useEffect } from 'react';
import { Zap, AlertTriangle, RefreshCw, Eye, Search, Gauge } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export default function MultiArchitectureComparator() {
  const [coreCount, setCoreCount] = useState(2);
  const [workloadType, setWorkloadType] = useState('single');
  const [mpMemMode, setMpMemMode] = useState('smp');

  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [mcProgress, setMcProgress] = useState(0);
  const [mpProgress, setMpProgress] = useState(0);

  const [dieFault, setDieFault] = useState(false);
  const [socketFault, setSocketFault] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  const [traceStep, setTraceStep] = useState(null); // 'c1', 'l3', 's1', 'arbiter', 'ram'

  const [narration, setNarration] = useState({
    title: 'Architectural Comparison Engine (Slide 16 vs 18)',
    msg: 'Standby. Multicore houses multiple cores on a single silicon die sharing L3 cache. Multiprocessors connect separate CPU chips across the motherboard bus arbiter. Click any button above to test!'
  });

  const benchmarkTimerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(benchmarkTimerRef.current);
  }, []);

  const handleCoreCountChange = (count) => {
    const num = parseInt(count, 10);
    setCoreCount(num);
    setDieFault(false);

    if (num === 2) {
      setNarration({
        title: 'Multicore Configuration: Dual-Core (Slide 16)',
        msg: 'Slide 16: Two cores integrated on a single silicon die sharing L3 cache. Optimal power density and thermal balance.'
      });
    } else if (num === 4) {
      setNarration({
        title: 'Multicore Configuration: Quad-Core (Slide 16)',
        msg: 'Quad-core configuration. Higher parallel throughput, but thermal heat starts concentrating on the single die.'
      });
    } else if (num === 8) {
      setNarration({
        title: 'Multicore Configuration: Octa-Core (Slide 17 Contention)',
        msg: 'Slide 17 Disadvantage Proven: "Increasing cores causes software interference due to resource sharing" & high heat generation in concentrated die area!'
      });
    }
  };

  const handleMemoryModeChange = (mode) => {
    setMpMemMode(mode);
    if (mode === 'smp') {
      setNarration({
        title: 'Multiprocessor: Shared Memory (Symmetric - SMP)',
        msg: 'Slide 18: In Symmetric Multiprocessors (SMP), all processors share a single main memory pool over the same system bus. High contention at the Bus Arbiter.'
      });
    } else {
      setNarration({
        title: 'Multiprocessor: Distributed Memory Organization',
        msg: 'Slide 18: "Each processor in a distributed memory multiprocessor has its own private memory where computation takes place. The system bus connects processors to communicate with each other."'
      });
    }
  };

  const runBenchmark = () => {
    clearInterval(benchmarkTimerRef.current);
    setBenchmarkRunning(true);
    setMcProgress(0);
    setMpProgress(0);

    let mcCurrent = 0;
    let mpCurrent = 0;

    if (workloadType === 'single') {
      setNarration({
        title: 'Benchmark: Single Multi-Threaded Program (Slide 20 Proof)',
        msg: 'Workload: Single High-Performance Render. Multicore cores share thread memory directly inside L3 cache without off-chip bus serialization.'
      });

      benchmarkTimerRef.current = setInterval(() => {
        mcCurrent = Math.min(100, mcCurrent + 16);
        mpCurrent = Math.min(100, mpCurrent + 7);
        setMcProgress(mcCurrent);
        setMpProgress(mpCurrent);

        if (mcCurrent >= 100 && mpCurrent < 100) {
          setNarration({
            title: 'Multicore Won Decisively (2.2x Faster)',
            msg: 'Slide 20 proven: "Multicore executes a single program faster" because tightly-coupled threads communicate over on-chip cache!'
          });
        }

        if (mcCurrent >= 100 && mpCurrent >= 100) {
          clearInterval(benchmarkTimerRef.current);
          setBenchmarkRunning(false);
          setNarration({
            title: 'Benchmark Finished: Slide 20 Verified',
            msg: 'Multicore completed in 1.1s. Multiprocessor required 2.4s due to external bus arbiter overhead.'
          });
        }
      }, 150);
    } else {
      setNarration({
        title: 'Benchmark: Multiple Independent Server Jobs (Slide 20 Proof)',
        msg: 'Workload: Multiple Independent Server Jobs (Web Server + DB Server). Multiprocessor has distinct physical CPU pipelines with zero cache contention.'
      });

      benchmarkTimerRef.current = setInterval(() => {
        mpCurrent = Math.min(100, mpCurrent + 16);
        mcCurrent = Math.min(100, mcCurrent + 8);
        setMcProgress(mcCurrent);
        setMpProgress(mpCurrent);

        if (mpCurrent >= 100 && mcCurrent < 100) {
          setNarration({
            title: 'Multiprocessor Won: High Independent Throughput',
            msg: 'Slide 20 proven: "Multiprocessor executes multiple programs faster" because separate physical sockets isolate independent process spaces with zero software interference!'
          });
        }

        if (mpCurrent >= 100 && mcCurrent >= 100) {
          clearInterval(benchmarkTimerRef.current);
          setBenchmarkRunning(false);
          setNarration({
            title: 'Benchmark Finished: High-Throughput Server Proved',
            msg: 'Multiprocessor completed independent jobs in 1.2s. Multicore suffered shared L3 cache thrashing, taking 2.3s.'
          });
        }
      }, 150);
    }
  };

  const traceMemoryAccess = () => {
    setTraceStep('c1');
    setNarration({
      title: 'Memory Access Trace: Multicore vs Multiprocessor (Slide 20 Proof)',
      msg: 'Step 1: Core 1 requests a memory block. Check L1/L2 caches...'
    });

    setTimeout(() => {
      setTraceStep('l3');
      setNarration({
        title: 'Multicore Cache Hit (0.8ns)',
        msg: 'MULTICORE CACHE HIT: L3 Cache on the single silicon die responded in 0.8ns! Zero data traveled over the motherboard bus. Slide 20 verified: "Multicore has less traffic."'
      });
    }, 700);

    setTimeout(() => {
      setTraceStep('s1');
      setNarration({
        title: 'Multiprocessor Cache Miss (Off-Chip Request)',
        msg: 'MULTIPROCESSOR REQUEST: Socket 1 suffers cache miss. Request must travel off-chip across motherboard pins to Bus Arbiter...'
      });
    }, 1600);

    setTimeout(() => {
      setTraceStep('arbiter');
      setNarration({
        title: 'Bus Arbiter Queue Contention (15ns)',
        msg: 'BUS ARBITER QUEUE: Socket 1 contends for the shared motherboard bus. Arbitration latency: 15ns...'
      });
    }, 2400);

    setTimeout(() => {
      setTraceStep('ram');
      setNarration({
        title: 'Main RAM Serviced (65ns)',
        msg: 'MAIN RAM SERVICED: Total access latency 65ns with heavy bus line utilization. Slide 20 verified: "Multiprocessor has more traffic."'
      });
    }, 3200);

    setTimeout(() => {
      setTraceStep(null);
      setNarration({
        title: 'Memory Trace Finished',
        msg: 'Direct visual proof: Multicore resolves data on-chip (L3 Cache), while Multiprocessor floods the external motherboard bus.'
      });
    }, 4400);
  };

  const triggerDieOverheat = () => {
    clearInterval(benchmarkTimerRef.current);
    soundFx.playThermalAlert();
    setDieFault(true);
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 380);
    setNarration({
      title: '💥 CRITICAL SILICON DIE FAILURE (Slide 17/20)',
      msg: 'Single point of failure demonstrated! Because all cores reside on the exact same silicon die (Slide 16), thermal breakdown halted EVERY core simultaneously. Slide 20: "Multicore processors are not as reliable as multiprocessors."'
    });
  };

  const triggerSocketPull = () => {
    clearInterval(benchmarkTimerRef.current);
    soundFx.playContentionSpark();
    setSocketFault(true);
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 380);
    setNarration({
      title: '🔌 FAULT TOLERANCE DEMONSTRATED (Slide 18 & 19)',
      msg: 'Hardware resilience proven! In multiprocessor systems, CPUs reside in physically distinct motherboard sockets (Slide 18). Even when Socket 2 failed, Socket 1 continued running without crashing! Slide 19 & 20: "Multiprocessors are more reliable as failure of one processor will not affect others."'
    });
  };

  const resetAll = () => {
    clearInterval(benchmarkTimerRef.current);
    setBenchmarkRunning(false);
    setMcProgress(0);
    setMpProgress(0);
    setDieFault(false);
    setSocketFault(false);
    setTraceStep(null);
    setNarration({
      title: 'Architectural Comparison Engine (Slide 16 vs 18)',
      msg: 'Both architectures restored. Select Core Count, Workload Type, or Memory Mode to test!'
    });
  };

  const dieTemp = coreCount === 2 ? '48°C (Normal)' : (coreCount === 4 ? '68°C (Warm)' : '89°C (Thermal Throttling Alert!)');
  const dieTempColor = coreCount === 8 ? 'var(--accent-red)' : 'var(--accent-amber)';

  return (
    <section className="tab-pane active">
      {/* CONTROLS STRIP */}
      <div className="controls-card">
        <div className="control-cluster">
          <span className="control-label">Cores on Die:</span>
          <select
            className="select-dropdown"
            value={coreCount}
            onChange={(e) => handleCoreCountChange(e.target.value)}
          >
            <option value="2">2 Cores (Dual-Core - Slide 16)</option>
            <option value="4">4 Cores (Quad-Core)</option>
            <option value="8">8 Cores (Octa-Core)</option>
          </select>
        </div>

        <div className="control-cluster">
          <span className="control-label">Workload:</span>
          <select
            className="select-dropdown"
            value={workloadType}
            onChange={(e) => setWorkloadType(e.target.value)}
          >
            <option value="single">Single Multi-Threaded App (Render/Game)</option>
            <option value="multi">Multiple Independent Server Jobs (Web+DB)</option>
          </select>
        </div>

        <div className="control-cluster">
          <button className="btn btn-primary" onClick={runBenchmark}>
            <Zap size={16} /> Run Benchmark
          </button>
          <button className="btn btn-secondary" onClick={traceMemoryAccess}>
            <Search size={16} /> Trace Memory Path
          </button>
          <button className="btn btn-danger" onClick={triggerDieOverheat}>
            <AlertTriangle size={16} /> Overheat Die
          </button>
          <button className="btn btn-danger" onClick={triggerSocketPull}>
            <AlertTriangle size={16} /> Pull Socket 2
          </button>
          <button className="btn btn-secondary" onClick={resetAll}>
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* NARRATION BANNER */}
      <div className="narration-banner" style={{ borderLeftColor: 'var(--accent-purple)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="narration-icon">⚙️</div>
          <div className="audio-equalizer">
            <div className="eq-bar" style={{ background: 'var(--accent-purple)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-purple)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-purple)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-purple)' }}></div>
            <div className="eq-bar" style={{ background: 'var(--accent-purple)' }}></div>
          </div>
        </div>
        <div className="narration-text">
          <div className="narration-title">{narration.title}</div>
          <div className="narration-message">{narration.msg}</div>
        </div>
      </div>

      {/* LIVE BENCHMARK PROGRESS HUD */}
      {benchmarkRunning && (
        <div className="controls-card" style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent-blue)', marginBottom: '1.75rem', boxShadow: 'var(--shadow-elevated)' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--accent-blue)' }}>Multicore Workload Progress:</span>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{mcProgress}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(0, 82, 255, 0.15)', border: '1px solid rgba(0, 82, 255, 0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${mcProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))', boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)', transition: 'width 0.15s ease' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                <span>Interconnect: <strong style={{ color: 'var(--accent-green)' }}>On-Die Crossbar (0.8ns)</strong></span>
                <span>Off-Chip Bus Load: <strong style={{ color: 'var(--accent-green)' }}>14% (Low)</strong></span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--accent-purple)' }}>Multiprocessor Workload Progress:</span>
                <span style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>{mpProgress}%</span>
              </div>
              <div style={{ height: '12px', background: 'rgba(157, 78, 221, 0.15)', border: '1px solid rgba(157, 78, 221, 0.3)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${mpProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-amber))', transition: 'width 0.15s ease' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                <span>Interconnect: <strong style={{ color: 'var(--accent-amber)' }}>Motherboard Bus Arbiter (15ns)</strong></span>
                <span>Off-Chip Bus Contention: <strong style={{ color: 'var(--accent-red)' }}>84% (High Contention)</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 5: DUAL NEON TACHOMETER / SPEEDOMETER HUD GAUGES */}
      <div className="speedo-gauges-row">
        <div className="speedo-card card-hud-corner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Gauge size={16} /> Multicore L3 Interconnect Speedometer
            </span>
            <span className="badge-status badge-green" style={{ fontSize: '0.74rem' }}>
              {dieFault ? '0 MB/s (DEAD)' : (benchmarkRunning ? '7,800 MB/s' : '7,200 MB/s')}
            </span>
          </div>
          
          <svg viewBox="0 0 200 115" className="speedo-dial-svg">
            <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#0b1325" strokeWidth="14" strokeLinecap="round" />
            <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="var(--accent-blue)" strokeWidth="14" strokeDasharray="235" strokeDashoffset={dieFault ? 235 : 45} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 10px var(--accent-blue))' }} />
            <circle cx="100" cy="100" r="9" fill="#020408" stroke="var(--accent-cyan)" strokeWidth="3" />
            <line x1="100" y1="100" x2="100" y2="35" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px var(--accent-cyan))', transformOrigin: '100px 100px', transform: `rotate(${dieFault ? -90 : (benchmarkRunning ? 68 : 55)}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>0 GB/s</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>0.8ns L3 (LOW LATENCY)</span>
            <span>10 GB/s</span>
          </div>
        </div>

        <div className="speedo-card card-hud-corner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-purple)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Gauge size={16} /> Multiprocessor Bus Throughput Speedometer
            </span>
            <span className="badge-status badge-amber" style={{ fontSize: '0.74rem' }}>
              {socketFault ? '420 MB/s (DEGRADED)' : (benchmarkRunning ? '1,100 MB/s' : '850 MB/s')}
            </span>
          </div>
          
          <svg viewBox="0 0 200 115" className="speedo-dial-svg">
            <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#0b1325" strokeWidth="14" strokeLinecap="round" />
            <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="var(--accent-amber)" strokeWidth="14" strokeDasharray="235" strokeDashoffset={socketFault ? 190 : 140} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 10px var(--accent-amber))' }} />
            <circle cx="100" cy="100" r="9" fill="#020408" stroke="var(--accent-blue)" strokeWidth="3" />
            <line x1="100" y1="100" x2="100" y2="35" stroke="var(--accent-blue)" strokeWidth="3.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px var(--accent-blue))', transformOrigin: '100px 100px', transform: `rotate(${socketFault ? -55 : (benchmarkRunning ? -20 : -35)}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>0 GB/s</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>15-65ns (CONTENTION)</span>
            <span>10 GB/s</span>
          </div>
        </div>
      </div>

      {/* SCHEMATICS COMPARISON */}
      <div className={`comparison-grid ${glitchActive ? 'hologram-glitch-active' : ''}`}>
        {/* MULTICORE PANE */}
        <div className="arch-spec-card">
          <div className="node-header">
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)' }}>Multicore Architecture (Slide 16)</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Multiple execution cores on a SINGLE integrated silicon chip</div>
            </div>
            <span className="badge-status badge-blue">ON-CHIP CROSSBAR</span>
          </div>

          <div className="meta-tag-bar">
            <span className="meta-tag" style={{ color: 'var(--accent-green)' }}>📦 Cost: ~$220 (Cheap)</span>
            <span className="meta-tag" style={{ color: 'var(--accent-blue)' }}>⚡ Latency: ~0.8ns</span>
            <span className="meta-tag" style={{ color: dieFault ? 'var(--accent-red)' : dieTempColor }}>
              🌡️ Die Temp: {dieFault ? '🔥 105°C (Die Melted)' : dieTemp}
            </span>
          </div>

          <div className={`chip-silicon-boundary ${dieFault ? 'thermal-critical' : (coreCount === 8 ? 'thermal-active' : '')}`} style={{ borderColor: dieFault ? 'var(--accent-red)' : 'var(--accent-blue)', position: 'relative' }}>
            {/* FEATURE 3: SILICON ISOTHERMAL HEATMAP OVERLAY */}
            <div className="thermal-heatmap-overlay">
              <svg className="isothermal-contour-svg" viewBox="0 0 300 200" preserveAspectRatio="none">
                <ellipse cx="150" cy="100" rx="130" ry="80" fill="none" stroke={dieFault ? "rgba(255, 0, 85, 0.45)" : "rgba(0, 82, 255, 0.35)"} strokeWidth="1.5" strokeDasharray="6 4" />
                <ellipse cx="150" cy="100" rx="90" ry="55" fill="none" stroke={dieFault ? "rgba(255, 0, 85, 0.65)" : "rgba(0, 210, 255, 0.45)"} strokeWidth="1.5" />
                <ellipse cx="150" cy="100" rx="50" ry="30" fill={dieFault ? "rgba(255, 0, 85, 0.2)" : "rgba(0, 82, 255, 0.12)"} stroke={dieFault ? "#ff0055" : "rgba(0, 210, 255, 0.7)"} strokeWidth="2" />
              </svg>
            </div>

            <span className="chip-boundary-label">Single Silicon Die Package</span>

            <div
              className="cores-duo"
              style={{
                gridTemplateColumns: coreCount === 8 ? 'repeat(4, 1fr)' : (coreCount === 4 ? 'repeat(2, 1fr)' : '1fr 1fr'),
                position: 'relative',
                zIndex: 2
              }}
            >
              {Array.from({ length: coreCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={`processing-unit ${dieFault ? 'crashed-unit' : 'active-work'} ${traceStep === 'c1' && idx === 0 ? 'trace-highlight-green' : ''}`}
                >
                  <div style={{ fontWeight: 800, fontSize: coreCount === 8 ? '0.88rem' : '1.05rem' }}>Core {idx + 1}</div>
                  <div className="cache-hierarchy-pill" style={{ fontSize: '0.72rem' }}>L1: 32K | L2: 512K</div>
                  <div className={`core-temp-pill ${dieFault ? 'hot' : ''}`}>
                    🌡️ {dieFault ? '105°C' : `${42 + idx * 5}°C`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: dieFault ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700, marginTop: '0.35rem' }}>
                    {dieFault ? '🔥 CRASHED (MELTED)' : `Executing Thread ${idx + 1}`}
                  </div>
                  {!dieFault && (
                    <div className="core-thread-bars">
                      <div className="core-bar" style={{ animationDuration: `${0.65 + (idx * 0.08)}s` }}></div>
                      <div className="core-bar" style={{ animationDuration: `${0.85 + (idx * 0.09)}s` }}></div>
                      <div className="core-bar" style={{ animationDuration: `${0.55 + (idx * 0.07)}s` }}></div>
                      <div className="core-bar" style={{ animationDuration: `${0.75 + (idx * 0.11)}s` }}></div>
                      <div className="core-bar" style={{ animationDuration: `${0.60 + (idx * 0.06)}s` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* SHARED L3 WITH COUNTER-ROTATING DUAL CROSSBAR TRACK */}
            <div className={`on-chip-l3-cache ${traceStep === 'l3' ? 'trace-highlight-green' : ''}`}>
              ⚡ On-Chip Shared L3 Cache (8 MB - Ultra Low Latency Interconnect)
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-blue)', marginTop: '0.25rem' }}>
                Filters memory requests on-die → Low external bus traffic
              </div>
              <div className="crossbar-ring-track">
                <div className="crossbar-ring-pulse"></div>
                <div className="crossbar-ring-pulse pulse-reverse"></div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 600 }}>
              ⬇ On-Chip Bus Interface Controller (Minimal off-chip bus load)
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-muted)' }}>Main Memory (DRAM)</span>
          </div>

          <div style={{ background: 'rgba(2, 132, 199, 0.08)', borderRadius: 'var(--radius-md)', padding: '1.1rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent-green)' }}>Slide 17 Advantages:</strong> Faster clock speed, energy efficient, fast inter-core communication, less external bus traffic.<br />
            <strong style={{ color: 'var(--accent-red)' }}>Slide 17 Disadvantages:</strong> Thermal hotspots, shared cache interference, single silicon failure disables all cores.
          </div>
        </div>

        {/* MULTIPROCESSOR PANE */}
        <div className="arch-spec-card">
          <div className="node-header">
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-purple)' }}>Multiprocessor Architecture (Slide 18)</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Two or more SEPARATE physical CPU sockets on motherboard</div>
            </div>
            <span className="badge-status" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid #a855f7' }}>
              MOTHERBOARD BUS
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--border-strong)', padding: '0.5rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-purple)' }}>Slide 18 Memory Mode:</span>
            <select
              className="select-dropdown"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
              value={mpMemMode}
              onChange={(e) => handleMemoryModeChange(e.target.value)}
            >
              <option value="smp">Symmetric (SMP) - Shared RAM</option>
              <option value="distributed">Distributed Memory - Private RAM</option>
            </select>
          </div>

          <div className="meta-tag-bar">
            <span className="meta-tag" style={{ color: 'var(--accent-red)' }}>📦 Cost: ~$1,850 (Expensive)</span>
            <span className="meta-tag" style={{ color: 'var(--accent-amber)' }}>⚡ Bus Overhead: ~15-65ns</span>
            <span className="meta-tag" style={{ color: 'var(--accent-green)' }}>🛡️ Fault Isolation: Independent</span>
          </div>

          <div className="motherboard-boundary">
            <span className="motherboard-boundary-label">Motherboard Sockets Layout</span>

            <div className="cores-duo">
              <div className={`processing-unit active-work ${traceStep === 's1' ? 'trace-highlight-amber' : ''}`}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>CPU Socket 1</div>
                <div className="cache-hierarchy-pill">Private Cache: 1MB</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-green)', fontWeight: 700, marginTop: '0.5rem' }}>
                  {socketFault ? 'ACTIVE: Absorbed Job B' : 'Executing Job A'}
                </div>
                <div className="core-thread-bars">
                  <div className="core-bar" style={{ background: 'var(--accent-amber)', animationDuration: '0.7s' }}></div>
                  <div className="core-bar" style={{ background: 'var(--accent-amber)', animationDuration: '0.9s' }}></div>
                  <div className="core-bar" style={{ background: 'var(--accent-amber)', animationDuration: '0.6s' }}></div>
                </div>
              </div>

              <div className={`processing-unit ${socketFault ? 'crashed-unit' : 'active-work'}`}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>CPU Socket 2</div>
                <div className="cache-hierarchy-pill">Private Cache: 1MB</div>
                <div style={{ fontSize: '0.85rem', color: socketFault ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700, marginTop: '0.5rem' }}>
                  {socketFault ? '⚡ DISCONNECTED (Socket 2 Offline)' : 'Executing Job B'}
                </div>
                {!socketFault && (
                  <div className="core-thread-bars">
                    <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.8s' }}></div>
                    <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.6s' }}></div>
                    <div className="core-bar" style={{ background: 'var(--accent-purple)', animationDuration: '0.75s' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* SHARED SYSTEM BUS ARBITER WITH ROTATING IRIS */}
            <div className={`system-bus-arbiter ${traceStep === 'arbiter' ? 'trace-highlight-amber' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                <span className="iris-ring-rotor" style={{ fontSize: '1rem' }}>⚙️</span>
                <span>System Bus Arbiter & Shared Memory Pathway (Slide 18)</span>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
                Arbitrates access to memory & I/O → Serializes off-chip requests
              </div>
              <div className="bus-physical-line packet-stream-track active-data" style={{ height: '5px', marginTop: '0.4rem' }}>
                <div className="floating-data-packet packet-amber packet-p1"></div>
                <div className="floating-data-packet packet-amber packet-p2"></div>
              </div>
            </div>

            {mpMemMode === 'smp' ? (
              <div
                className={traceStep === 'ram' ? 'trace-highlight-amber' : ''}
                style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-muted)' }}>Shared Main Memory Pool (Large DRAM)</span>
              </div>
            ) : (
              <div className="distributed-ram-grid">
                <div className="distributed-ram-node">
                  Socket 1 Local RAM<br />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fast Private Memory (Slide 18)</span>
                </div>
                <div className="distributed-ram-node">
                  Socket 2 Local RAM<br />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fast Private Memory (Slide 18)</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(168, 85, 247, 0.08)', borderRadius: 'var(--radius-md)', padding: '1.1rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent-green)' }}>Slide 19 Advantages:</strong> High fault tolerance (failure of 1 CPU does not affect others), high multi-job throughput.<br />
            <strong style={{ color: 'var(--accent-red)' }}>Slide 19 Disadvantages:</strong> Heavy bus traffic, complex coordination, expensive hardware.
          </div>
        </div>
      </div>

      {/* REAL WORLD FACULTY ANALOGY CARD */}
      <div className="analogy-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>💡 Real-World Architectural Analogy</span>
          <span className="badge-status badge-amber">CONCEPTUAL ANALOGY</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Use this mental model to immediately understand the physical design trade-offs:
        </p>
        <div className="analogy-grid">
          <div className="analogy-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-blue)' }}>👨‍🍳 Multicore = "One Kitchen, Multiple Chefs"</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All chefs (cores) stand inside the <strong>same kitchen</strong> (silicon die). They share the same spice rack (L3 Cache) instantaneously with zero walking. It is fast, compact, and cheap. But if the kitchen catches fire (die overheat), <strong>every chef must evacuate</strong> (all cores crash).
            </p>
          </div>

          <div className="analogy-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-purple)' }}>🏢 Multiprocessor = "Separate Restaurant Branches"</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Each restaurant (CPU socket) is an <strong>independent building</strong>. If Branch 2 burns down, Branch 1 stays open and serves customers (high fault tolerance). But whenever they need ingredients from the central supplier (Main Memory), supply trucks must travel over the city highway (System Bus & Arbiter), causing <strong>heavy traffic congestion</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
