import React, { useEffect } from 'react';
import { Cpu, X, Zap, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';

export default function CpuXrayModal({ mode, cpuState, currentClock, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cpu-xray-modal-backdrop" onClick={onClose}>
      <div className="cpu-xray-dialog" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="xray-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Cpu size={24} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                CPU Microarchitecture & Pipeline X-Ray
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Internal Silicon Core: ALU Execution, Register Banks & Cache Hierarchy
              </div>
            </div>
          </div>
          <button className="xray-close-btn" onClick={onClose} title="Close X-Ray (ESC)">
            <X size={16} />
          </button>
        </div>

        {/* SECTION 1: ARITHMETIC LOGIC UNIT (ALU) & TRANSPARENT PROOF */}
        <div className="xray-alu-section">
          <div className="xray-alu-title">
            <span>⚙️ ARITHMETIC LOGIC UNIT (ALU) PIPELINE</span>
            <span
              className={`badge-status ${
                mode === 'transparent'
                  ? 'badge-green'
                  : cpuState === 'stall'
                  ? 'badge-red'
                  : 'badge-blue'
              }`}
            >
              {mode === 'transparent'
                ? '⚡ 100% PARALLEL EXECUTION'
                : cpuState === 'stall'
                ? '⚠️ ALU STALLED (BUS STARVATION)'
                : 'ACTIVE INSTRUCTION EXECUTION'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current Micro-Op:</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
              {mode === 'transparent'
                ? `ALU_MUL R1, R2 [INTERNAL REGISTERS ONLY]`
                : cpuState === 'stall'
                ? `NOP (CPU Halted on HLDA = 1)`
                : `ALU_ADD AX, [0x0400 + ${currentClock * 4}]`}
            </span>
          </div>

          {/* THEORETICAL VERIFICATION CALLOUT */}
          <div className="xray-proof-box">
            {mode === 'transparent' && (
              <span style={{ color: '#6ee7b7' }}>
                <strong>Transparent Mode Advantage Demonstrated:</strong> The CPU Arithmetic Logic Unit (ALU) computes continuous mathematical instructions exclusively using internal registers and L1 cache. Because it requires zero memory bus access during these cycles, the DMA controller accesses DRAM simultaneously with <strong>zero CPU wait states</strong>!
              </span>
            )}
            {mode === 'burst' && (
              <span style={{ color: '#fca5a5' }}>
                <strong>Burst Mode Trade-off Demonstrated:</strong> The DMA controller asserts HOLD and assumes exclusive ownership of the bus for the entire block. Because the CPU cannot fetch external instructions or data operands, the CPU instruction pipeline is stalled until the transfer finishes.
              </span>
            )}
            {mode === 'stealing' && (
              <span style={{ color: '#fde68a' }}>
                <strong>Cycle Stealing Trade-off Demonstrated:</strong> The DMA controller interleaves 1 memory cycle per byte with the CPU. The CPU suffers only brief single-cycle pauses and continues executing user processes in between.
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2: GENERAL PURPOSE REGISTER BANK (8086 / X86-64 ARCHITECTURE) */}
        <div style={{ marginBottom: '0.5rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Hardware Register Bank (16/32-Bit Core Registers)
        </div>
        <div className="xray-reg-grid">
          <div className="xray-reg-cell">
            <div className="xray-reg-name">AX (Accumulator)</div>
            <div className="xray-reg-val">0x4F02</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">BX (Base Ptr)</div>
            <div className="xray-reg-val">0x1000</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">CX (Counter)</div>
            <div className="xray-reg-val">0x0010</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">DX (Data Reg)</div>
            <div className="xray-reg-val">0x8000</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">PC (Program Counter)</div>
            <div className="xray-reg-val" style={{ color: 'var(--accent-cyan)' }}>
              0x{(0x0400 + currentClock * 4).toString(16).toUpperCase().padStart(4, '0')}
            </div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">SP (Stack Pointer)</div>
            <div className="xray-reg-val">0x7FFE</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">BP (Frame Ptr)</div>
            <div className="xray-reg-val">0x7F00</div>
          </div>
          <div className="xray-reg-cell">
            <div className="xray-reg-name">FLAGS Register</div>
            <div className="xray-reg-val" style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>
              CF:0 ZF:1 IF:1
            </div>
          </div>
        </div>

        {/* SECTION 3: ON-CHIP CACHE HIERARCHY */}
        <div className="xray-cache-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={15} /> On-Chip Cache Memory Hierarchy
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700 }}>
              HIT RATIO: 98.6%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(0, 82, 255, 0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>L1 I-Cache (Inst)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>32 KB • 0.4ns</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(0, 82, 255, 0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>L1 D-Cache (Data)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>32 KB • 0.5ns</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(0, 82, 255, 0.2)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>L2 Shared Cache</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>512 KB • 1.2ns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
