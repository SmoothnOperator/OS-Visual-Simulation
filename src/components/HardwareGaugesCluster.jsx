import React from 'react';
import { Activity, Gauge, Zap } from 'lucide-react';

export default function HardwareGaugesCluster({ mode, busOwner, transferredBytes, blockSize, currentClock }) {
  // 1. Bus Saturation Percentage
  let busSaturation = 0;
  if (busOwner.includes('DMA')) {
    if (mode === 'burst') busSaturation = 95;
    else if (mode === 'stealing') busSaturation = 34;
    else if (mode === 'transparent') busSaturation = 12;
  } else {
    busSaturation = mode === 'burst' ? 5 : 8;
  }

  // 2. Throughput Bandwidth (GB/s)
  let bandwidthGb = '0.00';
  let bandwidthPct = 0;
  if (busOwner.includes('DMA') && transferredBytes < blockSize) {
    if (mode === 'burst') {
      bandwidthGb = '2.84';
      bandwidthPct = 88;
    } else if (mode === 'stealing') {
      bandwidthGb = '0.48';
      bandwidthPct = 25;
    } else if (mode === 'transparent') {
      bandwidthGb = '1.92';
      bandwidthPct = 65;
    }
  } else if (transferredBytes >= blockSize) {
    bandwidthGb = '3.20 (PEAK)';
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
      {/* GAUGE 1: BUS SATURATION */}
      <div className="hud-gauge-card card-hud-corner">
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
          <span className="gauge-title">Bus Saturation</span>
          <span className="gauge-value" style={{ color: getSaturationColor(busSaturation) }}>
            {busSaturation}%
          </span>
          <span className="gauge-subtext" style={{ color: busSaturation > 70 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {busSaturation > 70 ? 'HIGH BUS LOCK' : 'NORMAL LOAD'}
          </span>
        </div>
      </div>

      {/* GAUGE 2: DMA BANDWIDTH */}
      <div className="hud-gauge-card card-hud-corner">
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
          <span className="gauge-title">DMA Bandwidth</span>
          <span className="gauge-value" style={{ color: '#00d2ff' }}>
            {bandwidthGb} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GB/s</span>
          </span>
          <span className="gauge-subtext" style={{ color: 'var(--accent-green)' }}>
            PCIe Gen4 Direct Stream
          </span>
        </div>
      </div>

      {/* GAUGE 3: CLOCK HARMONIC & PIPELINE PHASE */}
      <div className="hud-gauge-card card-hud-corner">
        <div className="gauge-svg-container">
          <svg className="gauge-svg" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" className="gauge-bg-circle" />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="gauge-fill-circle"
              stroke="#0052ff"
              strokeDasharray={C}
              strokeDashoffset={phaseOffset}
              style={{ filter: 'drop-shadow(0 0 8px #0052ff)' }}
            />
          </svg>
          <div className="gauge-center-icon">
            <Zap size={18} color="#00d2ff" />
          </div>
        </div>
        <div className="gauge-info-box">
          <span className="gauge-title">Harmonic Frequency</span>
          <span className="gauge-value" style={{ color: '#ffffff' }}>
            3.20 <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GHz</span>
          </span>
          <span className="gauge-subtext" style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
            PIPELINE: {currentPhase}
          </span>
        </div>
      </div>
    </div>
  );
}
