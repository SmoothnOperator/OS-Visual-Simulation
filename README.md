# OS-ArchLab: Interactive System Architecture Simulator (Node + React Edition)
**Module 1: Operating System Overview (Course Project / Prototype)**
*Topics: Direct Memory Access (DMA Modes) & Multicore vs. Multiprocessor Organization*

---

## ⚡ How to Run

### Option 1: Modern Node + React Development Server (Recommended)
This project is built with **Node.js**, **React 19**, and **Vite** with **Lucide Icons**:
```bash
# In the project directory:
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Features full Hot Module Replacement (HMR).

### Option 2: Production Build
```bash
npm run build
```
Creates an optimized, tree-shaken static bundle in the `/dist` directory.

### Option 3: Offline Zero-Install Standalone
Double-click [`standalone.html`](file:///d:/code/os%20visual/standalone.html) in Windows File Explorer or open via Live Server. Runs 100% offline without needing `npm` or `node`.

---

## 📂 Project Architecture

```
d:\code\os visual\
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                       # Top brand & tab routing
│   │   ├── DmaSimulator.jsx                 # Topic 5: DMA Engine & 3 Modes
│   │   ├── MultiArchitectureComparator.jsx  # Topic 6: Multicore vs Multiprocessor
│   │   ├── UnifiedSystemLab.jsx             # Cross-Topic: Memory Bus Arbiter & Scenarios
│   │   └── OsEvolutionTimeMachine.jsx       # Slides 23-39: OS Generations & DMA History
│   ├── App.jsx                              # Root React Application
│   ├── main.jsx                             # React 19 Entry Point
│   └── index.css                            # Modern glassmorphism & typography
├── dist/                                    # Production build
├── package.json                             # Dependencies (React, Vite, Lucide)
├── vite.config.js                           # Vite configuration
├── standalone.html                          # Single-file zero-install fallback
└── index.html                               # Vite HTML entry point
```

---

## 🖥️ What is Built in the React Interface

### Tab 1: DMA Controller & Transfer Modes (Topic 5 - Slides 13–15)
- **Interactive State Machine:** CPU, DMA Controller ("Station Master"), NVMe Buffer, and DRAM Target.
- **The 3 Transfer Modes:**
  - **Burst Mode:** Continuous block transfer with CPU stalled (proven on Gantt chart & CPU active dropping to 0%).
  - **Cycle Stealing Mode:** 1 byte / 1 clock cycle interleaved bus sharing.
  - **Transparent Mode:** Sneaks transfers only during CPU internal ALU/Decode cycles (**100% CPU utilization, 0 stalls**).
- **Gantt Waveform Timeline:** 20-cycle timing chart tracking CPU status, bus master, and DMA signals.

### Tab 2: Multicore vs. Multiprocessor Organization (Topic 6 - Slides 16–20)
- **Dual Architectural Schematics:** Single silicon die (Multicore) vs. Motherboard sockets (Multiprocessor).
- **Slide 18 Memory Mode Switcher:** Symmetric (SMP - Shared RAM) vs. Distributed Memory (Local RAM per Socket).
- **Interactive "Trace Memory Path":**
  - Multicore: `Core 1 → L1 → L2 → Shared L3 (HIT!)` in **0.8ns** with **0% motherboard bus traffic** (proves Slide 20).
  - Multiprocessor: `Socket 1 → Cache Miss → External Bus Arbiter → System Bus → RAM` in **65ns** with heavy bus congestion!
- **Core Scaler (Slide 17):** Toggle between **2 Cores**, **4 Cores**, and **8 Cores** with dynamic die thermal calculation ($48^\circ\text{C} \rightarrow 68^\circ\text{C} \rightarrow 89^\circ\text{C}$).
- **Workload Mode Selector (Slide 20 Proof):** Single Multi-Threaded App vs. Multiple Independent Server Jobs.
- **Fault-Tolerance Injections:** `Overheat Die` (all cores crash) vs. `Pull Socket 2` (Socket 1 stays alive).
- **Real-World Analogy Card:** *"Kitchen with multiple chefs"* vs. *"Separate restaurant branches"*.

### Tab 3: Unified System Lab (Topic 5 + 6 Synthesis)
- **Animated Memory Bus Highway & Turnstile Queue:** Visual crossbar with Core 1, Core 2, DMA Controller, Bus Arbiter, and DRAM.
- **Real-World OS Workload Scenarios:**
  - 🎮 3D Gaming + Background File Download (Cycle Stealing)
  - 💾 Database Checkpoint Disk Flush (DMA Burst Mode)
  - 🎬 Real-Time 4K Video Streaming (Smooth Interleaving)
- **Live System Metrics Radar Dashboard:** CPU Efficiency %, Bus Saturation %, DMA I/O Throughput MB/s, Average Bus Wait Penalty Clocks.
- **Contention Stress Slider:** Adjust CPU memory pressure from 20% to 95% to watch bus saturation spike and stalls multiply.

### Tab 4: ⏳ OS Evolution Time Machine (Slides 23–39)
- **Interactive 5-Generation Stepper:**
  - **1st Gen (1940s-50s) - Vacuum Tubes & Plugboards (Slide 35):** ENIAC (1945). Programmed I/O. CPU 92% idle waiting on human cards.
  - **2nd Gen (1950s-60s) - Transistors & Batch Systems (Slide 36):** IBM 7094. Magnetic tapes. CPU halts on tape rewind.
  - **3rd Gen (1960s-70s) - ICs & DMA Birth (Slide 37):** IBM System/360. **DMA is born!** Multiprogramming allows CPU to switch to Job B while DMA transfers. CPU utilization jumps to 78%!
  - **4th Gen (1980s-90s) - Microchips & Multiprocessors (Slide 38):** PCs, Intel x86, Symmetric Multiprocessors (SMP) on motherboard sockets.
  - **5th Gen (2000s-Present) - Multicore & NVMe DMA (Slide 16 & 39):** 8-core silicon die with on-chip shared L3 cache and 7,000 MB/s direct DMA.
- **Live "Simulate 100 KB Transfer" Benchmark:** Visually demonstrates the speedup across all 5 historical eras!

---

## 👥 Authors & Academic Submission

* **Course:** Operating Systems (CS3001) — Module 1: Computer System Architecture & OS Overview
* **Faculty Evaluator:** **Prof. Shivashish Gour**, Department of Computer Science & Engineering
* **Project Team & Contributions:**
  * **Nikhil:** Topic 5 (DMA Controller Finite State Machine, 20-Cycle Logic Analyzer Oscilloscope, Memory Crossbar Turnstile Arbiter, Test Case 1)
  * **Sakshi:** Topic 6 (Multicore vs. Multiprocessor Architecture Engine, Thermal Die Scaling, Hardware Fault Injection, 5-Gen Historical Benchmark, Test Cases 2 & 3)
* **Date:** October 2026

