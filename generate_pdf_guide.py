# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive OS-ArchLab Operation & Topics Guide PDF.
Builds a high-resolution, print-optimized HTML document and renders it using Headless Chrome.
"""
import os
import subprocess
import sys
import shutil

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OS-ArchLab: Complete Operation Guide & Operating System Topic Notes</title>
<style>
  @page {
    size: A4 portrait;
    margin: 16mm 14mm 16mm 14mm;
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  /* Document Cover Header */
  .doc-header {
    border-bottom: 2.5px solid #0052ff;
    padding-bottom: 12px;
    margin-bottom: 22px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .doc-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-badge {
    background: #0052ff;
    color: #ffffff;
    font-weight: 800;
    font-size: 11pt;
    padding: 4px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .doc-title {
    font-size: 20pt;
    font-weight: 800;
    color: #0a2540;
    margin: 0 0 4px 0;
    letter-spacing: -0.3px;
  }
  .doc-subtitle {
    font-size: 11pt;
    color: #475569;
    margin: 0;
    font-weight: 500;
  }
  .doc-meta {
    text-align: right;
    font-size: 9pt;
    color: #64748b;
    line-height: 1.4;
  }
  .doc-meta strong {
    color: #1e293b;
  }

  /* Section Headings */
  h1 {
    font-size: 14pt;
    font-weight: 800;
    color: #0052ff;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 24px;
    margin-bottom: 12px;
    page-break-after: avoid;
  }
  h2 {
    font-size: 12pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 12px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    color: #334155;
  }

  strong {
    color: #0f172a;
  }

  /* Badges & Pills */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 8pt;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-blue { background: #e0e7ff; color: #1e40af; border: 1px solid #c7d2fe; }
  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-purple { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
  .badge-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

  /* Callout Boxes */
  .callout {
    background: #f8fafc;
    border-left: 4px solid #0052ff;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    font-size: 9.8pt;
    page-break-inside: avoid;
  }
  .callout-title {
    font-weight: 700;
    color: #0a2540;
    margin-bottom: 4px;
    font-size: 10pt;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .callout.alert-tip {
    border-left-color: #10b981;
    background: #f0fdf4;
  }
  .callout.alert-tip .callout-title {
    color: #065f46;
  }
  .callout.alert-warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }
  .callout.alert-warning .callout-title {
    color: #92400e;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 9.2pt;
    page-break-inside: avoid;
  }
  th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border-top: 1px solid #cbd5e1;
    border-bottom: 2px solid #cbd5e1;
    text-transform: uppercase;
    font-size: 8pt;
    letter-spacing: 0.5px;
  }
  td {
    padding: 7px 10px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
    color: #334155;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* Code Chips */
  code {
    font-family: "Fira Code", Consolas, "Courier New", monospace;
    font-size: 8.8pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  /* Step Container */
  .step-box {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 10px;
    background: #ffffff;
    page-break-inside: avoid;
  }
  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .step-num {
    font-weight: 800;
    color: #0052ff;
    font-size: 10pt;
  }

  /* Viva Cards */
  .viva-card {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 10px;
    background: #ffffff;
    page-break-inside: avoid;
  }
  .viva-q {
    background: #f1f5f9;
    padding: 8px 12px;
    font-weight: 700;
    color: #0a2540;
    font-size: 9.8pt;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    border-bottom: 1px solid #e2e8f0;
  }
  .viva-a {
    padding: 8px 12px;
    color: #334155;
    font-size: 9.4pt;
    line-height: 1.5;
  }

  /* Print specific utilities */
  .page-break {
    page-break-before: always;
  }
  .nowrap {
    white-space: nowrap;
  }
  ul, ol {
    margin: 0 0 10px 0;
    padding-left: 20px;
  }
  li {
    margin-bottom: 4px;
    color: #334155;
  }

  /* Visual Hierarchy Pyramid Box */
  .hierarchy-pyramid-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
  }
  .tier-row {
    text-align: center;
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 8.8pt;
    border: 1px solid #cbd5e1;
  }
  .tier-1 { width: 45%; background: #e0f2fe; color: #0369a1; border-color: #7dd3fc; }
  .tier-2 { width: 58%; background: #e0e7ff; color: #3730a3; border-color: #a5b4fc; }
  .tier-3 { width: 72%; background: #fef3c7; color: #92400e; border-color: #fde68a; }
  .tier-4 { width: 85%; background: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; }
  .tier-5 { width: 98%; background: #f1f5f9; color: #334155; border-color: #cbd5e1; }
</style>
</head>
<body>

  <!-- DOCUMENT HEADER -->
  <div class="doc-header">
    <div>
      <div class="doc-brand">
        <span class="brand-badge">OS-ArchLab</span>
        <span style="font-size: 11pt; font-weight: 700; color: #0052ff;">HARDWARE & OS SIMULATOR</span>
      </div>
      <h1 class="doc-title" style="border: none; margin: 4px 0 2px 0; padding: 0;">Comprehensive Operation Guide & Academic Notes</h1>
      <p class="doc-subtitle">Direct Memory Access (DMA) Modes & Memory Hierarchy / Cache Speed Bridge</p>
    </div>
    <div class="doc-meta">
      <strong>Course:</strong> Operating Systems (Module 1)<br>
      <strong>Presenters:</strong> Nikhil & Sakshi<br>
      <strong>Release:</strong> Final Evaluation Edition (Nov 2026)
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="callout alert-tip">
    <div class="callout-title">📋 Document Scope & Purpose</div>
    This reference document serves two complementary functions:
    <ol style="margin: 4px 0 0 0; padding-left: 18px;">
      <li><strong>Operational Guide:</strong> A step-by-step procedure to launch, navigate, and demonstrate every interactive simulator on the OS-ArchLab platform (including the Multi-Core Topology and Human-Scale Time Translation).</li>
      <li><strong>Academic Theory & Viva Voce:</strong> In-depth, university-curriculum aligned explanations covering DMA bus arbitration, transfer modes, the 5-tier memory pyramid, cache levels (L1i/L1d, L2, L3), and locality principles.</li>
    </ol>
  </div>

  <!-- SECTION 1 -->
  <h1>Part 1: How to Launch & Navigate the Platform</h1>
  
  <p>The OS-ArchLab application is engineered for zero-latency presentation environments and can be launched in two modes:</p>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Option A: Single-File Offline Standalone (Recommended for Presentation)</span>
      <span class="badge badge-green">Zero Setup</span>
    </div>
    <p>Double-click or open <code>standalone.html</code> directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.</p>
    <ul>
      <li><strong>Self-Contained:</strong> Operates entirely without internet connection, Node.js runtime, or terminal servers.</li>
      <li><strong>High Reliability:</strong> Immune to localhost port conflicts, Wi-Fi drops, or firewall restrictions during evaluation.</li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Option B: React Vite Production Server</span>
      <span class="badge badge-blue">Development</span>
    </div>
    <p>From the workspace terminal, launch the optimized Vite preview build:</p>
    <p><code>npm run preview -- --host 127.0.0.1 --port 3000</code></p>
    <p>Open <code>http://127.0.0.1:3000</code> in your browser.</p>
  </div>

  <h2>Global Platform Controls & Presentation Shortcuts</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Control / Shortcut</th>
        <th style="width: 35%;">Action</th>
        <th style="width: 40%;">Presentation Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>OS-ArchLab Logo</strong></td>
        <td>Click on top-left brand title</td>
        <td>Replays the retro-futuristic silicon POST boot sequence.</td>
      </tr>
      <tr>
        <td><strong>SFX Toggle Button</strong></td>
        <td>Click <code>SFX: OFF</code> / <code>SFX: ON</code></td>
        <td>Toggles synthesized Web Audio sound FX for bus clocks, hits, and misses.</td>
      </tr>
      <tr>
        <td><strong>Cinema Mode (F Key)</strong></td>
        <td>Click <code>CINEMA MODE</code> or press <code>F</code></td>
        <td>Expands canvas to borderless fullscreen with floating minimalist HUD for projectors.</td>
      </tr>
      <tr>
        <td><strong>Tab Navigation</strong></td>
        <td>Click <code>DMA Modes</code> / <code>Memory Lab</code></td>
        <td>Smoothly switches between the DMA bus engine and the Cache workbench.</td>
      </tr>
      <tr>
        <td><strong>Escape Key (ESC)</strong></td>
        <td>Press <code>ESC</code></td>
        <td>Closes any open modal (CPU Microarchitecture X-Ray or Memory Tier Modal).</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h1>Part 2: Step-by-Step Interactive Demonstration Guide</h1>

  <h2>Demonstration 1: Direct Memory Access (DMA) Modes Simulator</h2>
  <p>The DMA simulator allows you to visually prove how the DMA controller offloads data movement from the CPU and how bus contention alters system performance.</p>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 1: Select the DMA Transfer Mode</span>
      <span class="badge badge-blue">Mode Selection</span>
    </div>
    <p>In the top control bar, select one of the three architectural modes:</p>
    <ul>
      <li><strong>Burst Mode:</strong> The DMA controller seizes the bus and transmits the entire contiguous block before releasing it.</li>
      <li><strong>Cycle Stealing Mode:</strong> The DMA controller requests the bus for a single machine cycle, transfers one byte, and relinquishes the bus back to the CPU.</li>
      <li><strong>Transparent Mode:</strong> The DMA controller waits and transmits data strictly during clock cycles when the CPU is executing internal ALU instructions and not referencing the system bus.</li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 2: Set Parameters & Initiate Transfer</span>
      <span class="badge badge-amber">Execution</span>
    </div>
    <p>1. Adjust <strong>Transfer Block Size</strong> (e.g., <code>16 Bytes</code> or <code>32 Bytes</code>) and set <strong>Clock Speed</strong> to moderate for clear visual pacing.<br>
    2. Click the glowing cyan <strong><code>START TRANSFER</code></strong> button.</p>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 3: Point Out the Hardware Bus Arbitration Signals</span>
      <span class="badge badge-green">Faculty Showcase</span>
    </div>
    <p>Direct the faculty's attention to the active hardware registers and telemetry:</p>
    <ul>
      <li><strong>HOLD Line (Bus Request):</strong> Switches to <code>1 (Active Lock)</code> when the DMA Controller requests the bus.</li>
      <li><strong>HLDA Line (Hold Acknowledge):</strong> Switches to <code>1 (Buses Tri-Stated)</code> as the CPU floats its bus pins.</li>
      <li><strong>CPU Pipeline Status:</strong>
        <ul>
          <li>In <em>Burst Mode</em>: Displays <code>🔒 CPU BUS LOCKED</code>, and pipeline stages (<code>FETCH</code>, <code>DECODE</code>, <code>EXEC</code>, <code>WRITE</code>) freeze into red stall cycles.</li>
          <li>In <em>Cycle Stealing</em>: CPU stages interleave cleanly between work cycles and single steal cycles.</li>
          <li>In <em>Transparent</em>: Displays <code>⚡ EXECUTING COMPUTE</code> continuously with <strong>0 stall cycles</strong>.</li>
        </ul>
      </li>
      <li><strong>Live RAM Matrix:</strong> Watch the memory grid addresses (<code>0x8000</code> upward) fill with incoming byte values in real time.</li>
      <li><strong>Arbitration Gantt Timeline:</strong> The scrolling horizontal chart tracks CPU Compute (Blue), DMA Transfer (Green), and CPU Stall (Red) cycles.</li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 4: Open CPU Microarchitecture X-Ray</span>
      <span class="badge badge-purple">Deep Dive</span>
    </div>
    <p>Click <strong><code>🔬 CPU Microarchitecture X-Ray</code></strong> to inspect the internal silicon core: ALU operand registers (<code>AX</code>, <code>BX</code>), Program Counter (<code>PC</code>), Instruction Register (<code>IR</code>), and Flag Register during active bus cycles.</p>
  </div>

  <h2>Demonstration 2: Memory Hierarchy & Cache Memory Lab</h2>
  <p>This tab features a responsive side-by-side workbench: the <strong>5-Tier Memory Pyramid</strong> on the left and the <strong>Cache Speed Bridge</strong> on the right.</p>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 1: Inspect the 5-Tier Memory Pyramid</span>
      <span class="badge badge-blue">Curriculum Popups</span>
    </div>
    <p>Click on each horizontal tier of the pyramid to open the descriptive pop-up modal:</p>
    <ul>
      <li><strong>Tier 1 (CPU Registers):</strong> Internal operand storage, zero wait states, direct ALU feed.</li>
      <li><strong>Tier 2 (Cache Memory):</strong> Static RAM (SRAM) speed bridge, L1–L3 hierarchy, fast latency.</li>
      <li><strong>Tier 3 (Main Memory / RAM):</strong> Dynamic RAM (DRAM), gigabyte storage, active OS and application state.</li>
      <li><strong>Tier 4 (Secondary Storage):</strong> Non-volatile NVMe/SSD, long-term persistence, file system backing.</li>
      <li><strong>Tier 5 (Tertiary / Offline Storage):</strong> Magnetic tape, optical discs, deep archival backup.</li>
      <li>Click <strong><code>✕ CLOSE</code></strong> (or press <code>ESC</code>) to dismiss the modal.</li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 2: Toggle Linear Pipeline vs. Multi-Core Topology</span>
      <span class="badge badge-purple">New Topology Feature</span>
    </div>
    <p>Directly above the cache flow, click the view toggle buttons:</p>
    <ul>
      <li><strong>⚡ Linear Pipeline:</strong> Shows sequential address resolution across CPU &rarr; L1 &rarr; L2 &rarr; L3 &rarr; DRAM.</li>
      <li><strong>🖧 Multi-Core Topology:</strong> Displays modern multi-core architecture: Core 0 and Core 1 each having private split <code>L1i</code> (Instructions) and <code>L1d</code> (Data) caches + private L2 cache, both converging into the <strong>Shared L3 Cache (2MB to 100MB+)</strong> before bridging to off-chip DRAM.</li>
    </ul>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 3: Execute Cache Memory Access Queries</span>
      <span class="badge badge-amber">Interactive Workbench</span>
    </div>
    <p>1. In the right panel, type address <code>0x1004</code> and click <strong><code>REQUEST MEMORY READ</code></strong>.<br>
    2. Watch the laser beam pipeline: L1 Cache checks its lines &rarr; <strong>MISS (12.0 ns)</strong> &rarr; Line Fill from DRAM &rarr; Line 0 updates.<br>
    3. Query <code>0x1004</code> a second time: the beam stops at L1 &rarr; <strong>CACHE HIT (1.0 ns)</strong> &rarr; instantaneous return.</p>
  </div>

  <div class="step-box">
    <div class="step-header">
      <span class="step-num">Step 4: Demonstrate Human-Scale Time Translation & Locality</span>
      <span class="badge badge-green">Human-Scale & Locality</span>
    </div>
    <ul>
      <li><strong>⏱️ Human-Scale Time Card:</strong> Point to the time card below the result banner. Show the professor that an L1 Hit takes <strong>1.0 second</strong> (picking a pen from your desk), whereas a DRAM Miss takes <strong>1.5 minutes</strong> (walking down the street to the library)!</li>
      <li>Click <strong><code>⚡ Spatial Locality</code>:</strong> Queries consecutive addresses (<code>0x1000</code>, <code>0x1004</code>, <code>0x1008</code>, <code>0x100C</code>). Initial query misses; subsequent adjacent words hit because an entire 64-byte block was brought in.</li>
      <li>Click <strong><code>🔄 Temporal Locality</code>:</strong> Queries the same address repeatedly, driving the Hit Ratio toward 90%+.</li>
      <li>Click <strong><code>💥 Cache Thrashing</code>:</strong> Queries conflicting addresses mapping to the same line index, demonstrating thrashing and frequent line evictions.</li>
      <li>Point out the <strong>L1 Cache Lines Table</strong> showing <code>LINE</code>, <code>VALID</code>, <code>TAG</code>, <code>STORED DATA (HEX)</code>, and <code>HITS</code> updating live.</li>
    </ul>
  </div>

  <!-- SECTION 3 -->
  <div class="page-break"></div>
  <h1>Part 3: In-Depth Operating System Topic Explanations</h1>

  <h2>Topic 1: Direct Memory Access (DMA) Subsystem</h2>
  
  <h3>1. Architectural Motivation: Why DMA is Essential</h3>
  <p>In early computer architectures using <strong>Programmed I/O</strong> or <strong>Interrupt-Driven I/O</strong>, every single byte of data transferred between an I/O device and memory had to travel through the CPU accumulator registers (e.g., <code>IN AL, DX</code> followed by <code>MOV [DI], AL</code>). When dealing with high-speed peripherals (such as NVMe drives, gigabit network controllers, or graphics framebuffers), the CPU spent virtually 100% of its clock cycles executing mundane load-store loops. This created a massive processing bottleneck.</p>
  
  <p><strong>The DMA Solution:</strong> A dedicated hardware coprocessor—the <strong>DMA Controller (DMAC, e.g., Intel 8237)</strong>—acts as a "station master." It takes command of the system buses and drives direct data transfers between peripheral FIFO buffers and Main Memory, leaving the CPU completely free to execute application code.</p>

  <h3>2. Hardware Bus Arbitration Protocol (HOLD & HLDA Handshake)</h3>
  <p>Because the CPU and DMA controller share a single physical set of address and data buses, a strict hardware arbitration protocol is enforced to avoid electrical bus contention:</p>
  <ol>
    <li><strong>Peripheral Request:</strong> The I/O peripheral asserts <code>DREQ = 1</code> (DMA Request) to notify the DMA controller that data is ready.</li>
    <li><strong>Bus Request:</strong> The DMA controller asserts the <code>HOLD = 1</code> pin on the CPU.</li>
    <li><strong>Bus Release:</strong> The CPU completes its current machine cycle, places its Address, Data, and Control buses into a high-impedance (tri-state / electrically disconnected) condition, and asserts <code>HLDA = 1</code> (Hold Acknowledge).</li>
    <li><strong>DMA Transfer:</strong> The DMA controller asserts <code>DACK = 1</code> (DMA Acknowledge), becomes the active <strong>Bus Master</strong>, drives the memory addresses, and pulses read/write strobes directly to RAM.</li>
    <li><strong>Completion & Release:</strong> When the internal Word Count Register reaches zero, the DMA controller raises an interrupt (<code>IRQ</code>) to notify the OS and drops <code>HOLD = 0</code>. The CPU reclaims the buses.</li>
  </ol>

  <h3>3. Comparative Analysis of the Three DMA Modes</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Mode</th>
        <th style="width: 30%;">Operational Mechanism</th>
        <th style="width: 25%;">CPU Impact & Contention</th>
        <th style="width: 25%;">Ideal Use Case</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Burst Mode<br>(Block Transfer)</strong></td>
        <td>The DMA controller retains bus mastership continuously until the entire block of data is transferred.</td>
        <td><strong>Severe CPU Stall:</strong> The CPU cannot access memory and freezes in wait states for the entire transfer.</td>
        <td>High-speed bulk transfers where throughput is paramount (disk blocks, NVMe transfers).</td>
      </tr>
      <tr>
        <td><strong>Cycle Stealing Mode</strong></td>
        <td>The DMA controller requests the bus, transfers a single byte/word, and immediately yields the bus back to the CPU for one or more cycles.</td>
        <td><strong>Interleaved Slowdown:</strong> CPU compute and DMA memory transfers alternate with minimal pipeline disruption.</td>
        <td>Moderate-speed devices (audio streams, network card packet rings, serial interfaces).</td>
      </tr>
      <tr>
        <td><strong>Transparent Mode<br>(Hidden DMA)</strong></td>
        <td>The DMA controller transfers data only during clock cycles when the CPU is busy with internal ALU execution and not using the system bus.</td>
        <td><strong>Zero CPU Stall:</strong> CPU operates at 100% full speed with no pipeline wait states.</td>
        <td>Hard real-time systems where CPU execution latency cannot tolerate any external stalling.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3 CONT -->
  <div class="page-break"></div>
  <h2>Topic 2: Memory Hierarchy</h2>

  <h3>1. The Fundamental Design Trade-Off</h3>
  <p>Computer architects face three conflicting physical and economic laws:</p>
  <ul>
    <li><strong>Speed:</strong> Ultra-fast memory requires complex silicon gates (e.g., 6-transistor SRAM flip-flops) that consume significant power and silicon die area.</li>
    <li><strong>Capacity:</strong> High-density memory requires simplified single-transistor/single-capacitor cells (DRAM) that are physically slower to charge and refresh.</li>
    <li><strong>Cost per Bit:</strong> On-die fast silicon is orders of magnitude more expensive per gigabyte than magnetic or optical media.</li>
  </ul>
  <p>The <strong>Memory Hierarchy</strong> resolves this dilemma by arranging storage in a multi-level pyramid: placing a small, ultra-fast memory closest to the CPU core and cascading down to larger, inexpensive, non-volatile storage tiers.</p>

  <div class="hierarchy-pyramid-box">
    <div class="tier-row tier-1">Tier 1: CPU Registers (Immediate ALU Operands | Bytes to KB | Fastest | Highest Cost)</div>
    <div class="tier-row tier-2">Tier 2: Cache Memory - L1, L2, L3 (Static RAM Speed Bridge | KB to MB | Very Fast)</div>
    <div class="tier-row tier-3">Tier 3: Main Memory / RAM (Dynamic RAM | Gigabytes | Moderate Speed & Cost)</div>
    <div class="tier-row tier-4">Tier 4: Secondary Storage (NVMe SSD / HDD | Terabytes | Non-Volatile Persistence)</div>
    <div class="tier-row tier-5">Tier 5: Tertiary / Offline Storage (Magnetic Tape / Optical | Petabytes | Deep Archival Backup)</div>
  </div>

  <h3>2. Detailed Tier Specifications (Module 1 Aligned)</h3>
  <table>
    <thead>
      <tr>
        <th>Tier Level & Name</th>
        <th>Storage Classification</th>
        <th>Typical Capacity</th>
        <th>Physical Technology</th>
        <th>Volatility</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Tier 1: CPU Registers</strong></td>
        <td>Internal Storage</td>
        <td>Bytes to 2 KB</td>
        <td>D-Type Flip-Flops (Bistable Multivibrators)</td>
        <td>Volatile</td>
      </tr>
      <tr>
        <td><strong>Tier 2: Cache Memory</strong></td>
        <td>Internal Storage</td>
        <td>32 KB to 64 MB</td>
        <td>Static RAM (6T SRAM Cells)</td>
        <td>Volatile</td>
      </tr>
      <tr>
        <td><strong>Tier 3: Main Memory (RAM)</strong></td>
        <td>Primary Storage</td>
        <td>8 GB to 128 GB</td>
        <td>Dynamic RAM (1T-1C DRAM Cells)</td>
        <td>Volatile</td>
      </tr>
      <tr>
        <td><strong>Tier 4: Secondary Storage</strong></td>
        <td>Secondary Storage</td>
        <td>512 GB to 8 TB</td>
        <td>NAND Flash (SSD) / Magnetic Platters</td>
        <td>Non-Volatile</td>
      </tr>
      <tr>
        <td><strong>Tier 5: Tertiary Storage</strong></td>
        <td>Tertiary / Offline</td>
        <td>Terabytes to Petabytes</td>
        <td>Magnetic Tape / Optical Media (Blu-ray/WORM)</td>
        <td>Non-Volatile</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Principles Governing the Hierarchy</h3>
  <p>As you progress from the apex (Registers) to the base (Tertiary Storage):</p>
  <ol>
    <li><strong>Access Time Increases:</strong> From sub-nanosecond register speeds up to seconds or minutes for offline tape mounting.</li>
    <li><strong>Capacity Increases:</strong> From a few kilobytes in the CPU core to petabytes in archival vaults.</li>
    <li><strong>Cost per Bit Decreases:</strong> From expensive on-chip silicon to fractions of a cent per gigabyte for tape.</li>
    <li><strong>CPU Access Frequency Decreases:</strong> The CPU references registers on virtually every clock cycle, but references secondary storage only on page faults or explicit file I/O.</li>
  </ol>

  <!-- SECTION 3 CONT -->
  <div class="page-break"></div>
  <h2>Topic 3: Cache Memory as the "Speed Bridge" & Multi-Level Architecture</h2>

  <h3>1. The Processor-Memory Performance Gap</h3>
  <p>Over four decades, CPU clock frequencies increased by over 200&times;, while physical DRAM access latency improved by only a factor of 10. If modern CPUs had to wait 60–80 ns for DRAM on every instruction fetch, the execution core would sit idle 95% of the time. <strong>Cache memory</strong> acts as an on-chip hardware buffer that bridges this speed disparity.</p>

  <h3>2. The Human-Scale Time Analogy (1 Clock Cycle = 1 Second)</h3>
  <p>To convey the physical reality of memory access speeds to an audience or evaluator, scale 1 clock cycle (0.5 ns) to 1 human second:</p>
  <table>
    <thead>
      <tr>
        <th>Memory Level</th>
        <th>Physical Access Latency</th>
        <th>Human-Scale Equivalent Time</th>
        <th>Everyday Physical Analogy</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>CPU Registers</strong></td>
        <td>0.5 ns (1 cycle)</td>
        <td><strong>0.5 Second</strong></td>
        <td>Holding the paper directly in your hand.</td>
      </tr>
      <tr>
        <td><strong>L1 Cache</strong></td>
        <td>1.0 ns (2–3 cycles)</td>
        <td><strong>1.0 Second</strong></td>
        <td>Reaching for a pen or notepad on your desk.</td>
      </tr>
      <tr>
        <td><strong>L2 Cache</strong></td>
        <td>3.5 ns (7–10 cycles)</td>
        <td><strong>3.5 Seconds</strong></td>
        <td>Standing up to pull a book from your room's bookshelf.</td>
      </tr>
      <tr>
        <td><strong>L3 Cache (Shared)</strong></td>
        <td>12.0 ns (25–35 cycles)</td>
        <td><strong>12.0 Seconds</strong></td>
        <td>Walking out into the hallway to check the shared cabinet.</td>
      </tr>
      <tr>
        <td><strong>Main Memory (DRAM)</strong></td>
        <td>65.0 ns (150–200 cycles)</td>
        <td><strong>1.5 Minutes</strong></td>
        <td>Walking down the street to the corner store / local library.</td>
      </tr>
      <tr>
        <td><strong>Secondary Storage (SSD)</strong></td>
        <td>10 µs (20,000 cycles)</td>
        <td><strong>3.5 Hours</strong></td>
        <td>Driving to a library in another city.</td>
      </tr>
      <tr>
        <td><strong>Tertiary Storage (Tape)</strong></td>
        <td>10 s (20,000,000,000 cycles)</td>
        <td><strong>300 Years</strong></td>
        <td>Excavating an ancient archaeological archive.</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Levels of Cache: Multi-Core Shared Topology</h3>
  <p>Modern processors feature three distinct tiers of cache memory:</p>
  <ul>
    <li><strong>L1 Cache (Private, On-Core, 32KB to 128KB):</strong> Located directly on the CPU core. Extremely fast (1.0 ns). Crucially, modern cores feature a <em>Harvard Architecture split</em> into <strong>L1i (Instruction Cache)</strong> and <strong>L1d (Data Cache)</strong> so that instruction fetch and data operand access can occur simultaneously without bus stalls.</li>
    <li><strong>L2 Cache (Private/Shared, 256KB to 1MB):</strong> Larger and slightly slower (3.5 ns). Services L1 misses and buffers working sets.</li>
    <li><strong>L3 Cache (Shared Across All Cores, 2MB to 100MB+):</strong> Sits on the processor die but is shared across all CPU cores. Bridges the gap to external DRAM (12.0 ns), allowing cores to share data without accessing the external memory bus.</li>
  </ul>

  <h3>4. Locality of Reference & 64-Byte Block Transfer</h3>
  <p>Cache memory achieves hit rates exceeding 90% because real-world programs exhibit predictable memory access patterns known as <strong>Locality of Reference</strong>:</p>

  <div class="callout">
    <div class="callout-title">🔄 Temporal Locality (Locality in Time)</div>
    <strong>Definition:</strong> If a memory location is referenced once, it will tend to be referenced again in the near future.<br>
    <strong>Examples:</strong> Loop control variables (<code>for i = 0; i &lt; 1000; i++</code>), function stack frames, accumulator variables.
  </div>

  <div class="callout">
    <div class="callout-title">⚡ Spatial Locality (Locality in Space) & 64-Byte Block Fetch</div>
    <strong>Definition:</strong> If a memory location is referenced, nearby memory locations will likely be referenced soon.<br>
    <strong>Hardware Mechanism:</strong> When a miss occurs on address <code>0x1004</code> (4 bytes), the memory controller fetches an entire <strong>64-byte block (cache line)</strong> containing addresses <code>0x1000</code> through <code>0x103F</code>. This preloads the next 15 words into cache for free, ensuring subsequent sequential accesses hit with 100% efficiency.
  </div>

  <h3>5. Average Memory Access Time (AMAT) Formula</h3>
  <p>The effectiveness of a cache subsystem is measured mathematically using AMAT:</p>
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 16px; margin: 10px 0; font-family: 'Fira Code', monospace; font-size: 10pt; color: #0052ff; font-weight: 700;">
    AMAT = Hit Time + (Miss Rate &times; Miss Penalty)
  </div>
  <p><strong>Example Calculation:</strong> If L1 Hit Time = 1.0 ns, Miss Rate = 5% (0.05), and DRAM Miss Penalty = 60.0 ns:</p>
  <p style="font-family: 'Fira Code', monospace; font-size: 9.5pt; color: #334155;">
    AMAT = 1.0 ns + (0.05 &times; 60.0 ns) = 1.0 ns + 3.0 ns = <strong>4.0 ns</strong> (versus 60 ns without cache).
  </p>

  <!-- SECTION 4 -->
  <div class="page-break"></div>
  <h1>Part 4: Faculty Viva Voce & Evaluation Q&A Cheat Sheet</h1>

  <div class="viva-card">
    <div class="viva-q">Q1: What is the primary difference between Burst Mode and Cycle Stealing Mode in DMA?</div>
    <div class="viva-a">
      <strong>Answer:</strong> In <strong>Burst Mode</strong>, the DMA controller takes complete ownership of the system bus and transfers the entire contiguous block of data before releasing the bus. The CPU is completely stalled during this period. In <strong>Cycle Stealing Mode</strong>, the DMA controller requests the bus for a single clock cycle, transfers one byte/word, and immediately yields the bus back to the CPU, interleaving I/O transfer with CPU execution.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q2: Explain the function of the HOLD and HLDA lines during bus arbitration.</div>
    <div class="viva-a">
      <strong>Answer:</strong> <code>HOLD</code> is the Bus Request line asserted by the DMA controller to signal the CPU that it needs the system bus. <code>HLDA</code> (Hold Acknowledge) is the CPU's response line; after finishing its current machine cycle, the CPU puts its address, data, and control lines into a high-impedance (tri-state) floating condition and asserts <code>HLDA = 1</code>, granting bus mastership to the DMA controller.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q3: Why does Transparent DMA Mode cause zero CPU stalling?</div>
    <div class="viva-a">
      <strong>Answer:</strong> Transparent (Hidden) Mode monitors the CPU's internal clock states. It executes bus transfers strictly during clock cycles when the CPU is performing internal operations (such as instruction decoding or ALU computations) that do not require access to the external address or data buses, eliminating memory bus contention entirely.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q4: Name the 5 tiers of the Memory Hierarchy from fastest to slowest.</div>
    <div class="viva-a">
      <strong>Answer:</strong>
      1. Tier 1: CPU Registers (Internal Storage, fastest, bytes to KB)<br>
      2. Tier 2: Cache Memory L1–L3 (Internal Storage / SRAM speed bridge, KB to MB)<br>
      3. Tier 3: Main Memory / RAM (Primary Storage / DRAM, gigabytes)<br>
      4. Tier 4: Secondary Storage (Non-volatile SSD / HDD, terabytes)<br>
      5. Tier 5: Tertiary / Offline Storage (Magnetic tape / optical archives, petabytes)
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q5: Why is Cache Memory described as a "Speed Bridge"?</div>
    <div class="viva-a">
      <strong>Answer:</strong> Modern CPU execution units operate at clock cycle times below 0.5 ns, whereas physical Dynamic RAM (DRAM) requires 60–80 ns to complete an access cycle. Cache memory bridges this 200&times; performance disparity by staging frequently used instructions and data on high-speed Static RAM (SRAM) integrated directly on the processor die.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q6: Differentiate between Temporal Locality and Spatial Locality with code examples.</div>
    <div class="viva-a">
      <strong>Answer:</strong> <strong>Temporal Locality</strong> states that a memory location referenced recently is likely to be referenced again soon (e.g., loop counter <code>for(int i=0; i&lt;N; i++)</code> or repeated variable reads). <strong>Spatial Locality</strong> states that locations adjacent to recently referenced memory will likely be referenced next (e.g., sequentially traversing an array <code>a[0], a[1], a[2]</code> or linear instruction execution via the Program Counter).
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q7: Why is L1 Cache split into separate Instruction (L1i) and Data (L1d) caches?</div>
    <div class="viva-a">
      <strong>Answer:</strong> Splitting L1 into L1i and L1d allows the CPU to fetch a machine instruction (via the Instruction Fetch unit) and load or store data operands (via the ALU Load/Store unit) simultaneously on the exact same clock cycle. It eliminates structural hazards between instruction fetch and data memory access without doubling system bus complexity.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q8: Why is L3 Cache shared across all CPU cores while L1 and L2 are private?</div>
    <div class="viva-a">
      <strong>Answer:</strong> L1 and L2 caches must be small and physically close to their individual ALU cores to achieve 1.0–3.5 ns latencies without signal propagation delays. L3 is larger (2MB–100MB+) and shared across all cores so that threads running on different cores can share cached data and synchronize with low latency (12 ns) without generating expensive external bus traffic to off-chip DRAM (65 ns).
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q9: What is the "Human-Scale" time analogy for memory access?</div>
    <div class="viva-a">
      <strong>Answer:</strong> If one CPU clock cycle is scaled to 1 second: L1 cache access takes <strong>1.0 second</strong> (picking a pen from your desk), L2 takes <strong>3.5 seconds</strong> (grabbing a book from your room shelf), L3 takes <strong>12.0 seconds</strong> (walking to the hallway cabinet), while Main Memory DRAM takes <strong>1.5 minutes</strong> (walking down the street to the library), and SSD takes <strong>3.5 hours</strong> (driving to another city).
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q10: What is Cache Thrashing and how does it happen?</div>
    <div class="viva-a">
      <strong>Answer:</strong> Cache thrashing occurs when multiple distinct memory addresses map to the exact same cache line index. As the program alternates between these addresses, each access evicts the previous block, causing a continuous cascade of cache misses and eliminating the speed benefit of the cache.
    </div>
  </div>

  <!-- DOCUMENT FOOTER -->
  <div style="border-top: 1.5px solid #e2e8f0; margin-top: 24px; padding-top: 8px; font-size: 8.5pt; color: #64748b; display: flex; justify-content: space-between;">
    <span>OS-ArchLab: Educational Hardware Simulation Platform</span>
    <span>Operating Systems - Module 1 Overview &bull; Faculty Evaluation Edition</span>
  </div>

</body>
</html>
"""

# Write HTML file
html_path = os.path.abspath("OS_ArchLab_Comprehensive_Guide.html")
pdf_path = os.path.abspath("OS_ArchLab_Comprehensive_Guide.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML generated at: {html_path}")

# Run headless Chrome to print PDF
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
uri = "file:///" + html_path.replace("\\", "/")

cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    uri
]

print("Rendering PDF with Chrome headless...")
res = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"SUCCESS: PDF generated at: {pdf_path} ({size_kb:.1f} KB)")
    
    # Copy to artifacts directory
    artifact_dir = r"C:\Users\NIKHI\.gemini\antigravity\brain\5dfd5e33-75af-4313-ac2e-23843a2f3f45"
    shutil.copy2(pdf_path, os.path.join(artifact_dir, "OS_ArchLab_Comprehensive_Guide.pdf"))
    print("Copied updated PDF to artifact directory!")
else:
    print(f"ERROR: Failed to create PDF. Return code: {res.returncode}")
    print(f"Stderr: {res.stderr}")
