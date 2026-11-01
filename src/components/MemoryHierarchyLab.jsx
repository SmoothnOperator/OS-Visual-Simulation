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

// 5-Tier Memory Hierarchy Definitions
const HIERARCHY_TIERS = [
  {
    id: 'registers',
    level: 1,
    name: 'CPU Registers',
    sub: 'Immediate Silicon Core Registers (AX, BX, PC, SP)',
    capacity: '1 KB – 2 KB',
    accessTime: '0.5 ns (1 clock cycle)',
    cycles: '0.5 – 1 cycle',
    tech: 'D-Type Flip-Flops (Bistable Multivibrator)',
    costPerGb: '$100,000+ / GB',
    volatility: 'Volatile (Power Off = Data Lost)',
    accessFreq: 'Highest (Every single CPU micro-op)',
    managedBy: 'Compiler & Hardware Register Allocator',
    color: '#00d2ff',
    bgTint: 'rgba(0, 210, 255, 0.12)',
    borderTint: 'rgba(0, 210, 255, 0.4)',
    widthPct: 46,
    summary: 'Internal CPU registers provide zero-wait-state operand storage directly to the Arithmetic Logic Unit (ALU). Highest cost per bit and fastest access in the entire computing system.'
  },
  {
    id: 'cache',
    level: 2,
    name: 'Cache Memory (L1 / L2 / L3)',
    sub: 'High-Speed Static RAM (SRAM) On-Die Buffers',
    capacity: '32 KB (L1) – 64 MB+ (L3)',
    accessTime: '1.0 ns – 12.0 ns (3 – 40 cycles)',
    cycles: '3 – 40 cycles',
    tech: '6-Transistor SRAM (Static RAM Cells)',
    costPerGb: '$1,000 – $5,000 / GB',
    volatility: 'Volatile',
    accessFreq: 'Very High (Speed Bridge between CPU & DRAM)',
    managedBy: 'Hardware Cache Controller (Transparent to OS)',
    color: '#0052ff',
    bgTint: 'rgba(0, 82, 255, 0.14)',
    borderTint: 'rgba(0, 82, 255, 0.5)',
    widthPct: 60,
    summary: 'The critical "Speed Bridge". SRAM requires no capacitor refresh cycles, enabling ultra-fast cache line lookups. Exploits temporal and spatial locality to prevent CPU bus starvation.'
  },
  {
    id: 'main_memory',
    level: 3,
    name: 'Main Memory (DRAM)',
    sub: 'Physical System RAM (DDR4 / DDR5 Dual-Channel)',
    capacity: '16 GB – 128 GB',
    accessTime: '60.0 ns – 80.0 ns (200+ cycles)',
    cycles: '180 – 240 cycles',
    tech: '1-Transistor 1-Capacitor DRAM (Requires 64ms Refresh)',
    costPerGb: '$3.50 – $6.00 / GB',
    volatility: 'Volatile',
    accessFreq: 'Moderate (Served on Cache Misses)',
    managedBy: 'Operating System Virtual Memory Manager (MMU)',
    color: '#fbbf24',
    bgTint: 'rgba(251, 191, 36, 0.12)',
    borderTint: 'rgba(251, 191, 36, 0.45)',
    widthPct: 74,
    summary: 'Primary program and working data storage. Holds active OS processes, page tables, and stack/heap memory. Must be periodically refreshed before tiny capacitor charges bleed away.'
  },
  {
    id: 'secondary',
    level: 4,
    name: 'Secondary Storage (NVMe / SSD / HDD)',
    sub: 'Non-Volatile Solid State Drives & Magnetic Disks',
    capacity: '512 GB – 8 TB',
    accessTime: '10 µs (NVMe SSD) – 10 ms (Mechanical HDD)',
    cycles: '30,000 – 30,000,000 cycles',
    tech: '3D TLC/QLC NAND Flash / Magnetic Platters',
    costPerGb: '$0.06 – $0.15 / GB',
    volatility: 'Non-Volatile (Persistent without power)',
    accessFreq: 'Low (File I/O, Page Fault Swapping)',
    managedBy: 'OS File System & Storage Block Drivers',
    color: '#a78bfa',
    bgTint: 'rgba(167, 139, 250, 0.12)',
    borderTint: 'rgba(167, 139, 250, 0.45)',
    widthPct: 88,
    summary: 'Persistent mass storage for operating system binaries, applications, and user files. Orders of magnitude slower than DRAM, bridged by OS page cache and buffer pools.'
  },
  {
    id: 'tertiary',
    level: 5,
    name: 'Tertiary & Offline Storage',
    sub: 'Magnetic Tape Libraries & Optical Cold Cloud Archives',
    capacity: '100 TB – Exabytes (Petabyte Scale)',
    accessTime: '100 ms – Minutes / Hours',
    cycles: 'Billions of cycles',
    tech: 'Linear Tape-Open (LTO-9) / AWS Glacier Cold Vaults',
    costPerGb: '$0.004 – $0.01 / GB (Lowest Cost/Bit)',
    volatility: 'Non-Volatile (Decade Retention)',
    accessFreq: 'Rare (Disaster Recovery & Enterprise Archival)',
    managedBy: 'Backup Daemons, Hierarchical Storage Management (HSM)',
    color: '#64748b',
    bgTint: 'rgba(100, 116, 139, 0.12)',
    borderTint: 'rgba(100, 116, 139, 0.45)',
    widthPct: 100,
    summary: 'The base of the pyramid. Provides ultra-dense, lowest-cost-per-bit archival retention. Requires robotic jukebox mechanisms or physical mounting before data blocks can be accessed.'
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
  // Selected Pyramid Tier
  const [selectedTier, setSelectedTier] = useState(HIERARCHY_TIERS[1]); // Default Cache Memory

  // Cache Lookup Simulator States
  const [queryAddress, setQueryAddress] = useState('0x1004');
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

      {/* SECTION 3: TWO-COLUMN MAIN WORKBENCH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(360px, 1.25fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
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
                        {tier.accessTime}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span>Cap: {tier.capacity}</span>
                      <span>Cost: {tier.costPerGb}</span>
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
                      {selectedTier.sub}
                    </div>
                  </div>
                  <span className="badge-status badge-blue" style={{ fontSize: '0.68rem' }}>
                    {selectedTier.volatility}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0.4rem 0 0.65rem 0' }}>
                  {selectedTier.summary}
                </p>

                <div className="tier-spec-grid">
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">PHYSICAL TECHNOLOGY</span>
                    <span className="tier-spec-val" style={{ color: '#ffffff' }}>{selectedTier.tech}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">ACCESS LATENCY</span>
                    <span className="tier-spec-val" style={{ color: selectedTier.color }}>{selectedTier.accessTime}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">CLOCK CYCLES</span>
                    <span className="tier-spec-val">{selectedTier.cycles}</span>
                  </div>
                  <div className="tier-spec-item">
                    <span className="tier-spec-label">MANAGED BY</span>
                    <span className="tier-spec-val" style={{ color: 'var(--accent-cyan)' }}>{selectedTier.managedBy}</span>
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

            {/* VISUAL CACHE PIPELINE FLOW DIAGRAM */}
            <div className="cache-pipeline-strip" style={{ marginBottom: '1rem' }}>
              
              {/* STAGE 1: CPU */}
              <div className={`pipeline-node ${activeStep === 'cpu' ? 'node-active' : ''}`}>
                <Cpu size={16} color="var(--accent-cyan)" />
                <div className="pipeline-node-title">CPU ALU</div>
                <div className="pipeline-node-lat">Core</div>
              </div>

              <div className="pipeline-wire"></div>

              {/* STAGE 2: L1 CACHE */}
              <div className={`pipeline-node ${activeStep?.startsWith('l1') ? (activeStep === 'l1-hit' ? 'node-hit' : (activeStep === 'l1-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                <Zap size={16} color="#00d2ff" />
                <div className="pipeline-node-title">L1 Cache</div>
                <div className="pipeline-node-lat">1.0 ns</div>
              </div>

              <div className="pipeline-wire"></div>

              {/* STAGE 3: L2 CACHE */}
              <div className={`pipeline-node ${activeStep?.startsWith('l2') ? (activeStep === 'l2-hit' ? 'node-hit' : (activeStep === 'l2-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                <Database size={16} color="#0052ff" />
                <div className="pipeline-node-title">L2 Cache</div>
                <div className="pipeline-node-lat">3.5 ns</div>
              </div>

              <div className="pipeline-wire"></div>

              {/* STAGE 4: L3 CACHE */}
              <div className={`pipeline-node ${activeStep?.startsWith('l3') ? (activeStep === 'l3-hit' ? 'node-hit' : (activeStep === 'l3-miss' ? 'node-miss' : 'node-active')) : ''}`}>
                <Server size={16} color="#a78bfa" />
                <div className="pipeline-node-title">L3 Cache</div>
                <div className="pipeline-node-lat">12.0 ns</div>
              </div>

              <div className="pipeline-wire"></div>

              {/* STAGE 5: PHYSICAL DRAM */}
              <div className={`pipeline-node ${activeStep === 'dram' || activeStep === 'fill' ? 'node-dram' : ''}`}>
                <HardDrive size={16} color="var(--accent-amber)" />
                <div className="pipeline-node-title">DRAM</div>
                <div className="pipeline-node-lat">65.0 ns</div>
              </div>
            </div>

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

      {/* SECTION 4: NARRATION HUD (FACULTY & VIVA EXPLANATION) */}
      <div className="narration-card" style={{ borderColor: 'var(--accent-blue)', background: 'linear-gradient(180deg, rgba(0, 82, 255, 0.08) 0%, rgba(0, 0, 0, 0.8) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{
            background: 'rgba(0, 82, 255, 0.2)',
            padding: '0.65rem',
            borderRadius: '6px',
            border: '1px solid rgba(0, 82, 255, 0.4)',
            color: 'var(--accent-cyan)',
            flexShrink: 0
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 800 }}>
              Operating System Architectural Narration
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0 0.35rem 0' }}>
              {narration.title}
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {narration.text}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: SYLLABUS THEORY ACCORDION (VIVA PREPARATION) */}
      <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="theory-card">
          <div className="theory-card-title">
            <span style={{ color: 'var(--accent-cyan)' }}>1.</span> The Speed, Capacity & Cost Trade-Off
          </div>
          <p className="theory-card-body">
            Designers face three conflicting constraints: fast memory is physically expensive, large capacity memory is slow, and cost per bit increases drastically with speed. The <strong>Memory Hierarchy</strong> solves this dilemma by placing a small, ultra-fast memory at the apex and cascading down to larger, inexpensive secondary storage.
          </p>
        </div>

        <div className="theory-card">
          <div className="theory-card-title">
            <span style={{ color: 'var(--accent-green)' }}>2.</span> Temporal Locality vs. Spatial Locality
          </div>
          <p className="theory-card-body">
            <strong>Temporal Locality:</strong> A memory address referenced once is likely to be referenced again soon (e.g. loop counters, stack variables).<br />
            <strong>Spatial Locality:</strong> When a memory address is accessed, nearby addresses will likely be referenced soon (e.g. linear arrays, sequential instructions).
          </p>
        </div>

        <div className="theory-card">
          <div className="theory-card-title">
            <span style={{ color: 'var(--accent-amber)' }}>3.</span> Cache as the "Speed Bridge"
          </div>
          <p className="theory-card-body">
            CPU clock frequencies have outpaced physical DRAM speeds by over 200x. Cache memory acts as a hardware buffer: on a <strong>Cache Hit</strong>, data is returned in 1–3 clock cycles without touching the system bus. On a <strong>Cache Miss</strong>, an entire 64-byte block is transferred from DRAM into the cache.
          </p>
        </div>
      </div>
    </div>
  );
}
