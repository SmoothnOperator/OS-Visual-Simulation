import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Cpu, 
  Layers, 
  Zap, 
  Activity, 
  RefreshCw, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowDown, 
  ArrowUp, 
  HelpCircle,
  Play,
  TrendingUp,
  HardDrive,
  Server
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

// 5-Tier Memory Hierarchy Definitions (Strictly From Module 1, Page 11)
const HIERARCHY_TIERS = [
  {
    id: 'registers',
    level: 1,
    name: 'CPU Registers',
    classification: 'Internal Storage',
    size: 'bytes to kilobytes',
    moduleText: 'The fastest and most expensive memory located directly inside the CPU. Holds data currently being processed (size: bytes to kilobytes).',
    location: 'Located directly inside the CPU',
    speedCost: 'Fastest speed, Most expensive',
    devices: 'CPU Internal Registers',
    color: '#00d2ff',
    bgTint: 'rgba(0, 210, 255, 0.12)',
    borderTint: 'rgba(0, 210, 255, 0.4)',
    widthPct: 46
  },
  {
    id: 'cache',
    level: 2,
    name: 'Cache Memory',
    classification: 'Internal Storage',
    size: 'kilobytes to megabytes',
    moduleText: 'High-speed Static RAM (SRAM) positioned between the CPU and RAM. Stores frequently used instructions and data to speed up processing (size: kilobytes to megabytes).',
    location: 'Positioned between the CPU and RAM',
    speedCost: 'High-speed buffer (SRAM)',
    devices: 'Static RAM (SRAM) — L1, L2, L3 levels',
    color: '#0052ff',
    bgTint: 'rgba(0, 82, 255, 0.14)',
    borderTint: 'rgba(0, 82, 255, 0.5)',
    widthPct: 60
  },
  {
    id: 'main_memory',
    level: 3,
    name: 'Main Memory (RAM)',
    classification: 'Primary Storage',
    size: 'gigabytes',
    moduleText: 'The primary working memory of the computer, typically Dynamic RAM (DRAM). Holds active programs and operating data (size: gigabytes).',
    location: 'Motherboard System RAM',
    speedCost: 'Moderate speed, Primary working memory',
    devices: 'Dynamic RAM (DRAM)',
    color: '#fbbf24',
    bgTint: 'rgba(251, 191, 36, 0.12)',
    borderTint: 'rgba(251, 191, 36, 0.45)',
    widthPct: 74
  },
  {
    id: 'secondary',
    level: 4,
    name: 'Secondary Storage',
    classification: 'Secondary Storage',
    size: 'terabytes',
    moduleText: 'Non-volatile storage like Hard Drives (HDDs) or Solid-State Drives (SSDs). Used for long-term data persistence (size: terabytes).',
    location: 'Secondary Storage Bus / Drive Bays',
    speedCost: 'Large capacity, Long-term persistence',
    devices: 'Hard Drives (HDDs), Solid-State Drives (SSDs), USB / Flash Memory',
    color: '#a78bfa',
    bgTint: 'rgba(167, 139, 250, 0.12)',
    borderTint: 'rgba(167, 139, 250, 0.45)',
    widthPct: 88
  },
  {
    id: 'tertiary',
    level: 5,
    name: 'Tertiary / Offline Storage',
    classification: 'Tertiary Storage',
    size: 'petabytes',
    moduleText: 'Massive capacity storage such as magnetic tapes or optical discs used for backups (size: petabytes).',
    location: 'Offline / Archival Tape Libraries',
    speedCost: 'Massive capacity, Lowest cost per bit',
    devices: 'Magnetic Tapes, Tape Drives, Optical Discs',
    color: '#64748b',
    bgTint: 'rgba(100, 116, 139, 0.12)',
    borderTint: 'rgba(100, 116, 139, 0.45)',
    widthPct: 100
  }
];

// Initial Direct-Mapped Cache Simulation Lines (4 Lines in L1)
const INITIAL_CACHE_LINES = [
  { index: 0, valid: 1, tag: '0x40', data: '0x4A, 0x1F, 0x88, 0x02', hits: 8, lru: 1 },
  { index: 1, valid: 1, tag: '0x04', data: '0xC2, 0x7E, 0x11, 0x90', hits: 12, lru: 3 },
  { index: 2, valid: 0, tag: '0x00', data: '0x00, 0x00, 0x00, 0x00', hits: 0, lru: 0 },
  { index: 3, valid: 1, tag: '0x80', data: '0xFF, 0x33, 0xAA, 0x5D', hits: 2, lru: 2 },
];

export default function MemoryHierarchyLab() {
  // Selected Pyramid Tier & Popup Modal State
  const [selectedTier, setSelectedTier] = useState(HIERARCHY_TIERS[1]); // Default Cache Memory
  const [showTierModal, setShowTierModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showTierModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTierModal]);

  const closeModal = () => {
    setShowTierModal(false);
  };

  // Cache Lookup Simulator States
  const [queryAddress, setQueryAddress] = useState('0x1004');
  const [cacheViewMode, setCacheViewMode] = useState('pipeline'); // 'pipeline' | 'topology'
  const [cacheLines, setCacheLines] = useState(INITIAL_CACHE_LINES);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(null); // 'cpu', 'l1', 'l2', 'l3', 'dram', 'fill'
  const [lastResult, setLastResult] = useState(null); // { level: 'L1', hit: true, latency: 1.0, addr: '0x1004' }

  // Telemetry HUD Counters
  const [stats, setStats] = useState({
    totalAccesses: 24,
    l1Hits: 18,
    l2Hits: 3,
    l3Hits: 1,
    dramMisses: 2
  });

  // Automated Benchmark / Experiment Loop State
  const [experimentMode, setExperimentMode] = useState(null); // 'spatial', 'temporal', 'thrashing'
  const [experimentProgress, setExperimentProgress] = useState(0);
  const experimentTimerRef = useRef(null);

  // Narration Box State
  const [narration, setNarration] = useState({
    title: 'Memory Hierarchy & Cache Memory Lab Armed',
    text: 'Operating System Memory Hierarchy balances Access Time, Storage Capacity, and Cost Per Bit. The Cache acts as a high-speed bridge between the CPU and Main Memory. Select a pyramid tier or run an address query!'
  });

  // Derived Performance Metrics
  const totalHits = stats.l1Hits + stats.l2Hits + stats.l3Hits;
  const hitRatio = stats.totalAccesses > 0 ? ((totalHits / stats.totalAccesses) * 100).toFixed(1) : '0.0';
  const missRatio = stats.totalAccesses > 0 ? (((stats.totalAccesses - totalHits) / stats.totalAccesses) * 100).toFixed(1) : '0.0';

  // AMAT Formula Calculation: AMAT = T_L1 + MissRate_L1 * (T_L2 + MissRate_L2 * (T_L3 + MissRate_L3 * T_DRAM))
  // For telemetry simplicity: Average access time across all recorded accesses
  const avgMemoryAccessTime = stats.totalAccesses > 0
    ? (
        (stats.l1Hits * 1.0 +
         stats.l2Hits * 3.5 +
         stats.l3Hits * 12.0 +
         stats.dramMisses * 65.0) /
        stats.totalAccesses
      ).toFixed(2)
    : '1.00';

  const pureDramTime = 65.0;
  const speedupFactor = (pureDramTime / parseFloat(avgMemoryAccessTime)).toFixed(1);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (experimentTimerRef.current) clearInterval(experimentTimerRef.current);
    };
  }, []);

  // Parse 16-Bit Hex Address into Tag, Index, and Offset
  const parseAddress = (hexStr) => {
    let cleanHex = hexStr.replace(/^0x/i, '').padStart(4, '0').slice(-4);
    let val = parseInt(cleanHex, 16);
    if (isNaN(val)) val = 0x1000;

    let tag = (val >> 6) & 0xFF; // Top 8 bits (Tag)
    let index = (val >> 4) & 0x03; // Middle 2 bits (4 cache lines)
    let offset = val & 0x0F; // Lower 4 bits (16-byte block offset)

    return {
      cleanHex: `0x${val.toString(16).toUpperCase().padStart(4, '0')}`,
      tagHex: `0x${tag.toString(16).toUpperCase().padStart(2, '0')}`,
      index: index,
      offsetHex: `0x${offset.toString(16).toUpperCase().padStart(2, '0')}`,
      tagVal: tag,
      rawVal: val
    };
  };

  // Perform Memory Request Simulation
  const executeMemoryLookup = (addressToLookup, isBatch = false) => {
    if (isSimulating && !isBatch) return;
    setIsSimulating(true);

    const parsed = parseAddress(addressToLookup);
    setActiveStep('cpu');

    try { soundFx.playClick(); } catch (e) {}

    // Check L1 Cache
    const targetLine = cacheLines[parsed.index];
    const isL1Hit = targetLine.valid === 1 && targetLine.tag === parsed.tagHex;

    setTimeout(() => {
      setActiveStep('l1');

      if (isL1Hit) {
        // L1 CACHE HIT
        try { soundFx.playCacheHit(); } catch (e) {}
        setActiveStep('l1-hit');
        const res = { level: 'L1 Cache', hit: true, latency: 1.0, addr: parsed.cleanHex, lineIndex: parsed.index };
        setLastResult(res);
        setStats(prev => ({
          ...prev,
          totalAccesses: prev.totalAccesses + 1,
          l1Hits: prev.l1Hits + 1
        }));
        setCacheLines(prev => prev.map((cl, i) => i === parsed.index ? { ...cl, hits: cl.hits + 1 } : cl));
        setNarration({
          title: `L1 CACHE HIT! [${parsed.cleanHex}]`,
          text: `Tag Match Success! Address ${parsed.cleanHex} mapped to Set Line ${parsed.index} with matching Tag ${parsed.tagHex}. Data delivered to CPU registers in just 1.0 ns (3 clock cycles) with zero DRAM bus traffic!`
        });
        setTimeout(() => {
          setActiveStep(null);
          setIsSimulating(false);
        }, 500);
      } else {
        // L1 MISS -> Check L2
        try { soundFx.playCacheMiss(); } catch (e) {}
        setActiveStep('l1-miss');

        setTimeout(() => {
          setActiveStep('l2');
          // Simulated 50% chance of L2 hit if not matching L1
          const isL2Hit = parsed.rawVal % 3 === 0;

          if (isL2Hit) {
            // L2 CACHE HIT
            try { soundFx.playCacheHit(); } catch (e) {}
            setActiveStep('l2-hit');
            const res = { level: 'L2 Cache', hit: true, latency: 3.5, addr: parsed.cleanHex, lineIndex: parsed.index };
            setLastResult(res);
            setStats(prev => ({
              ...prev,
              totalAccesses: prev.totalAccesses + 1,
              l2Hits: prev.l2Hits + 1
            }));
            // Fill L1
            setCacheLines(prev => prev.map((cl, i) => i === parsed.index ? {
              ...cl,
              valid: 1,
              tag: parsed.tagHex,
              data: `0x${((parsed.rawVal * 7) % 256).toString(16).toUpperCase()}, 0x${((parsed.rawVal * 11) % 256).toString(16).toUpperCase()}`,
              hits: 1
            } : cl));
            setNarration({
              title: `L2 CACHE HIT! [${parsed.cleanHex}]`,
              text: `L1 Missed, but L2 Cache responded in 3.5 ns (10 cycles). Block fetched from L2 and loaded into L1 for future temporal reuse.`
            });
            setTimeout(() => {
              setActiveStep(null);
              setIsSimulating(false);
            }, 500);
          } else {
            // L2 MISS -> Check L3
            setActiveStep('l2-miss');

            setTimeout(() => {
              setActiveStep('l3');
              const isL3Hit = parsed.rawVal % 5 === 0;

              if (isL3Hit) {
                // L3 CACHE HIT
                try { soundFx.playCacheHit(); } catch (e) {}
                setActiveStep('l3-hit');
                const res = { level: 'L3 Cache', hit: true, latency: 12.0, addr: parsed.cleanHex, lineIndex: parsed.index };
                setLastResult(res);
                setStats(prev => ({
                  ...prev,
                  totalAccesses: prev.totalAccesses + 1,
                  l3Hits: prev.l3Hits + 1
                }));
                // Fill L1
                setCacheLines(prev => prev.map((cl, i) => i === parsed.index ? {
                  ...cl,
                  valid: 1,
                  tag: parsed.tagHex,
                  data: `0x${((parsed.rawVal * 13) % 256).toString(16).toUpperCase()}, 0x${((parsed.rawVal * 17) % 256).toString(16).toUpperCase()}`,
                  hits: 1
                } : cl));
                setNarration({
                  title: `L3 CACHE HIT! [${parsed.cleanHex}]`,
                  text: `L1 & L2 Missed, but shared On-Die L3 Cache hit in 12.0 ns. Avoided off-chip motherboard bus traversal.`
                });
                setTimeout(() => {
                  setActiveStep(null);
                  setIsSimulating(false);
                }, 500);
              } else {
                // FULL CACHE MISS -> DRAM ACCESS STROBE!
                try { soundFx.playDramStrobe(); } catch (e) {}
                setActiveStep('dram');

                setTimeout(() => {
                  setActiveStep('fill');
                  const res = { level: 'Main Memory (DRAM)', hit: false, latency: 65.0, addr: parsed.cleanHex, lineIndex: parsed.index };
                  setLastResult(res);
                  setStats(prev => ({
                    ...prev,
                    totalAccesses: prev.totalAccesses + 1,
                    dramMisses: prev.dramMisses + 1
                  }));
                  // Cache Fill L1 line
                  setCacheLines(prev => prev.map((cl, i) => i === parsed.index ? {
                    ...cl,
                    valid: 1,
                    tag: parsed.tagHex,
                    data: `0x${((parsed.rawVal * 3 + 0x11) % 256).toString(16).toUpperCase()}, 0x${((parsed.rawVal * 5 + 0x33) % 256).toString(16).toUpperCase()}, 0x${((parsed.rawVal * 7 + 0x77) % 256).toString(16).toUpperCase()}, 0x${((parsed.rawVal * 9 + 0x99) % 256).toString(16).toUpperCase()}`,
                    hits: 1
                  } : cl));
                  setNarration({
                    title: `CACHE MISS! DRAM FETCH PENALTY (65.0 ns)`,
                    text: `All 3 cache levels missed! CPU stalled for 65.0 ns (200+ clock cycles) while the memory controller fetched a 64-byte block from physical DRAM. Block loaded into L1/L2/L3 for spatial locality.`
                  });

                  setTimeout(() => {
                    setActiveStep(null);
                    setIsSimulating(false);
                  }, 650);
                }, 750);
              }
            }, 450);
          }
        }, 450);
      }
    }, 450);
  };

  // Run Locality of Reference Experiments
  const startExperiment = (mode) => {
    if (experimentTimerRef.current) {
      clearInterval(experimentTimerRef.current);
      experimentTimerRef.current = null;
    }

    setExperimentMode(mode);
    setExperimentProgress(0);

    let step = 0;
    const maxSteps = 12;

    if (mode === 'spatial') {
      // Spatial Locality: Sequential memory addresses (e.g. iterating through array elements)
      // 0x2000, 0x2004, 0x2008, 0x200C... (All share the same cache line block tag!)
      setNarration({
        title: 'Running Experiment: Spatial Locality (Sequential Array Iteration)',
        text: 'Testing Principle: "Nearby memory locations will likely be referenced soon." Accessing consecutive array elements in memory block 0x2000...'
      });

      experimentTimerRef.current = setInterval(() => {
        step++;
        let addr = `0x${(0x2000 + (step - 1) * 4).toString(16).toUpperCase()}`;
        setQueryAddress(addr);
        setExperimentProgress(Math.round((step / maxSteps) * 100));

        executeMemoryLookup(addr, true);

        if (step >= maxSteps) {
          clearInterval(experimentTimerRef.current);
          experimentTimerRef.current = null;
          setExperimentMode(null);
        }
      }, 700);

    } else if (mode === 'temporal') {
      // Temporal Locality: Repeatedly accessing the same variable (e.g. loop accumulator variable)
      setNarration({
        title: 'Running Experiment: Temporal Locality (Loop Accumulator Spin)',
        text: 'Testing Principle: "Recently referenced memory will likely be referenced again soon." Accessing variable at address 0x04F2 repeatedly in a tight loop...'
      });

      experimentTimerRef.current = setInterval(() => {
        step++;
        let addr = '0x04F2';
        setQueryAddress(addr);
        setExperimentProgress(Math.round((step / maxSteps) * 100));

        executeMemoryLookup(addr, true);

        if (step >= maxSteps) {
          clearInterval(experimentTimerRef.current);
          experimentTimerRef.current = null;
          setExperimentMode(null);
        }
      }, 550);

    } else if (mode === 'thrashing') {
      // Cache Thrashing: Conflicting addresses that evict each other
      setNarration({
        title: 'Running Experiment: Cache Thrashing & Stride Conflicts',
        text: 'Testing Penalty: Accessing large strides with identical set indices causes continuous evictions and 100% DRAM penalty cycles.'
      });

      const thrashAddrs = ['0x1000', '0x5000', '0x9000', '0xD000', '0x1000', '0x5000', '0x9000'];
      experimentTimerRef.current = setInterval(() => {
        step++;
        let addr = thrashAddrs[(step - 1) % thrashAddrs.length];
        setQueryAddress(addr);
        setExperimentProgress(Math.round((step / thrashAddrs.length) * 100));

        executeMemoryLookup(addr, true);

        if (step >= thrashAddrs.length) {
          clearInterval(experimentTimerRef.current);
          experimentTimerRef.current = null;
          setExperimentMode(null);
        }
      }, 750);
    }
  };

  // Reset Metrics & Cache Table
  const handleReset = () => {
    if (experimentTimerRef.current) clearInterval(experimentTimerRef.current);
    setExperimentMode(null);
    setExperimentProgress(0);
    setIsSimulating(false);
    setActiveStep(null);
    setLastResult(null);
    setCacheLines(INITIAL_CACHE_LINES);
    setStats({
      totalAccesses: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      dramMisses: 0
    });
    setNarration({
      title: 'Cache Subsystem Reset',
      text: 'All cache tag lines flushed. Telemetry counters reset to 0. Ready for new address lookup.'
    });
    try { soundFx.playClick(); } catch (e) {}
  };

  return (
    <div className="memory-hierarchy-container">
      {/* SECTION 1: LAB CONTROL HEADER */}
      <div className="controls-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="badge-status badge-blue">SYLLABUS MODULE 1</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Memory Hierarchy & Cache Memory Lab
              </h2>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Balance of Access Speed, Storage Capacity & Cost Per Bit • Locality of Reference (Temporal & Spatial)
            </div>
          </div>

          {/* QUICK EXPERIMENT ACTION BUTTONS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className={`btn-cyber-kinetic btn-action-spatial ${experimentMode === 'spatial' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              onClick={() => startExperiment('spatial')}
              disabled={isSimulating && experimentMode !== 'spatial'}
              title="Demonstrates Spatial Locality: Array element traversal achieves ~93% cache hits"
            >
              <TrendingUp size={14} /> Spatial Locality (Array)
            </button>

            <button
              className={`btn-cyber-kinetic btn-action-temporal ${experimentMode === 'temporal' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              onClick={() => startExperiment('temporal')}
              disabled={isSimulating && experimentMode !== 'temporal'}
              title="Demonstrates Temporal Locality: Loop counter variable hits L1 repeatedly at 1.0ns"
            >
              <Zap size={14} /> Temporal Locality (Loop)
            </button>

            <button
              className={`btn-cyber-kinetic btn-action-thrash ${experimentMode === 'thrashing' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
              onClick={() => startExperiment('thrashing')}
              disabled={isSimulating && experimentMode !== 'thrashing'}
              title="Demonstrates Cache Thrashing: Conflict misses force continuous 65ns DRAM delays"
            >
              <Flame size={14} color="#f43f5e" /> Cache Thrashing Test
            </button>

            <button
              className="btn-cyber-kinetic btn-action-reset"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
              onClick={handleReset}
              title="Clear all cache lines and reset statistics counters"
            >
              <RefreshCw size={14} /> Reset Lab
            </button>
          </div>
        </div>

        {/* EXPERIMENT PROGRESS BAR IF RUNNING */}
        {experimentMode && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>
                EXPERIMENT ACTIVE: {experimentMode.toUpperCase()} SIMULATION RUNNING...
              </span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>{experimentProgress}% COMPLETE</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill animated-bar-cyan"
                style={{ width: `${experimentProgress}%`, background: 'var(--accent-cyan)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LIVE TELEMETRY & AMAT HUD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div className="telemetry-card">
          <div className="telemetry-card-label">TOTAL MEMORY REQUESTS</div>
          <div className="telemetry-card-val" style={{ color: '#ffffff' }}>
            {stats.totalAccesses}
          </div>
          <div className="telemetry-card-sub" style={{ color: 'var(--text-muted)' }}>
            CPU Address Queries
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-card-label">CACHE HIT RATIO</div>
          <div className="telemetry-card-val" style={{ color: 'var(--accent-green)' }}>
            {hitRatio}%
          </div>
          <div className="telemetry-card-sub" style={{ color: 'var(--accent-green)' }}>
            {totalHits} Hits ({stats.l1Hits} L1 / {stats.l2Hits} L2 / {stats.l3Hits} L3)
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-card-label">CACHE MISS RATIO</div>
          <div className="telemetry-card-val" style={{ color: stats.dramMisses > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {missRatio}%
          </div>
          <div className="telemetry-card-sub" style={{ color: stats.dramMisses > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {stats.dramMisses} DRAM Miss Penalties
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-card-label">AVG MEMORY ACCESS TIME (AMAT)</div>
          <div className="telemetry-card-val" style={{ color: 'var(--accent-cyan)' }}>
            {avgMemoryAccessTime} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ns</span>
          </div>
          <div className="telemetry-card-sub" style={{ color: 'var(--accent-cyan)' }}>
            Baseline DRAM = 65.0 ns
          </div>
        </div>

        <div className="telemetry-card">
          <div className="telemetry-card-label">SYSTEM MEMORY SPEEDUP</div>
          <div className="telemetry-card-val" style={{ color: 'var(--accent-amber)' }}>
            {speedupFactor}x
          </div>
          <div className="telemetry-card-sub" style={{ color: 'var(--accent-amber)' }}>
            Faster than pure DRAM
          </div>
        </div>
      </div>

      {/* SECTION 3: TWO-COLUMN MAIN WORKBENCH (LEFT: PYRAMID | RIGHT: CACHE SPEED BRIDGE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* COLUMN A: THE 5-TIER MEMORY HIERARCHY PYRAMID */}
        <div className="cyber-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cyber-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                Memory Hierarchy Pyramid
              </span>
            </div>
            <span className="badge-status badge-blue">CLICK A TIER TO INSPECT</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-cyan)' }}>
                <ArrowUp size={13} />
                <span>Faster Speed • Higher Cost/Bit • Higher Access Frequency</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-amber)' }}>
                <span>Greater Capacity • Slower Access Time</span>
                <ArrowDown size={13} />
              </div>
            </div>

            {/* VISUAL PYRAMID TIERS */}
            <div className="pyramid-stack" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', margin: 'auto 0' }}>
              {HIERARCHY_TIERS.map((tier) => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`pyramid-tier-block ${isSelected ? 'tier-selected' : ''}`}
                    style={{
                      width: `${tier.widthPct}%`,
                      borderColor: isSelected ? tier.color : tier.borderTint,
                      background: isSelected ? tier.bgTint : 'rgba(0, 0, 0, 0.45)',
                      boxShadow: isSelected ? `0 0 16px ${tier.color}40, inset 0 0 12px ${tier.color}25` : 'none',
                    }}
                    onClick={() => {
                      setSelectedTier(tier);
                      setShowTierModal(true);
                      try { soundFx.playClick(); } catch (e) {}
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span className="tier-level-badge" style={{ background: tier.color }}>L{tier.level}</span>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: isSelected ? '#ffffff' : tier.color }}>
                          {tier.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: isSelected ? '#ffffff' : 'var(--text-muted)' }}>
                        {tier.classification}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>Size: {tier.size}</span>
                      <span>{tier.speedCost}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED TIER HARDWARE SPECIFICATION CARD */}
            {selectedTier && (
              <div className="tier-spec-card" style={{ marginTop: '1rem', borderLeftColor: selectedTier.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff' }}>
                      Tier {selectedTier.level}: {selectedTier.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: selectedTier.color }}>
                      {selectedTier.classification}
                    </div>
                  </div>
                  <span className="badge-status badge-blue" style={{ fontSize: '0.68rem' }}>
                    {selectedTier.size}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, margin: '0.4rem 0 0.65rem 0' }}>
                  "{selectedTier.moduleText}"
                </p>

                <div className="tier-spec-grid">
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">STORAGE CAPACITY</span>
                    <span className="tier-spec-val" style={{ color: 'var(--accent-cyan)' }}>{selectedTier.size}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">STORAGE LEVEL</span>
                    <span className="tier-spec-val" style={{ color: '#ffffff' }}>{selectedTier.classification}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">SPEED & COST POSITION</span>
                    <span className="tier-spec-val" style={{ color: 'var(--accent-amber)' }}>{selectedTier.speedCost}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">STORAGE MEDIA / EXAMPLES</span>
                    <span className="tier-spec-val" style={{ color: 'var(--accent-green)' }}>{selectedTier.devices}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN B: THE CACHE "SPEED BRIDGE" PIPELINE SIMULATOR */}
        <div className="cyber-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cyber-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                Cache Speed Bridge & Access Pipeline
              </span>
            </div>
            <span className="badge-status badge-green">L1 → L2 → L3 → DRAM</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* MODULE 1 (PAGE 12): CACHE MEMORY - THE SPEED BRIDGE */}
            <div style={{
              background: 'rgba(0, 82, 255, 0.08)',
              border: '1px solid rgba(0, 82, 255, 0.35)',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  MODULE 1 (PAGE 12): CACHE MEMORY — THE SPEED BRIDGE
                </span>
                <span className="badge-status badge-blue" style={{ fontSize: '0.65rem' }}>Locality of Reference</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                Compensates for the major speed difference between the ultra-fast processor and slower main memory (RAM). When CPU requests data: <strong>Cache Hit</strong> reads immediately; <strong>Cache Miss</strong> fetches a block from RAM into cache.
              </p>
            </div>
            
            {/* ADDRESS INPUT BAR */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ADDR:
                </span>
                <input
                  type="text"
                  value={queryAddress}
                  onChange={(e) => setQueryAddress(e.target.value)}
                  placeholder="0x1004"
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 3.6rem',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') executeMemoryLookup(queryAddress);
                  }}
                />
              </div>

              <button
                className="btn-cyber-kinetic btn-action-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                onClick={() => executeMemoryLookup(queryAddress)}
                disabled={isSimulating}
              >
                <Play size={14} /> Request Memory Read
              </button>
            </div>

            {/* ADDRESS DECODING BREAKDOWN (TAG, INDEX, OFFSET) */}
            {(() => {
              const decoded = parseAddress(queryAddress);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div className="addr-field-box">
                    <span className="addr-field-label">CACHE TAG (8-BIT)</span>
                    <span className="addr-field-val" style={{ color: 'var(--accent-cyan)' }}>{decoded.tagHex}</span>
                  </div>
                  <div className="addr-field-box">
                    <span className="addr-field-label">CACHE SET INDEX (2-BIT)</span>
                    <span className="addr-field-val" style={{ color: 'var(--accent-amber)' }}>Line {decoded.index}</span>
                  </div>
                  <div className="addr-field-box">
                    <span className="addr-field-label">BLOCK OFFSET (4-BIT)</span>
                    <span className="addr-field-val" style={{ color: 'var(--accent-green)' }}>{decoded.offsetHex}</span>
                  </div>
                </div>
              );
            })()}

            {/* CACHE HIERARCHY FLOW CONTROLS & VIEW TOGGLE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cache Hierarchy Flow
              </span>
              <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.5)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className={`btn-cyber-kinetic ${cacheViewMode === 'pipeline' ? 'btn-action-primary' : ''}`}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer' }}
                  onClick={() => {
                    setCacheViewMode('pipeline');
                    try { soundFx.playClick(); } catch (e) {}
                  }}
                >
                  ⚡ Linear Pipeline
                </button>
                <button
                  type="button"
                  className={`btn-cyber-kinetic ${cacheViewMode === 'topology' ? 'btn-action-primary' : ''}`}
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer' }}
                  onClick={() => {
                    setCacheViewMode('topology');
                    try { soundFx.playClick(); } catch (e) {}
                  }}
                >
                  🖧 Multi-Core Topology (L1i/L1d → L2 → L3)
                </button>
              </div>
            </div>

            {/* CONDITIONAL: LINEAR PIPELINE FLOW */}
            {cacheViewMode === 'pipeline' && (
              <div className="cache-pipeline-strip" style={{ marginBottom: '1rem' }}>
                <div className={`pipeline-node ${activeStep === 'cpu' ? 'node-active' : ''}`}>
                  <Cpu size={16} color="var(--accent-cyan)" />
                  <div className="pipeline-node-title">CPU ALU</div>
                  <div className="pipeline-node-lat">Core</div>
                </div>

                <div className="pipeline-wire"></div>

                <div className={`pipeline-node ${activeStep?.startsWith('l1') ? (activeStep === 'l1-hit' ? 'node-hit' : (activeStep === 'l1-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                  <Zap size={16} color="#00d2ff" />
                  <div className="pipeline-node-title">L1 Cache</div>
                  <div className="pipeline-node-lat">32KB–128KB</div>
                </div>

                <div className="pipeline-wire"></div>

                <div className={`pipeline-node ${activeStep?.startsWith('l2') ? (activeStep === 'l2-hit' ? 'node-hit' : (activeStep === 'l2-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                  <Database size={16} color="#0052ff" />
                  <div className="pipeline-node-title">L2 Cache</div>
                  <div className="pipeline-node-lat">256KB–1MB</div>
                </div>

                <div className="pipeline-wire"></div>

                <div className={`pipeline-node ${activeStep?.startsWith('l3') ? (activeStep === 'l3-hit' ? 'node-hit' : (activeStep === 'l3-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                  <Server size={16} color="#a78bfa" />
                  <div className="pipeline-node-title">L3 Cache</div>
                  <div className="pipeline-node-lat">2MB–100MB+</div>
                </div>

                <div className="pipeline-wire"></div>

                <div className={`pipeline-node ${activeStep === 'dram' || activeStep === 'fill' ? 'node-dram' : ''}`}>
                  <HardDrive size={16} color="var(--accent-amber)" />
                  <div className="pipeline-node-title">DRAM</div>
                  <div className="pipeline-node-lat">Gigabytes</div>
                </div>
              </div>
            )}

            {/* CONDITIONAL: MULTI-CORE SPLIT CACHE TOPOLOGY (L1i/L1d -> L2 -> Shared L3 -> DRAM) */}
            {cacheViewMode === 'topology' && (
              <div className="topology-schematic-card" style={{
                background: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(0, 82, 255, 0.35)',
                borderRadius: '6px',
                padding: '0.85rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  {/* CORE 0 */}
                  <div style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: '6px', padding: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>CPU CORE 0 (ACTIVE)</span>
                      <span className="badge-status badge-blue" style={{ fontSize: '0.6rem' }}>On-Core</span>
                    </div>
                    {/* SPLIT L1 CACHE: L1i & L1d */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.45rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>L1-INSTR (L1i)</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>32KB–64KB</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--accent-green)' }}>Code Fetch (1.0ns)</div>
                      </div>
                      <div style={{
                        background: activeStep?.startsWith('l1') ? 'rgba(0, 210, 255, 0.25)' : 'rgba(0,0,0,0.4)',
                        border: activeStep?.startsWith('l1') ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '0.3rem',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>L1-DATA (L1d)</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>32KB–64KB</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--accent-cyan)' }}>Data Operands (1.0ns)</div>
                      </div>
                    </div>
                    {/* PRIVATE L2 CACHE */}
                    <div style={{
                      background: activeStep?.startsWith('l2') ? 'rgba(0, 82, 255, 0.25)' : 'rgba(0,0,0,0.35)',
                      border: activeStep?.startsWith('l2') ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '0.35rem',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>PRIVATE L2 CACHE:</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-blue)' }}>256KB–1MB (3.5ns)</span>
                      </div>
                    </div>
                  </div>

                  {/* CORE 1 */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '0.6rem', opacity: 0.85 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)' }}>CPU CORE 1</span>
                      <span className="badge-status badge-purple" style={{ fontSize: '0.6rem' }}>On-Core</span>
                    </div>
                    {/* SPLIT L1 CACHE: L1i & L1d */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.45rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>L1-INSTR (L1i)</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>32KB–64KB</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--accent-green)' }}>Code Fetch (1.0ns)</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>L1-DATA (L1d)</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>32KB–64KB</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Data Operands (1.0ns)</div>
                      </div>
                    </div>
                    {/* PRIVATE L2 CACHE */}
                    <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.35rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>PRIVATE L2 CACHE:</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)' }}>256KB–1MB (3.5ns)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CROSSBAR BUS INTERCONNECT */}
                <div style={{ textAlign: 'center', margin: '-0.2rem 0 0.35rem 0', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  ▼ Dual-Core Crossbar Interconnect Bus ▼
                </div>

                {/* SHARED L3 CACHE */}
                <div style={{
                  background: activeStep?.startsWith('l3') ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.08)',
                  border: activeStep?.startsWith('l3') ? '1px solid #c084fc' : '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.85rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ffffff' }}>
                      SHARED L3 CACHE (2MB TO 100MB+)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Shared Across All Processor Cores • Bridges Gap to Main RAM (12.0 ns)
                    </div>
                  </div>
                  <span className="badge-status badge-purple" style={{ fontSize: '0.68rem' }}>
                    Shared Multi-Core Die
                  </span>
                </div>

                {/* SYSTEM BUS TO DRAM */}
                <div style={{
                  background: (activeStep === 'dram' || activeStep === 'fill') ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.06)',
                  border: (activeStep === 'dram' || activeStep === 'fill') ? '1px solid var(--accent-amber)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  padding: '0.55rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--accent-amber)' }}>
                      OFF-CHIP MAIN MEMORY (DRAM — GIGABYTES)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      External System Bus Memory Access (60.0 – 80.0 ns Miss Penalty)
                    </div>
                  </div>
                  <span className="badge-status badge-amber" style={{ fontSize: '0.68rem' }}>
                    DRAM Bus Fill
                  </span>
                </div>
              </div>
            )}

            {/* LAST RESULT HIGHLIGHT BANNER */}
            {lastResult && (
              <div className={`result-banner ${lastResult.hit ? 'result-hit' : 'result-miss'}`} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {lastResult.hit ? <CheckCircle2 size={18} color="var(--accent-green)" /> : <XCircle size={18} color="var(--accent-red)" />}
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: lastResult.hit ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {lastResult.hit ? `HIT: Resolved in ${lastResult.level}` : `MISS: Block fetched from ${lastResult.level}`}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      Latency: <strong style={{ color: '#ffffff' }}>{lastResult.latency} ns</strong>
                    </span>
                  </div>
                </div>
                <span className="badge-status badge-blue" style={{ fontFamily: 'var(--font-mono)' }}>
                  {lastResult.addr}
                </span>
              </div>
            )}

            {/* FEATURE 1: HUMAN-SCALE TIME TRANSLATOR */}
            <div className="human-scale-card" style={{
              background: 'rgba(0, 210, 255, 0.04)',
              border: '1px solid rgba(0, 210, 255, 0.25)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={15} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                    HUMAN-SCALE TIME EQUIVALENCE (1 CLOCK CYCLE = 1 SECOND)
                  </span>
                </div>
                <span className="badge-status badge-amber" style={{ fontSize: '0.65rem' }}>
                  Relative Latency Scale
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: '0.45rem 0.7rem', borderRadius: '4px', marginBottom: '0.45rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OPERATION: </span>
                  <strong style={{ fontSize: '0.8rem', color: lastResult?.hit ? 'var(--accent-green)' : (lastResult ? 'var(--accent-red)' : 'var(--accent-cyan)') }}>
                    {lastResult ? (lastResult.hit ? `${lastResult.level} HIT (${lastResult.latency} ns)` : `DRAM MISS (${lastResult.latency} ns)`) : 'REFERENCE (L1 HIT: 1.0 ns)'}
                  </strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>HUMAN TIME: </span>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {lastResult
                      ? (lastResult.level === 'L1 Cache' ? '⚡ 1.0 Second' : (lastResult.level === 'L2 Cache' ? '⚡ 3.5 Seconds' : (lastResult.level === 'L3 Cache' ? '⚡ 12.0 Seconds' : '⏳ 1.5 Minutes')))
                      : '⚡ 1.0 Second'}
                  </strong>
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {lastResult
                  ? (lastResult.level === 'L1 Cache'
                      ? '🎯 Desk Pen Analogy: Reaching for a pen right on your desk (1.0s). 200× faster than off-chip DRAM!'
                      : (lastResult.level === 'L2 Cache'
                          ? '📚 Room Shelf Analogy: Standing up to grab a book from your room bookshelf (3.5s). Serviced on-core!'
                          : (lastResult.level === 'L3 Cache'
                              ? '🚪 Hallway Cabinet Analogy: Walking to the shared hallway cabinet (12.0s). Shared across all CPU cores!'
                              : '🚶 Library Analogy: Walking 1.5 minutes down the street to the library. Suffered DRAM memory bus stall!')))
                  : '💡 Scale Insight: If 1 CPU cycle = 1 sec: L1 Cache takes 1s (desk), L2 takes 3.5s (room), L3 takes 12s (hallway), while Main RAM takes 1.5 minutes (walk to library), and SSD takes 3.5 hours!'}
              </div>

              {/* VISUAL LATENCY TICKER STRIP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem', textAlign: 'center' }}>
                <div style={{ background: (!lastResult || lastResult?.level === 'L1 Cache') ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>L1 CACHE</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>1.0s (Desk)</div>
                </div>
                <div style={{ background: lastResult?.level === 'L2 Cache' ? 'rgba(0, 82, 255, 0.25)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--accent-blue)', fontWeight: 800 }}>L2 CACHE</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>3.5s (Shelf)</div>
                </div>
                <div style={{ background: lastResult?.level === 'L3 Cache' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.64rem', color: '#c084fc', fontWeight: 800 }}>L3 SHARED</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>12s (Hall)</div>
                </div>
                <div style={{ background: (lastResult && !lastResult.hit) ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--accent-amber)', fontWeight: 800 }}>MAIN RAM</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>90s (Street)</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.25rem' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--accent-purple)', fontWeight: 800 }}>NVMe SSD</div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>3.5 Hours</div>
                </div>
              </div>
            </div>

            {/* LIVE L1 CACHE TABLE (DIRECT-MAPPED SIMULATOR) */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  L1 Cache Lines (Direct-Mapped SRAM State)
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  4 Blocks • 64-Byte Lines
                </span>
              </div>

              <div className="cache-table-wrapper">
                <table className="cache-table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Valid</th>
                      <th>Tag</th>
                      <th>Stored Data (Hex Bytes)</th>
                      <th>Hits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cacheLines.map((line) => {
                      const isTarget = parseAddress(queryAddress).index === line.index;
                      return (
                        <tr key={line.index} className={isTarget ? 'cache-row-target' : ''}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-amber)' }}>
                            Set #{line.index}
                          </td>
                          <td>
                            <span className={`badge-status ${line.valid === 1 ? 'badge-green' : 'badge-red'}`} style={{ padding: '0.1rem 0.35rem', fontSize: '0.68rem' }}>
                              {line.valid === 1 ? 'V=1' : 'V=0'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            {line.tag}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: line.valid ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {line.data}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontWeight: 800 }}>
                            {line.hits}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FEATURE: INTERACTIVE TIER DEEP-DIVE POPUP MODAL */}
      {showTierModal && selectedTier && (
        <div className="tier-modal-backdrop" onClick={closeModal}>
          <div 
            className="tier-modal-dialog" 
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: selectedTier.color,
              boxShadow: `0 0 50px ${selectedTier.color}45, inset 0 0 25px ${selectedTier.color}15`
            }}
          >
            {/* MODAL HEADER */}
            <div className="tier-modal-header" style={{ borderBottomColor: `${selectedTier.color}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span 
                  className="tier-level-badge" 
                  style={{ 
                    background: selectedTier.color, 
                    color: selectedTier.level === 1 ? '#000000' : '#ffffff',
                    fontSize: '0.85rem',
                    padding: '0.2rem 0.6rem'
                  }}
                >
                  TIER {selectedTier.level}
                </span>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {selectedTier.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: selectedTier.color, fontFamily: 'var(--font-mono)' }}>
                    {selectedTier.classification}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="xray-close-btn" onClick={closeModal} title="Close Pop-up (ESC)">
                  ✕ CLOSE
                </button>
              </div>
            </div>

            {/* MODULE CONTENT BANNER */}
            <div style={{
              background: `${selectedTier.color}15`,
              border: `1px solid ${selectedTier.color}40`,
              borderRadius: '6px',
              padding: '0.9rem 1.1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedTier.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                CONTENT FROM MODULE 1 (PAGE 11)
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                "{selectedTier.moduleText}"
              </p>
            </div>

            {/* MODULE SPECIFICATIONS GRID (STRICTLY FROM MODULE 1) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div className="tier-spec-item" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span className="tier-spec-label">STORAGE CAPACITY (MODULE 1)</span>
                <span className="tier-spec-val" style={{ color: 'var(--accent-cyan)', fontSize: '1.02rem' }}>{selectedTier.size}</span>
              </div>
              <div className="tier-spec-item" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span className="tier-spec-label">STORAGE HIERARCHY LEVEL</span>
                <span className="tier-spec-val" style={{ color: '#ffffff', fontSize: '1.02rem' }}>{selectedTier.classification}</span>
              </div>
              <div className="tier-spec-item" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span className="tier-spec-label">SPEED & COST POSITION</span>
                <span className="tier-spec-val" style={{ color: 'var(--accent-amber)', fontSize: '0.92rem' }}>{selectedTier.speedCost}</span>
              </div>
              <div className="tier-spec-item" style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span className="tier-spec-label">STORAGE MEDIA / EXAMPLES</span>
                <span className="tier-spec-val" style={{ color: 'var(--accent-green)', fontSize: '0.92rem' }}>{selectedTier.devices}</span>
              </div>
            </div>

            {/* KEY PRINCIPLE FROM MODULE 1 */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                MODULE PRINCIPLE (PAGE 11)
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                As you move down the pyramid, storage capacity and cost per bit increase, while access speed and cost efficiency decrease.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
