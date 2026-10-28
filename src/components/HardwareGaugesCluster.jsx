import React from 'react';
import { Activity, Gauge, Zap } from 'lucide-react';

export default function HardwareGaugesCluster({
  mode,
  busOwner,
  transferredBytes,
  blockSize,
  currentClock,
  stressInjected = false,
  onToggleStress,
  pcieGen = 'gen4',
  onCyclePcieGen,
  clockFreqGhz = '3.20',
  onCycleClockFreq
}) {
  // 1. Bus Saturation Percentage
  let busSaturation = 0;
  if (stressInjected) {
    busSaturation = 98;
  } else if (busOwner.includes('DMA')) {
    if (mode === 'burst') busSaturation = 96;
    else if (mode === 'stealing') busSaturation = (currentClock % 2 === 1) ? 36 : 10;
    else if (mode === 'transparent') busSaturation = 12;
  } else {
    busSaturation = mode === 'burst' ? 5 : 8;
  }

  // 2. Throughput Bandwidth (GB/s)
  let bandwidthGb = '0.00';
  let bandwidthPct = 0;
  const multiplier = pcieGen === 'gen5' ? 2 : (pcieGen === 'legacy' ? 0.5 : 1);
  const maxBw = (3.2 * multiplier).toFixed(2);

  if (busOwner.includes('DMA') && transferredBytes < blockSize) {
    if (mode === 'burst') {
      bandwidthGb = (2.84 * multiplier).toFixed(2);
      bandwidthPct = 88;
    } else if (mode === 'stealing') {
      bandwidthGb = (0.48 * multiplier).toFixed(2);
      bandwidthPct = 25;
    } else if (mode === 'transparent') {
      bandwidthGb = (1.92 * multiplier).toFixed(2);
      bandwidthPct = 65;
    }
  } else if (transferredBytes >= blockSize) {
    bandwidthGb = maxBw;
    bandwidthPct = 100;
  }

  // 3. Instruction Pipeline Phase
  const phases = ['WRITEBACK', 'FETCH', 'DECODE', 'EXECUTE'];
  const currentPhase = phases[currentClock % 4];
  const phasePct = ((currentClock % 4) + 1) * 25;

  // SVG circular arc parameters (Radius = 26, Circumference = 2 * PI * 26 ≈ 163.36)
  const C = 163.36;

  const saturationOffset = C - (busSaturation / 100) * C;
  const bandwidthOffset = C - (bandwidthPct / 100) * C;
  const phaseOffset = C - (phasePct / 100) * C;

  const getSaturationColor = (pct) => {
    if (pct > 75) return '#f43f5e'; // Rose
    if (pct > 30) return '#fbbf24'; // Amber
    return '#00d2ff'; // Cyan
  };

  return (
    <div className="hud-gauges-cluster">
      {/* GAUGE 1: BUS SATURATION (INTERACTIVE CONTENTION INJECTOR) */}
      <div
        className={`hud-gauge-card card-hud-corner ${stressInjected ? 'gauge-card-stressed' : ''}`}
        onClick={onToggleStress}
        title="Click to toggle Bus Contention Stress (Normal ↔ Overload 98%)"
        style={{ cursor: 'pointer' }}
      >
        <div className="gauge-svg-container">
          <svg className="gauge-svg" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" className="gauge-bg-circle" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="gauge-fill-circle"
              stroke={getSaturationColor(busSaturation)}
              strokeDasharray={C}
              strokeDashoffset={saturationOffset}
              style={{ filter: `drop-shadow(0 0 6px ${getSaturationColor(busSaturation)})` }}
            />
          </svg>
          <div className="gauge-center-icon">
            <Gauge size={18} color={getSaturationColor(busSaturation)} />
          </div>
        </div>
        <div className="gauge-info-box">
          <span className="gauge-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Bus Saturation</span>
            <span className="gauge-action-hint">👆 TOGGLE</span>
          </span>
          <span className="gauge-value" style={{ color: getSaturationColor(busSaturation) }}>
            {busSaturation}%
          </span>
          <span
            className="gauge-subtext"
            style={{
              color: stressInjected
                ? 'var(--accent-red)'
                : busSaturation > 70
                ? 'var(--accent-red)'
                : 'var(--accent-green)'
            }}
          >
            {stressInjected
              ? '⚡ CONTENTION FORCED (98%)'
              : busSaturation > 70
              ? 'HIGH BUS LOCK'
              : 'NORMAL ARBITRATION'}
          </span>
        </div>
      </div>

      {/* GAUGE 2: DMA BANDWIDTH (INTERACTIVE PCIE GENERATION SELECTOR) */}
      <div
        className="hud-gauge-card card-hud-corner"
        onClick={onCyclePcieGen}
        title="Click to cycle Architecture PCIe Speed (Gen4 3.2 GB/s ↔ Gen5 Turbo 6.4 GB/s ↔ Legacy 1.6 GB/s)"
        style={{ cursor: 'pointer' }}
      >
        <div className="gauge-svg-container">
          <svg className="gauge-svg" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" className="gauge-bg-circle" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="gauge-fill-circle"
              stroke="#00d2ff"
              strokeDasharray={C}
              strokeDashoffset={bandwidthOffset}
              style={{ filter: 'drop-shadow(0 0 6px #00d2ff)' }}
            />
          </svg>
          <div className="gauge-center-icon">
            <Activity size={18} color="#00d2ff" />
          </div>
        </div>
        <div className="gauge-info-box">
          <span className="gauge-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>DMA Bandwidth</span>
            <span className="gauge-action-hint">👆 SPEED</span>
          </span>
          <span className="gauge-value" style={{ color: '#00d2ff' }}>
            {bandwidthGb} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GB/s</span>
          </span>
          <span className="gauge-subtext" style={{ color: pcieGen === 'gen5' ? '#a78bfa' : 'var(--accent-green)' }}>
            {pcieGen === 'gen5'
              ? '🚀 PCIe Gen5 Turbo (6.4 GB/s)'
              : pcieGen === 'legacy'
              ? '⏱️ Legacy ISA/PCI (1.6 GB/s)'
              : '⚡ PCIe Gen4 (3.2 GB/s)'}
          </span>
        </div>
      </div>

      {/* GAUGE 3: CLOCK HARMONIC & PIPELINE PHASE (INTERACTIVE CPU OVERCLOCK) */}
      <div
        className="hud-gauge-card card-hud-corner"
        onClick={onCycleClockFreq}
        title="Click to cycle CPU Frequency (3.20 GHz Base ↔ 4.80 GHz Turbo ↔ 1.60 GHz Eco)"
        style={{ cursor: 'pointer' }}
      >
        <div className="gauge-svg-container">
          <svg className="gauge-svg" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" className="gauge-bg-circle" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="gauge-fill-circle"
              stroke={clockFreqGhz === '4.80' ? '#00d2ff' : '#0052ff'}
              strokeDasharray={C}
              strokeDashoffset={phaseOffset}
              style={{ filter: `drop-shadow(0 0 8px ${clockFreqGhz === '4.80' ? '#00d2ff' : '#0052ff'})` }}
            />
          </svg>
          <div className="gauge-center-icon">
            <Zap size={18} color={clockFreqGhz === '4.80' ? '#00d2ff' : '#60a5fa'} />
          </div>
        </div>
        <div className="gauge-info-box">
          <span className="gauge-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Clock Harmonic</span>
            <span className="gauge-action-hint">👆 CLOCK</span>
          </span>
          <span className="gauge-value" style={{ color: clockFreqGhz === '4.80' ? '#00d2ff' : '#ffffff' }}>
            {clockFreqGhz} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GHz</span>
          </span>
          <span className="gauge-subtext" style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            STAGE: {currentPhase}
          </span>
        </div>
      </div>
    </div>
  );
}
