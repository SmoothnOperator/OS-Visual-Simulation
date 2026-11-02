import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ArrowRight, 
  Layers, 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Sliders,
  Database,
  Binary
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

// Program memory instructions from Slide 5:
// 100: LOAD 500  (Accumulator <- Memory[500] = 3456)
// 101: ADD 600   (Accumulator <- Accumulator + Memory[600] = 3456 + 1200 = 4656)
// 102: STORE 700 (Memory[700] <- Accumulator = 4656)
// 103: HALT
const INITIAL_PROGRAM_MEMORY = [
  { addr: 100, label: '0x0100', mnemonic: 'LOAD 500', opcode: 'LOAD', operand: 500, type: 'instruction' },
  { addr: 101, label: '0x0101', mnemonic: 'ADD 600', opcode: 'ADD', operand: 600, type: 'instruction' },
  { addr: 102, label: '0x0102', mnemonic: 'STORE 700', opcode: 'STORE', operand: 700, type: 'instruction' },
  { addr: 103, label: '0x0103', mnemonic: 'HALT', opcode: 'HALT', operand: 0, type: 'instruction' },
];

const INITIAL_DATA_MEMORY = [
  { addr: 500, label: '0x0500', value: 3456, desc: 'Variable A (3456)' },
  { addr: 600, label: '0x0600', value: 1200, desc: 'Variable B (1200)' },
  { addr: 700, label: '0x0700', value: 0, desc: 'Result Target (Initially 0)' },
  { addr: 701, label: '0x0701', value: 42, desc: 'Constant Pool' },
];

// Discrete Micro-Op Steps for the instruction execution pipeline
// Each instruction goes through Fetch (5 steps), Decode (3 steps), Execute (3-4 steps)
const BUILD_MICRO_OPS = () => {
  return [
    // --- INSTRUCTION 1: LOAD 500 (Addr 100) ---
    { id: 'f1_1', instAddr: 100, phase: 'FETCH', stepNum: 1, name: 'MAR ← PC', desc: 'Step 1: Address in Program Counter (100) is transferred to Memory Address Register (MAR).', pc: 100, mar: 100, mdr: null, ir: '---', opcode: '---', operand: '---', ac: 0, bus: 'ADDR_LOAD', activeNode: 'pc_to_mar' },
    { id: 'f1_2', instAddr: 100, phase: 'FETCH', stepNum: 2, name: 'Memory Read Strobe', desc: 'Step 2: Control Unit asserts MEM_READ line to fetch instruction at Address 100.', pc: 100, mar: 100, mdr: null, ir: '---', opcode: '---', operand: '---', ac: 0, bus: 'READ_STROBE', activeNode: 'bus_read' },
    { id: 'f1_3', instAddr: 100, phase: 'FETCH', stepNum: 3, name: 'MDR ← Memory[MAR]', desc: 'Step 3: Opcode "LOAD 500" from Address 100 is placed on the Data Bus into MDR.', pc: 100, mar: 100, mdr: 'LOAD 500', ir: '---', opcode: '---', operand: '---', ac: 0, bus: 'DATA_TRANSFER', activeNode: 'mem_to_mdr' },
    { id: 'f1_4', instAddr: 100, phase: 'FETCH', stepNum: 4, name: 'IR ← MDR', desc: 'Step 4: Instruction contents in MDR transfer into Instruction Register (IR).', pc: 100, mar: 100, mdr: 'LOAD 500', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'IDLE', activeNode: 'mdr_to_ir' },
    { id: 'f1_5', instAddr: 100, phase: 'FETCH', stepNum: 5, name: 'PC ← PC + 1', desc: 'Step 5: Program Counter auto-increments from 100 to 101 to point to next instruction.', pc: 101, mar: 100, mdr: 'LOAD 500', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'IDLE', activeNode: 'pc_inc' },
    
    { id: 'd1_1', instAddr: 100, phase: 'DECODE', stepNum: 1, name: 'Opcode Interpretation', desc: 'Step 1: Control Unit parses Opcode: "LOAD" identified (Memory to Accumulator copy).', pc: 101, mar: 100, mdr: 'LOAD 500', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'IDLE', activeNode: 'cu_decode' },
    { id: 'd1_2', instAddr: 100, phase: 'DECODE', stepNum: 2, name: 'Operand Address Extraction', desc: 'Step 2: Operand resolved to memory address 500.', pc: 101, mar: 100, mdr: 'LOAD 500', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'IDLE', activeNode: 'cu_operand' },
    
    { id: 'e1_1', instAddr: 100, phase: 'EXECUTE', stepNum: 1, name: 'MAR ← 500 & Read', desc: 'Step 1: Operand address 500 loaded into MAR; Read strobe issued to RAM.', pc: 101, mar: 500, mdr: 'LOAD 500', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'READ_STROBE', activeNode: 'data_read' },
    { id: 'e1_2', instAddr: 100, phase: 'EXECUTE', stepNum: 2, name: 'MDR ← Memory[500]', desc: 'Step 2: Value 3456 from Address 500 transferred into MDR.', pc: 101, mar: 500, mdr: '3456', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 0, bus: 'DATA_TRANSFER', activeNode: 'mem_to_mdr' },
    { id: 'e1_3', instAddr: 100, phase: 'EXECUTE', stepNum: 3, name: 'Accumulator ← MDR', desc: 'Step 3: Value 3456 loaded into CPU Accumulator (AC = 3456). Instruction LOAD complete!', pc: 101, mar: 500, mdr: '3456', ir: 'LOAD 500', opcode: 'LOAD', operand: 500, ac: 3456, bus: 'IDLE', activeNode: 'ac_write' },

    // --- INSTRUCTION 2: ADD 600 (Addr 101) ---
    { id: 'f2_1', instAddr: 101, phase: 'FETCH', stepNum: 1, name: 'MAR ← PC (101)', desc: 'Fetch Step 1: PC (101) loaded into MAR for second instruction.', pc: 101, mar: 101, mdr: '3456', ir: 'LOAD 500', opcode: '---', operand: '---', ac: 3456, bus: 'ADDR_LOAD', activeNode: 'pc_to_mar' },
    { id: 'f2_2', instAddr: 101, phase: 'FETCH', stepNum: 2, name: 'Memory Read Strobe', desc: 'Fetch Step 2: Read signal issued to Address 101.', pc: 101, mar: 101, mdr: '3456', ir: 'LOAD 500', opcode: '---', operand: '---', ac: 3456, bus: 'READ_STROBE', activeNode: 'bus_read' },
    { id: 'f2_3', instAddr: 101, phase: 'FETCH', stepNum: 3, name: 'MDR ← Memory[101]', desc: 'Fetch Step 3: Opcode "ADD 600" loaded into MDR from RAM.', pc: 101, mar: 101, mdr: 'ADD 600', ir: 'LOAD 500', opcode: '---', operand: '---', ac: 3456, bus: 'DATA_TRANSFER', activeNode: 'mem_to_mdr' },
    { id: 'f2_4', instAddr: 101, phase: 'FETCH', stepNum: 4, name: 'IR ← MDR', desc: 'Fetch Step 4: "ADD 600" transferred into Instruction Register (IR).', pc: 101, mar: 101, mdr: 'ADD 600', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'IDLE', activeNode: 'mdr_to_ir' },
    { id: 'f2_5', instAddr: 101, phase: 'FETCH', stepNum: 5, name: 'PC ← PC + 1', desc: 'Fetch Step 5: Program Counter increments from 101 to 102.', pc: 102, mar: 101, mdr: 'ADD 600', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'IDLE', activeNode: 'pc_inc' },

    { id: 'd2_1', instAddr: 101, phase: 'DECODE', stepNum: 1, name: 'Opcode Interpretation', desc: 'Decode Step 1: Opcode "ADD" decoded. ALU arithmetic addition requested.', pc: 102, mar: 101, mdr: 'ADD 600', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'IDLE', activeNode: 'cu_decode' },
    { id: 'd2_2', instAddr: 101, phase: 'DECODE', stepNum: 2, name: 'Operand Address Extraction', desc: 'Decode Step 2: Operand resolved to Address 600 (second term).', pc: 102, mar: 101, mdr: 'ADD 600', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'IDLE', activeNode: 'cu_operand' },

    { id: 'e2_1', instAddr: 101, phase: 'EXECUTE', stepNum: 1, name: 'MAR ← 600 & Read', desc: 'Execute Step 1: Address 600 loaded to MAR; Read strobe issued.', pc: 102, mar: 600, mdr: 'ADD 600', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'READ_STROBE', activeNode: 'data_read' },
    { id: 'e2_2', instAddr: 101, phase: 'EXECUTE', stepNum: 2, name: 'MDR ← Memory[600]', desc: 'Execute Step 2: Value 1200 from Address 600 loaded into MDR.', pc: 102, mar: 600, mdr: '1200', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 3456, bus: 'DATA_TRANSFER', activeNode: 'mem_to_mdr' },
    { id: 'e2_3', instAddr: 101, phase: 'EXECUTE', stepNum: 3, name: 'ALU Add: AC + MDR', desc: 'Execute Step 3: ALU computes 3456 + 1200 = 4656 and updates Accumulator (AC = 4656)!', pc: 102, mar: 600, mdr: '1200', ir: 'ADD 600', opcode: 'ADD', operand: 600, ac: 4656, bus: 'IDLE', activeNode: 'alu_add' },

    // --- INSTRUCTION 3: STORE 700 (Addr 102) ---
    { id: 'f3_1', instAddr: 102, phase: 'FETCH', stepNum: 1, name: 'MAR ← PC (102)', desc: 'Fetch Step 1: PC (102) loaded into MAR for third instruction.', pc: 102, mar: 102, mdr: '1200', ir: 'ADD 600', opcode: '---', operand: '---', ac: 4656, bus: 'ADDR_LOAD', activeNode: 'pc_to_mar' },
    { id: 'f3_2', instAddr: 102, phase: 'FETCH', stepNum: 2, name: 'Memory Read Strobe', desc: 'Fetch Step 2: Read signal issued to Address 102.', pc: 102, mar: 102, mdr: '1200', ir: 'ADD 600', opcode: '---', operand: '---', ac: 4656, bus: 'READ_STROBE', activeNode: 'bus_read' },
    { id: 'f3_3', instAddr: 102, phase: 'FETCH', stepNum: 3, name: 'MDR ← Memory[102]', desc: 'Fetch Step 3: Opcode "STORE 700" loaded into MDR from RAM.', pc: 102, mar: 102, mdr: 'STORE 700', ir: 'ADD 600', opcode: '---', operand: '---', ac: 4656, bus: 'DATA_TRANSFER', activeNode: 'mem_to_mdr' },
    { id: 'f3_4', instAddr: 102, phase: 'FETCH', stepNum: 4, name: 'IR ← MDR', desc: 'Fetch Step 4: "STORE 700" transferred into Instruction Register (IR).', pc: 102, mar: 102, mdr: 'STORE 700', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'IDLE', activeNode: 'mdr_to_ir' },
    { id: 'f3_5', instAddr: 102, phase: 'FETCH', stepNum: 5, name: 'PC ← PC + 1', desc: 'Fetch Step 5: Program Counter increments from 102 to 103.', pc: 103, mar: 102, mdr: 'STORE 700', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'IDLE', activeNode: 'pc_inc' },

    { id: 'd3_1', instAddr: 102, phase: 'DECODE', stepNum: 1, name: 'Opcode Interpretation', desc: 'Decode Step 1: Opcode "STORE" decoded. Accumulator to Memory write requested.', pc: 103, mar: 102, mdr: 'STORE 700', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'IDLE', activeNode: 'cu_decode' },
    { id: 'd3_2', instAddr: 102, phase: 'DECODE', stepNum: 2, name: 'Target Address Resolution', desc: 'Decode Step 2: Target destination resolved to Address 700.', pc: 103, mar: 102, mdr: 'STORE 700', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'IDLE', activeNode: 'cu_operand' },

    { id: 'e3_1', instAddr: 102, phase: 'EXECUTE', stepNum: 1, name: 'MAR ← 700 & MDR ← AC', desc: 'Execute Step 1: MAR set to 700; Accumulator value (4656) copied into MDR.', pc: 103, mar: 700, mdr: '4656', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'DATA_TRANSFER', activeNode: 'ac_to_mdr' },
    { id: 'e3_2', instAddr: 102, phase: 'EXECUTE', stepNum: 2, name: 'Memory Write Strobe', desc: 'Execute Step 2: Control Unit pulses MEM_WRITE. Memory[700] updated to 4656 in RAM!', pc: 103, mar: 700, mdr: '4656', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'WRITE_STROBE', activeNode: 'data_write', writeTarget: { addr: 700, val: 4656 } },
    { id: 'e3_3', instAddr: 102, phase: 'EXECUTE', stepNum: 3, name: 'Store Complete', desc: 'Execute Step 3: Memory write verified. Result 4656 successfully preserved in RAM!', pc: 103, mar: 700, mdr: '4656', ir: 'STORE 700', opcode: 'STORE', operand: 700, ac: 4656, bus: 'IDLE', activeNode: 'done' },

    // --- TERMINATION ---
    { id: 'term', instAddr: 103, phase: 'COMPLETE', stepNum: 1, name: 'Program Complete (HALT)', desc: 'Execution Complete: 3-instruction sequence finished. Final stored result in RAM[700] = 4656.', pc: 103, mar: 103, mdr: 'HALT', ir: 'HALT', opcode: 'HALT', operand: 0, ac: 4656, bus: 'IDLE', activeNode: 'halt' }
  ];
};

export default function InstructionCycleLab() {
  const microOps = useRef(BUILD_MICRO_OPS()).current;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200); // ms per step
  const [dataMemory, setDataMemory] = useState(INITIAL_DATA_MEMORY);

  const timerRef = useRef(null);
  const currentStep = microOps[currentStepIndex];

  // Auto-run stepper loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNextStep();
      }, speed);
      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying, currentStepIndex, speed]);

  const handleNextStep = () => {
    if (currentStepIndex < microOps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      const nextOp = microOps[nextIdx];
      setCurrentStepIndex(nextIdx);
      try { soundFx.playClick(); } catch (e) {}

      // Handle memory write back
      if (nextOp.writeTarget) {
        setDataMemory(prev => prev.map(m => m.addr === nextOp.writeTarget.addr ? { ...m, value: nextOp.writeTarget.val } : m));
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      try { soundFx.playClick(); } catch (e) {}
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    clearInterval(timerRef.current);
    setCurrentStepIndex(0);
    setDataMemory(INITIAL_DATA_MEMORY);
    try { soundFx.playClick(); } catch (e) {}
  };

  // Skip to full cycle (Fetch / Decode / Execute)
  const handleJumpToPhase = (targetPhase) => {
    const idx = microOps.findIndex(m => m.phase === targetPhase);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
      try { soundFx.playClick(); } catch (e) {}
    }
  };

  return (
    <div className="lab-workbench-container" style={{ padding: '1rem', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* SECTION 1: HEADER & CONTROL BAR */}
      <div className="cyber-panel card-hud-corner" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="badge-status badge-blue">MODULE 1 • SLIDES 4–5</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Instruction Execution Cycle & Hardware Registers Lab
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Interactive Micro-Op Simulation: <strong>Fetch → Decode → Execute</strong> sequence with register-level bus dataflow.
            </p>
          </div>

          {/* PLAYBACK CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn-cyber-kinetic ${isPlaying ? 'btn-action-primary' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Simulation' : 'Auto-Run Clock Pulses'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? 'PAUSE CLOCK' : 'AUTO RUN'}</span>
            </button>

            <button
              className="btn-cyber-kinetic btn-action-primary"
              onClick={handleNextStep}
              disabled={isPlaying || currentStepIndex >= microOps.length - 1}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
              title="Execute Single Clock Pulse Micro-Op"
            >
              <span>STEP MICRO-OP (CLOCK)</span>
              <ChevronRight size={15} />
            </button>

            <button
              className="btn-cyber-kinetic"
              onClick={handleReset}
              title="Reset Program to Initial State"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem' }}
            >
              <RotateCcw size={15} />
              <span>RESET</span>
            </button>

            {/* SPEED SELECTOR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <Clock size={13} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CLOCK SPEED:</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              >
                <option value={1800} style={{ background: '#040918' }}>0.5x (Slow - 1.8s)</option>
                <option value={1200} style={{ background: '#040918' }}>1.0x (Normal - 1.2s)</option>
                <option value={600} style={{ background: '#040918' }}>2.0x (Fast - 0.6s)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PROGRESS & PHASE TICKER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Current Machine Phase</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span className={`badge-status ${currentStep.phase === 'FETCH' ? 'badge-blue' : (currentStep.phase === 'DECODE' ? 'badge-amber' : (currentStep.phase === 'EXECUTE' ? 'badge-green' : 'badge-purple'))}`} style={{ fontSize: '0.75rem' }}>
                {currentStep.phase}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Step {currentStep.stepNum}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Active Micro-Operation</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {currentStep.name}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Active Instruction In Flight</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              Addr {currentStep.instAddr}: {INITIAL_PROGRAM_MEMORY.find(p => p.addr === currentStep.instAddr)?.mnemonic || 'HALT'}
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>System Bus State</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: currentStep.bus.includes('READ') ? 'var(--accent-green)' : (currentStep.bus.includes('WRITE') ? 'var(--accent-amber)' : (currentStep.bus.includes('DATA') ? 'var(--accent-cyan)' : 'var(--text-muted)')), fontFamily: 'var(--font-mono)' }}>
              {currentStep.bus}
            </span>
          </div>

        </div>
      </div>

      {/* SECTION 2: INTERACTIVE HARDWARE TOPOLOGY GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.95fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
        
        {/* COLUMN A: CPU INTERNAL HARDWARE REGISTERS & CONTROL UNIT */}
        <div className="cyber-panel card-hud-corner" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cyber-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                Central Processing Unit (CPU) Silicon Architecture
              </span>
            </div>
            <span className="badge-status badge-blue">Von Neumann Architecture</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* ROW 1: CONTROL UNIT & PROGRAM COUNTER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
              
              {/* CONTROL UNIT (CU) */}
              <div style={{
                background: currentStep.phase === 'DECODE' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 82, 255, 0.06)',
                border: currentStep.phase === 'DECODE' ? '1.5px solid var(--accent-amber)' : '1px solid rgba(0, 82, 255, 0.25)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>CONTROL UNIT (CU)</span>
                  <span className={`badge-status ${currentStep.phase === 'DECODE' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '0.62rem' }}>
                    {currentStep.phase === 'DECODE' ? 'DECODING OPCODE' : 'ARMED'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Interprets opcode in IR and pulses control bus strobes (MemRead, MemWrite, ALU_Op).
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
                  <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: currentStep.bus === 'READ_STROBE' ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)', color: currentStep.bus === 'READ_STROBE' ? '#000000' : 'var(--text-muted)', fontWeight: 700 }}>
                    MemRead: {currentStep.bus === 'READ_STROBE' ? '1' : '0'}
                  </span>
                  <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: currentStep.bus === 'WRITE_STROBE' ? 'var(--accent-amber)' : 'rgba(255,255,255,0.05)', color: currentStep.bus === 'WRITE_STROBE' ? '#000000' : 'var(--text-muted)', fontWeight: 700 }}>
                    MemWrite: {currentStep.bus === 'WRITE_STROBE' ? '1' : '0'}
                  </span>
                </div>
              </div>

              {/* PROGRAM COUNTER (PC) */}
              <div style={{
                background: currentStep.activeNode === 'pc_to_mar' || currentStep.activeNode === 'pc_inc' ? 'rgba(0, 210, 255, 0.16)' : 'rgba(0, 0, 0, 0.4)',
                border: currentStep.activeNode === 'pc_to_mar' || currentStep.activeNode === 'pc_inc' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>PROGRAM COUNTER (PC)</span>
                  <span className="badge-status badge-blue" style={{ fontSize: '0.6rem' }}>Next Addr</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {currentStep.pc}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Auto-increments after fetch
                </div>
              </div>

            </div>

            {/* ROW 2: MEMORY ADDRESS REGISTER (MAR) & MEMORY DATA REGISTER (MDR) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              
              {/* MAR */}
              <div style={{
                background: currentStep.activeNode === 'pc_to_mar' || currentStep.activeNode === 'data_read' ? 'rgba(0, 210, 255, 0.16)' : 'rgba(0, 0, 0, 0.4)',
                border: currentStep.activeNode === 'pc_to_mar' || currentStep.activeNode === 'data_read' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>MEMORY ADDRESS REG (MAR)</span>
                  <span className="badge-status badge-blue" style={{ fontSize: '0.6rem' }}>Address Bus</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {currentStep.mar}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Holds target address to read/write
                </div>
              </div>

              {/* MDR */}
              <div style={{
                background: currentStep.activeNode === 'mem_to_mdr' || currentStep.activeNode === 'mdr_to_ir' || currentStep.activeNode === 'ac_to_mdr' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0, 0, 0, 0.4)',
                border: currentStep.activeNode === 'mem_to_mdr' || currentStep.activeNode === 'mdr_to_ir' || currentStep.activeNode === 'ac_to_mdr' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>MEMORY DATA REG (MDR)</span>
                  <span className="badge-status badge-green" style={{ fontSize: '0.6rem' }}>Data Bus</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                  {currentStep.mdr || 'EMPTY'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Two-way data buffer from RAM
                </div>
              </div>

            </div>

            {/* ROW 3: INSTRUCTION REGISTER (IR) & ACCUMULATOR (AC) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0.75rem' }}>
              
              {/* INSTRUCTION REGISTER (IR) */}
              <div style={{
                background: currentStep.activeNode === 'mdr_to_ir' || currentStep.phase === 'DECODE' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(0, 0, 0, 0.4)',
                border: currentStep.activeNode === 'mdr_to_ir' || currentStep.phase === 'DECODE' ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>INSTRUCTION REGISTER (IR)</span>
                  <span className="badge-status badge-amber" style={{ fontSize: '0.6rem' }}>Active Opcode</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', padding: '0.3rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>OPCODE</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>{currentStep.opcode}</strong>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', padding: '0.3rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'block' }}>OPERAND</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{currentStep.operand}</strong>
                  </div>
                </div>
              </div>

              {/* ACCUMULATOR (AC) & ALU */}
              <div style={{
                background: currentStep.activeNode === 'ac_write' || currentStep.activeNode === 'alu_add' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(0, 0, 0, 0.4)',
                border: currentStep.activeNode === 'ac_write' || currentStep.activeNode === 'alu_add' ? '1.5px solid #c084fc' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.75rem',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>ACCUMULATOR (AC)</span>
                  <span className="badge-status badge-purple" style={{ fontSize: '0.6rem' }}>ALU Reg</span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                  {currentStep.ac}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Holds arithmetic computation result
                </div>
              </div>

            </div>

            {/* LIVE STEP EXPLANATION BANNER */}
            <div style={{
              background: 'rgba(0, 82, 255, 0.08)',
              border: '1px solid rgba(0, 82, 255, 0.35)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginTop: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <Zap size={15} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MICRO-OP EXECUTION NARRATION:
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#ffffff', lineHeight: 1.45 }}>
                {currentStep.desc}
              </p>
            </div>

          </div>
        </div>

        {/* COLUMN B: MAIN MEMORY (RAM) & INSTRUCTION/DATA BUS */}
        <div className="cyber-panel card-hud-corner" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cyber-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--accent-green)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                Main Memory (RAM Physical Storage)
              </span>
            </div>
            <span className="badge-status badge-green">Memory Bus Stride</span>
          </div>

          <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* INSTRUCTION MEMORY TABLE (SLIDE 5 CODE) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Program Memory (Instructions)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Addrs 100–103</span>
              </div>

              <div className="cache-table-wrapper">
                <table className="cache-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Address</th>
                      <th style="width: 45%;">Instruction</th>
                      <th style="width: 30%;">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_PROGRAM_MEMORY.map((item) => {
                      const isCurrentInst = currentStep.instAddr === item.addr;
                      const isTargetMAR = currentStep.mar === item.addr;
                      return (
                        <tr key={item.addr} className={isCurrentInst ? 'cache-row-target' : ''}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: isCurrentInst ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
                            {item.addr} ({item.label})
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCurrentInst ? '#ffffff' : 'var(--text-primary)' }}>
                            {item.mnemonic}
                          </td>
                          <td>
                            {isCurrentInst ? (
                              <span className="badge-status badge-blue" style={{ fontSize: '0.65rem' }}>
                                {currentStep.phase}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ready</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DATA MEMORY TABLE (SLIDE 5 DATA POOL) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Data Memory (Operands & Storage)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Addrs 500–700</span>
              </div>

              <div className="cache-table-wrapper">
                <table className="cache-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Address</th>
                      <th style="width: 35%;">Stored Value</th>
                      <th style="width: 40%;">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataMemory.map((item) => {
                      const isReadTarget = currentStep.mar === item.addr && currentStep.bus === 'READ_STROBE';
                      const isWriteTarget = currentStep.mar === item.addr && currentStep.bus === 'WRITE_STROBE';
                      return (
                        <tr key={item.addr} className={isReadTarget ? 'cache-row-target' : (isWriteTarget ? 'node-dram' : '')}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-green)' }}>
                            {item.addr} ({item.label})
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: item.addr === 700 && item.value > 0 ? 'var(--accent-amber)' : '#ffffff', fontSize: '0.85rem' }}>
                            {item.value}
                          </td>
                          <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {item.desc}
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

      {/* SECTION 3: 3-PHASE INTERACTIVE WORKFLOW CARDS (SLIDE 5 SUMMARY) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        
        {/* PHASE 1: FETCH CYCLE CARD */}
        <div style={{
          background: currentStep.phase === 'FETCH' ? 'rgba(0, 82, 255, 0.16)' : 'rgba(0, 0, 0, 0.5)',
          border: currentStep.phase === 'FETCH' ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '1rem',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span className="badge-status badge-blue" style={{ fontSize: '0.7rem' }}>1. FETCH CYCLE</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Phase 1 Specification</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Retrieves instruction from RAM using PC
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li style={{ color: currentStep.stepNum === 1 && currentStep.phase === 'FETCH' ? 'var(--accent-cyan)' : 'inherit', fontWeight: currentStep.stepNum === 1 && currentStep.phase === 'FETCH' ? 800 : 400 }}>1. Address in PC transferred to MAR</li>
            <li style={{ color: currentStep.stepNum === 2 && currentStep.phase === 'FETCH' ? 'var(--accent-cyan)' : 'inherit', fontWeight: currentStep.stepNum === 2 && currentStep.phase === 'FETCH' ? 800 : 400 }}>2. Control Unit sends read signal to memory</li>
            <li style={{ color: currentStep.stepNum === 3 && currentStep.phase === 'FETCH' ? 'var(--accent-cyan)' : 'inherit', fontWeight: currentStep.stepNum === 3 && currentStep.phase === 'FETCH' ? 800 : 400 }}>3. Instruction placed into MDR</li>
            <li style={{ color: currentStep.stepNum === 4 && currentStep.phase === 'FETCH' ? 'var(--accent-cyan)' : 'inherit', fontWeight: currentStep.stepNum === 4 && currentStep.phase === 'FETCH' ? 800 : 400 }}>4. MDR contents transferred to IR</li>
            <li style={{ color: currentStep.stepNum === 5 && currentStep.phase === 'FETCH' ? 'var(--accent-cyan)' : 'inherit', fontWeight: currentStep.stepNum === 5 && currentStep.phase === 'FETCH' ? 800 : 400 }}>5. PC incremented to next instruction</li>
          </ul>
        </div>

        {/* PHASE 2: DECODE CYCLE CARD */}
        <div style={{
          background: currentStep.phase === 'DECODE' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(0, 0, 0, 0.5)',
          border: currentStep.phase === 'DECODE' ? '1.5px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '1rem',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span className="badge-status badge-amber" style={{ fontSize: '0.7rem' }}>2. DECODE CYCLE</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Phase 2 Specification</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Control Unit interprets fetched opcode
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li style={{ color: currentStep.stepNum === 1 && currentStep.phase === 'DECODE' ? 'var(--accent-amber)' : 'inherit', fontWeight: currentStep.stepNum === 1 && currentStep.phase === 'DECODE' ? 800 : 400 }}>1. Control Unit checks opcode part of instruction</li>
            <li style={{ color: currentStep.stepNum === 2 && currentStep.phase === 'DECODE' ? 'var(--accent-amber)' : 'inherit', fontWeight: currentStep.stepNum === 2 && currentStep.phase === 'DECODE' ? 800 : 400 }}>2. Determines operation to perform</li>
            <li style={{ color: currentStep.stepNum === 3 && currentStep.phase === 'DECODE' ? 'var(--accent-amber)' : 'inherit', fontWeight: currentStep.stepNum === 3 && currentStep.phase === 'DECODE' ? 800 : 400 }}>3. Identifies operand(s) and target addresses</li>
          </ul>
        </div>

        {/* PHASE 3: EXECUTE CYCLE CARD */}
        <div style={{
          background: currentStep.phase === 'EXECUTE' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0, 0, 0, 0.5)',
          border: currentStep.phase === 'EXECUTE' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '1rem',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span className="badge-status badge-green" style={{ fontSize: '0.7rem' }}>3. EXECUTE CYCLE</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Phase 3 Specification</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Performs the operation determined in decode
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li style={{ color: currentStep.stepNum === 1 && currentStep.phase === 'EXECUTE' ? 'var(--accent-green)' : 'inherit', fontWeight: currentStep.stepNum === 1 && currentStep.phase === 'EXECUTE' ? 800 : 400 }}>1. Set operand address in MAR & Read/Write</li>
            <li style={{ color: currentStep.stepNum === 2 && currentStep.phase === 'EXECUTE' ? 'var(--accent-green)' : 'inherit', fontWeight: currentStep.stepNum === 2 && currentStep.phase === 'EXECUTE' ? 800 : 400 }}>2. Perform ALU arithmetic or memory transfer</li>
            <li style={{ color: currentStep.stepNum === 3 && currentStep.phase === 'EXECUTE' ? 'var(--accent-green)' : 'inherit', fontWeight: currentStep.stepNum === 3 && currentStep.phase === 'EXECUTE' ? 800 : 400 }}>3. Update Accumulator (AC) or write back to RAM</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
