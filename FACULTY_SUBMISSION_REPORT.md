# ACADEMIC PROJECT REPORT

<div align="center">

## OPERATING SYSTEM ARCHITECTURE LAB (OS-ArchLab)
### An Interactive Architectural Simulation Workbench for Direct Memory Access (DMA) and Memory Hierarchy / Cache Memory Organizations

---

**Course Title:** Operating Systems (CS3001)  
**Academic Module:** Module 1 — Operating System Overview & Computer System Architecture  

---

**Submitted To:**  
**Prof. Shivashish Gour**  
Department of Computer Science & Engineering  

**Submitted By (Project Team):**  
* **Nikhil** (DMA Architecture, Bus Handshake & Timing Engine)  
* **Sakshi** (Memory Hierarchy Pyramid, Cache Speed Bridge & AMAT Engine)  
Department of Computer Science & Engineering  

**Date of Submission:** November 2026  

</div>

---

### Project Team & Individual Contributions

| Team Member | Module & Primary Responsibilities | Key Technical Deliverables |
| :--- | :--- | :--- |
| **Nikhil** | **Topic 1: Direct Memory Access (DMA) & Bus Arbitration Subsystem**<br>• Intel 8237 DMA Finite State Machine & `HOLD`/`HLDA` Handshaking<br>• 24-Cycle Logic Analyzer Oscilloscope Waveform & Timing Engine<br>• Interactive Circular HUD Gauges (Contention Injector, PCIe Speed Multiplier, CPU Clock Overclocking)<br>• CPU Microarchitecture Silicon ALU & Register Bank X-Ray Popover Modal<br>• Fullscreen Presentation Cinema Mode & Cyber Startup POST Boot Sequence | [`DmaSimulator.jsx`](file:///d:/code/os%20visual/src/components/DmaSimulator.jsx)<br>[`standalone.html`](file:///d:/code/os%20visual/standalone.html) (Tab 1)<br>Hardware Test Case 1 Verification |
| **Sakshi** | **Topic 2: Memory Hierarchy & Cache Memory Architecture Subsystem**<br>• Interactive 5-Tier Memory Hierarchy Pyramid (Registers, Cache, DRAM, SSD, Tape)<br>• Silicon Technology Modeling (6T SRAM Flip-Flop vs. 1T-1C Refreshing DRAM Capacitor)<br>• Cache "Speed Bridge" Simulator with 16-Bit Hex Address Decoding (Tag, Index, Offset)<br>• Experimental Suite for Locality of Reference (Temporal vs. Spatial Locality vs. Thrashing)<br>• Real-Time AMAT (Average Memory Access Time) Telemetry & 9.5x System Speedup Tracker | [`MemoryHierarchyLab.jsx`](file:///d:/code/os%20visual/src/components/MemoryHierarchyLab.jsx)<br>[`standalone.html`](file:///d:/code/os%20visual/standalone.html) (Tab 2)<br>Hardware Test Cases 2 & 3 Verification |

---

## 1. Executive Summary & Abstract

Traditional classroom instruction in Operating Systems frequently encounters pedagogical bottlenecks when communicating low-level hardware concurrency. Micro-architectural mechanisms—such as the hardware bus release handshake between the CPU and the DMA controller, cycle-level processor stalls, and the memory wall separating microprocessors from physical DRAM—occur at nanosecond scales within closed integrated circuits.

To eliminate this pedagogical divide, **OS-ArchLab** provides a dual-module interactive cybernetic simulation environment:
1. **Direct Memory Access (DMA) Laboratory:** Models the Intel 8237 DMA controller, illustrating bus arbitration (`HOLD` and `HLDA`), tripartite system bus signaling (address, data, control), and comparative Gantt timeline metrics across Burst Mode, Cycle Stealing Mode, and Transparent DMA Mode.
2. **Memory Hierarchy & Cache Memory Laboratory:** Visualizes the 5-tier memory pyramid (CPU Registers, L1/L2/L3 Cache, Main Memory DRAM, Secondary Storage SSD/NVMe, and Tertiary Offline Tape), demonstrating the physical trade-offs of Access Time, Storage Capacity, and Cost Per Bit. It features an interactive Cache Speed Bridge pipeline, live address decoding into Tag, Index, and Offset fields, and experimental verification of Temporal Locality, Spatial Locality, Cache Thrashing, and Average Memory Access Time (AMAT).

---

## 2. Theoretical Foundations

### 2.1 Direct Memory Access (DMA) Principles
In classical Programmed I/O, the central processor must execute an instruction loop for every single byte or word moved between an I/O device and memory. This ties up CPU registers (e.g. AX, DX) and stalls user threads. The DMA controller acts as a specialized coprocessor that takes over the system bus:
* **The Handshake Protocol:** The DMA controller raises the `HOLD` line. The CPU finishes its current bus cycle, floats its address and data lines to high-impedance (tri-state), and asserts `HLDA = 1`.
* **Burst Mode:** Complete block transferred continuously; processor stalled throughout transfer.
* **Cycle Stealing Mode:** Transfers 1 byte, yields the bus for 1 cycle, interleaving execution with minimal CPU stalls.
* **Transparent Mode:** Exploits CPU internal instruction phases (such as ALU multiplication) to transfer data with zero wait-states.

### 2.2 Memory Hierarchy & Cache Memory Principles
Computer system design faces three immutable physical constraints:
* **Constraint 1:** Faster access time requires expensive, complex silicon (e.g. 6-transistor SRAM flip-flops).
* **Constraint 2:** Larger storage capacity requires simpler, denser technologies (e.g. 1-transistor 1-capacitor DRAM or 3D NAND flash).
* **Constraint 3:** Cost per bit increases exponentially with access speed.

The **Memory Hierarchy** solves this trade-off by layering storage:
1. **CPU Registers:** 0.5 ns, 1–2 KB, highest cost/bit.
2. **Cache Memory (L1/L2/L3):** 1.0–12.0 ns, 32 KB–64 MB, 6T SRAM technology acting as the "Speed Bridge".
3. **Main Memory (DRAM):** 60–80 ns, 16–128 GB, 1T-1C dynamic cells requiring 64ms refresh cycles.
4. **Secondary Storage:** 10 µs–10 ms, 512 GB–8 TB, non-volatile solid-state drives.
5. **Tertiary Storage:** Petabyte-scale offline tape libraries.

### 2.3 Locality of Reference & AMAT
* **Temporal Locality:** If a memory address is referenced once, it will likely be referenced again soon (e.g. loop counters).
* **Spatial Locality:** If a memory address is referenced, nearby addresses will likely be referenced soon (e.g. linear arrays).
* **AMAT Formula:**
  $$	ext{AMAT} = 	ext{Hit Time} + (	ext{Miss Rate} 	imes 	ext{Miss Penalty})$$
  With an average 92% hit ratio, AMAT is reduced from 65.0 ns down to 6.86 ns, delivering a 9.5x speedup.

---

## 3. Experimental Results & Verification

### Test Case 1: DMA Mode Comparison
* **Burst Mode:** 16 bytes transferred in 16 cycles; CPU active utilization = 0%; CPU stalled cycles = 16.
* **Cycle Stealing:** 16 bytes transferred over 32 cycles; CPU active utilization = 50%; CPU stalled cycles = 16 interleaved.
* **Transparent Mode:** 16 bytes transferred concurrently; CPU active utilization = 100%; CPU stalled cycles = 0.

### Test Case 2: Memory Hierarchy & Cache Hit Ratio
* **Spatial Locality (Array Traversal):** Sequential array access (`0x2000` to `0x202C`) loads a 64-byte block on cycle 1 (miss), followed by 11 consecutive L1 Cache Hits. Hit Ratio = 91.7%.
* **Temporal Locality (Tight Loop):** Variable at address `0x04F2` accessed 50 times in a tight loop. After initial caching, all remaining iterations hit L1 in 1.0 ns. Hit Ratio = 98.0%.
* **Cache Thrashing:** Conflict strides force repeated cache evictions, dropping hit ratio to 0% and stalling CPU on every cycle (65.0 ns).

---

## 4. Conclusion

OS-ArchLab bridges academic theory and physical hardware behavior. Through cycle-by-cycle bus tracing, interactive pyramid tier inspection, and real-time AMAT telemetry, students and evaluators can visually verify the exact micro-architectural trade-offs that govern modern operating system memory management.
