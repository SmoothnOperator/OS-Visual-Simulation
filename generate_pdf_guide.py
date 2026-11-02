# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive OS-ArchLab Study Guide and Viva Voce Manual PDF.
Builds a high-resolution, print-optimized HTML document focused on all 3 syllabus modules:
1. Direct Memory Access (DMA) Simulator & Tripartite Bus Architecture
2. CPU Instruction Execution Cycle (Fetch-Decode-Execute) & Internal Registers
3. Memory Hierarchy & Cache Memory (Speed Bridge, Locality of Reference, L1/L2/L3, Hits & Misses)
"""
import os
import subprocess
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OS-ArchLab: Complete Architecture & Hardware Visualizer Guide</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }

  /* Document Cover Header */
  .doc-header {
    border-bottom: 2.5px solid #0052ff;
    padding-bottom: 10px;
    margin-bottom: 18px;
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
    font-size: 10pt;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .doc-title {
    font-size: 18pt;
    font-weight: 800;
    color: #0a2540;
    margin: 0 0 3px 0;
    letter-spacing: -0.3px;
  }
  .doc-subtitle {
    font-size: 10pt;
    color: #475569;
    margin: 0;
    font-weight: 500;
  }
  .doc-meta {
    text-align: right;
    font-size: 8.5pt;
    color: #64748b;
    line-height: 1.35;
  }
  .doc-meta strong {
    color: #1e293b;
  }

  /* Section Headings */
  h1 {
    font-size: 13pt;
    font-weight: 800;
    color: #0052ff;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 18px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 10pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 10px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 8px 0;
    color: #334155;
  }

  strong {
    color: #0f172a;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 6px;
    font-size: 7.5pt;
    font-weight: 700;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
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
    padding: 8px 12px;
    margin: 10px 0;
    border-radius: 0 5px 5px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  .callout-title {
    font-weight: 700;
    color: #0a2540;
    margin-bottom: 3px;
    font-size: 9.5pt;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Stepper Cards */
  .step-box {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    padding: 8px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    page-break-inside: avoid;
  }
  .step-num {
    background: #0052ff;
    color: #ffffff;
    font-weight: 800;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5pt;
    flex-shrink: 0;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <!-- COVER HEADER -->
  <div class="doc-header">
    <div>
      <div class="doc-brand">
        <span class="brand-badge">OS-ArchLab</span>
        <span style="font-weight: 700; color: #0052ff; font-size: 11pt;">ACADEMIC WORKSHOP & VIVA VOCE GUIDE</span>
      </div>
      <h1 class="doc-title" style="border: none; margin: 4px 0 2px 0; padding: 0;">Operating Systems Hardware Architecture Lab</h1>
      <p class="doc-subtitle">DMA Transfer Modes • CPU Instruction Execution Cycle • Memory Hierarchy & Cache Memory</p>
    </div>
    <div class="doc-meta">
      <strong>Course:</strong> Operating System Concepts<br>
      <strong>Platform:</strong> OS-ArchLab Interactive Visualizer<br>
      <strong>Status:</strong> Evaluation & Examination Ready
    </div>
  </div>

  <!-- PART 1: OVERVIEW -->
  <h1>Part 1: Quickstart & Interface Tour</h1>
  <p>
    <strong>OS-ArchLab</strong> is an interactive computer architecture and operating system hardware simulation platform. It bridges abstract low-level concepts into visible physical silicon events through three dedicated simulation engines:
  </p>
  <ul>
    <li><strong>Tab 1: DMA Modes Simulator:</strong> Simulates Direct Memory Access controller (Intel 8237 style) cycle-by-cycle bus arbitration across Burst, Cycle Stealing, and Demand modes.</li>
    <li><strong>Tab 2: Instruction Cycle Lab:</strong> Simulates the 3-phase machine cycle (Fetch, Decode, Execute) through an interactive clock pulse stepper across CPU registers (PC, MAR, MDR, IR, AC) and RAM.</li>
    <li><strong>Tab 3: Memory Hierarchy & Cache Lab:</strong> Simulates the Speed Bridge, Multi-Level Cache (L1i/L1d, L2, L3, DRAM), Locality of Reference (Temporal & Spatial), and interactive Hit vs Miss block fills.</li>
  </ul>

  <div class="callout">
    <div class="callout-title">Launching & Running the Application</div>
    <strong>React Web App:</strong> Run <code>npm run dev</code> and open <code>http://localhost:5173</code> in Google Chrome or Edge.<br>
    <strong>Standalone Distribution:</strong> Double-click <code>standalone.html</code> in any web browser with zero node/npm dependencies. Use the top navigation bar or URL hashes (<code>#dma</code>, <code>#instruction</code>, <code>#memory</code>) to switch labs. Press <strong>F</strong> or click <strong>CINEMA MODE</strong> for presentation view.
  </div>

  <!-- PART 2: TOPIC 1 - DMA -->
  <h1>Part 2: Direct Memory Access (DMA) & Tripartite Bus</h1>
  <p>
    Direct Memory Access (DMA) is a specialized hardware mechanism that allows high-speed I/O peripherals (such as NVMe SSDs, network interfaces, and disk controllers) to transfer blocks of data directly to/from Main Memory (DRAM) without continuous CPU intervention.
  </p>

  <h2>The 4-Step Hardware Handshake Protocol</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 15%;">Step</th>
        <th style="width: 25%;">Signal Line</th>
        <th style="width: 60%;">Silicon Event & Bus State</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1</strong></td>
        <td><code>DREQ (DMA Request)</code></td>
        <td>I/O peripheral fills its hardware FIFO buffer and asserts DREQ high to the DMA Controller (8237).</td>
      </tr>
      <tr>
        <td><strong>Phase 2</strong></td>
        <td><code>HOLD (Bus Request)</code></td>
        <td>DMA Controller asserts HOLD high to the CPU, requesting complete mastery of Address, Data, and Control buses.</td>
      </tr>
      <tr>
        <td><strong>Phase 3</strong></td>
        <td><code>HLDA (Hold Ack)</code></td>
        <td>CPU completes current machine cycle, tri-states its bus drivers (high impedance), and returns HLDA=1 to DMA Controller.</td>
      </tr>
      <tr>
        <td><strong>Phase 4</strong></td>
        <td><code>DACK & Data Transfer</code></td>
        <td>DMA Controller asserts DACK to peripheral, drives target RAM address onto Address Bus, and transfers data bytes at memory bus speed.</td>
      </tr>
    </tbody>
  </table>

  <h2>Comparison of the 3 DMA Transfer Modes</h2>
  <table>
    <thead>
      <tr>
        <th>DMA Transfer Mode</th>
        <th>Bus Holding Duration</th>
        <th>CPU Interruption</th>
        <th>Optimal Hardware Use-Case</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Burst Mode (Block)</strong></td>
        <td>Holds bus continuously until entire block is transferred.</td>
        <td>CPU completely paused (100% stalled) during transfer.</td>
        <td>Fastest throughput for bulk transfers (e.g. disk sector / page reads).</td>
      </tr>
      <tr>
        <td><strong>Cycle Stealing Mode</strong></td>
        <td>Takes bus for 1 bus cycle per byte, then relinquishes.</td>
        <td>Minimal CPU stall; CPU executes between steals.</td>
        <td>Time-sensitive CPU processing concurrent with real-time sensors.</td>
      </tr>
      <tr>
        <td><strong>Demand Mode</strong></td>
        <td>Holds bus only while peripheral asserts DREQ active.</td>
        <td>Intermittent CPU stall based on FIFO buffer state.</td>
        <td>Streaming network packets, sound cards, bursty peripherals.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- PART 3: TOPIC 2 - INSTRUCTION CYCLE -->
  <h1>Part 3: CPU Instruction Execution Cycle & Hardware Registers</h1>
  <p>
    The Central Processing Unit (CPU) executes programs through repeated iterations of the basic machine cycle composed of three distinct phases: <strong>Fetch &rarr; Decode &rarr; Execute</strong>.
  </p>

  <h2>Hardware Registers Cooperation</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Register</th>
        <th style="width: 28%;">Full Name</th>
        <th style="width: 50%;">Architectural Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>PC</strong></td>
        <td>Program Counter</td>
        <td>Holds the memory address of the next instruction to be fetched; auto-increments after fetch.</td>
      </tr>
      <tr>
        <td><strong>MAR</strong></td>
        <td>Memory Address Register</td>
        <td>Holds the physical RAM address currently driven onto the Address Bus for read/write.</td>
      </tr>
      <tr>
        <td><strong>MDR</strong></td>
        <td>Memory Data Register</td>
        <td>Holds the data word or instruction opcode received from or sent to RAM via Data Bus.</td>
      </tr>
      <tr>
        <td><strong>IR</strong></td>
        <td>Instruction Register</td>
        <td>Holds the current instruction opcode while the Control Unit decodes and interprets it.</td>
      </tr>
      <tr>
        <td><strong>AC</strong></td>
        <td>Accumulator Register</td>
        <td>Holds intermediate operands and results generated by the Arithmetic Logic Unit (ALU).</td>
      </tr>
    </tbody>
  </table>

  <h2>Step-by-Step Micro-Operation Walkthrough</h2>
  <p>The lab simulates the execution of the standard benchmark assembly program:</p>
  <ul>
    <li><code>100: LOAD 500</code> &mdash; Load contents of Memory[500] (value <strong>3456</strong>) into Accumulator.</li>
    <li><code>101: ADD 600</code> &mdash; Add contents of Memory[600] (value <strong>1200</strong>) to Accumulator (AC = <strong>4656</strong>).</li>
    <li><code>102: STORE 700</code> &mdash; Write Accumulator (<strong>4656</strong>) into Memory[700].</li>
    <li><code>103: HALT</code> &mdash; Stop CPU clock and terminate execution.</li>
  </ul>

  <div class="step-box">
    <div class="step-num">1</div>
    <div>
      <strong>Phase 1: Fetch Cycle (MAR &larr; PC, MDR &larr; Mem[MAR], IR &larr; MDR, PC &larr; PC + 1)</strong><br>
      PC (100) is copied into MAR. The Control Unit asserts the <code>MEM_READ</code> line. Memory responds by placing "LOAD 500" into MDR. MDR contents copy to IR, and PC auto-increments to 101.
    </div>
  </div>

  <div class="step-box">
    <div class="step-num">2</div>
    <div>
      <strong>Phase 2: Decode Cycle (Control Unit Opcode Resolution)</strong><br>
      The Control Unit parses the opcode part of IR: identifies "LOAD" (RAM to AC copy) and extracts operand target address 500.
    </div>
  </div>

  <div class="step-box">
    <div class="step-num">3</div>
    <div>
      <strong>Phase 3: Execute Cycle (ALU & Operand Transfer)</strong><br>
      Address 500 is driven to MAR; <code>MEM_READ</code> asserted. Value <strong>3456</strong> enters MDR and transfers directly into Accumulator (AC = 3456).
    </div>
  </div>

  <!-- PART 4: TOPIC 3 - MEMORY HIERARCHY & CACHE -->
  <h1>Part 4: Memory Hierarchy & Cache Memory (The Speed Bridge)</h1>
  <p>
    CPU clock frequencies have outpaced physical DRAM access times by over 200&times;. Cache memory acts as an ultra-fast hardware buffer (Static RAM / SRAM) between CPU registers and DRAM, eliminating bus wait states.
  </p>

  <h2>Locality of Reference: The Core Operating System Principle</h2>
  <ul>
    <li><strong>Temporal Locality:</strong> If a memory location is accessed once, it is highly likely to be accessed again soon (e.g. loop index counters, stack frame variables, frequently called subroutines).</li>
    <li><strong>Spatial Locality:</strong> When a memory location is accessed, nearby addresses will likely be accessed soon (e.g. linear array iteration, sequential instruction stream execution).</li>
  </ul>

  <h2>Multi-Level Cache Hierarchy (L1, L2, L3)</h2>
  <table>
    <thead>
      <tr>
        <th>Cache Level</th>
        <th>Physical Location</th>
        <th>Typical Capacity</th>
        <th>Latency & Architecture Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>L1 Cache</strong></td>
        <td>On-Core (Directly on CPU die)</td>
        <td>32 KB &ndash; 128 KB</td>
        <td><strong>1.0 ns (1&ndash;3 cycles):</strong> Split into separate L1i (instruction) and L1d (data) caches to prevent fetch contention.</td>
      </tr>
      <tr>
        <td><strong>L2 Cache</strong></td>
        <td>On-Core / Dedicated Private</td>
        <td>256 KB &ndash; 1 MB</td>
        <td><strong>3.5 ns (10&ndash;14 cycles):</strong> Services L1 cache misses; larger capacity buffer.</td>
      </tr>
      <tr>
        <td><strong>L3 Cache</strong></td>
        <td>Shared Processor Die</td>
        <td>2 MB &ndash; 100 MB+</td>
        <td><strong>12.0 ns (30&ndash;40 cycles):</strong> Shared across all CPU cores; bridges on-chip caches to off-chip system bus.</td>
      </tr>
      <tr>
        <td><strong>Main Memory (RAM)</strong></td>
        <td>Motherboard System Bus</td>
        <td>Gigabytes (8&ndash;64 GB)</td>
        <td><strong>60.0 &ndash; 80.0 ns (150&ndash;200 cycles):</strong> Slower Dynamic RAM (DRAM) working memory.</td>
      </tr>
    </tbody>
  </table>

  <h2>How Cache Works: Hits vs. Misses</h2>
  <ul>
    <li><strong>Cache Hit:</strong> When CPU references address, Tag matches line in SRAM. Data is delivered immediately in 1.0 ns with <strong>zero DRAM bus traffic</strong>.</li>
    <li><strong>Cache Miss:</strong> If Tag mismatches (or Valid bit V=0), CPU suffers miss penalty. The memory controller fetches an entire <strong>64-byte block</strong> from DRAM into the cache line, populating data and setting Valid V=1.</li>
  </ul>

  <div class="page-break"></div>

  <!-- PART 5: VIVA VOCE CHEAT SHEET -->
  <h1>Part 5: Evaluator Viva Voce Questions & High-Scoring Answers</h1>

  <div class="callout">
    <div class="callout-title">Q1: Why is DMA faster than Interrupt-driven I/O or Programmed I/O?</div>
    <strong>Answer:</strong> In Programmed and Interrupt I/O, every individual byte/word must travel through the CPU accumulator register (requiring instructions: <code>IN</code>, <code>MOV</code>, <code>OUT</code>, plus context switching overhead). In DMA, the CPU delegates bus mastery to the DMA Controller; data flows directly from peripheral buffer to RAM across the system bus at memory bandwidth speeds without CPU instruction execution.
  </div>

  <div class="callout">
    <div class="callout-title">Q2: What is the difference between MAR and MDR during instruction fetch?</div>
    <strong>Answer:</strong> <code>MAR (Memory Address Register)</code> holds the address of the instruction currently being requested from RAM (connected to the unidirectional Address Bus). <code>MDR (Memory Data Register)</code> holds the binary opcode/data returned from RAM (connected to the bidirectional Data Bus). MAR specifies <em>where</em> to look; MDR stores <em>what</em> is fetched.
  </div>

  <div class="callout">
    <div class="callout-title">Q3: Why does the CPU auto-increment the Program Counter (PC) during the Fetch cycle instead of Execute?</div>
    <strong>Answer:</strong> Incrementing the PC during fetch allows the CPU to overlap address preparation with instruction decoding and execution (pipelining). If the instruction turns out to be a jump/branch, the execute phase will simply overwrite the PC with the target address.
  </div>

  <div class="callout">
    <div class="callout-title">Q4: Why is L1 cache split into separate L1i (Instruction) and L1d (Data) caches?</div>
    <strong>Answer:</strong> To support a Harvard microarchitecture on the core. Having separate instruction and data caches allows the CPU to fetch the next instruction (from L1i) at the exact same clock cycle that an executing instruction reads or writes an operand (to L1d), eliminating structural pipeline stalls.
  </div>

  <div class="callout">
    <div class="callout-title">Q5: What is Average Memory Access Time (AMAT) and how does cache improve it?</div>
    <strong>Answer:</strong> $\\text{AMAT} = \\text{Hit Time} + (\\text{Miss Rate} \\times \\text{Miss Penalty})$. Because modern L1/L2/L3 caches achieve a 90%&ndash;95% hit rate via Locality of Reference, the effective access time drops from 65.0 ns (pure DRAM) down to ~1.6&ndash;7.0 ns, providing a ~9&times; to 40&times; system speedup!
  </div>

  <!-- FOOTER -->
  <div style="margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 8px; text-align: center; font-size: 8pt; color: #94a3b8;">
    OS-ArchLab • Operating System Overview Academic Visualizer • Designed for Module 1 Demonstrations & Viva Examinations
  </div>

</body>
</html>
"""

# Write HTML file
guide_html_path = "OS_ArchLab_Comprehensive_Guide.html"
with open(guide_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"Generated {guide_html_path}")

# Compile to PDF using Headless Chrome
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

pdf_output_path = os.path.abspath("OS_ArchLab_Comprehensive_Guide.pdf")
input_file_uri = f"file:///{os.path.abspath(guide_html_path).replace(os.sep, '/')}"

cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_output_path}",
    "--print-to-pdf-no-header",
    input_file_uri
]

print("Executing Chrome headless print-to-pdf...")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"Successfully generated PDF: {pdf_output_path} ({os.path.getsize(pdf_output_path)} bytes)")
    # Copy to artifact directory
    artifact_dir = r"C:\Users\NIKHI\.gemini\antigravity\brain\5dfd5e33-75af-4313-ac2e-23843a2f3f45"
    if os.path.exists(artifact_dir):
        dest_pdf = os.path.join(artifact_dir, "OS_ArchLab_Comprehensive_Guide.pdf")
        shutil.copy2(pdf_output_path, dest_pdf)
        print(f"Copied to artifact directory: {dest_pdf}")
else:
    print("Error generating PDF:", result.stderr)
