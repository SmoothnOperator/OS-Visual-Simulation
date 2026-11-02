# -*- coding: utf-8 -*-
"""
Script to generate the comprehensive OS-ArchLab Direct Memory Access (DMA) Guide PDF.
Builds a high-resolution, print-optimized HTML document focused entirely on DMA modes,
bus arbitration, hardware registers, and viva questions.
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
<title>OS-ArchLab: Direct Memory Access (DMA) Simulator Guide & Academic Notes</title>
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
      <h1 class="doc-title" style="border: none; margin: 4px 0 2px 0; padding: 0;">Direct Memory Access (DMA) Simulator Guide</h1>
      <p class="doc-subtitle">Bus Arbitration Handshake, Transfer Modes & CPU Pipeline Contention</p>
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
      <li><strong>Operational Guide:</strong> A step-by-step procedure to launch, configure, and demonstrate the interactive DMA simulator, arbitration signals, and CPU microarchitecture X-ray.</li>
      <li><strong>Academic Theory & Viva Voce:</strong> In-depth, university-curriculum aligned explanations covering DMA controller architecture (Intel 8237), HOLD/HLDA bus arbitration, the three transfer modes (Burst, Cycle Stealing, Transparent), and high-scoring viva answers.</li>
    </ol>
  </div>

  <!-- SECTION 1 -->
  <h1>Part 1: How to Launch & Navigate the Platform</h1>
  
  <p>The OS-ArchLab DMA simulation platform is engineered for zero-latency presentation environments and can be launched in two ways:</p>

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
        <td>Toggles synthesized Web Audio sound FX for bus clock ticks and transfer pulses.</td>
      </tr>
      <tr>
        <td><strong>Cinema Mode (F Key)</strong></td>
        <td>Click <code>CINEMA MODE</code> or press <code>F</code></td>
        <td>Expands canvas to borderless fullscreen with floating minimalist HUD for projectors.</td>
      </tr>
      <tr>
        <td><strong>Start / Pause Transfer</strong></td>
        <td>Click <code>START TRANSFER</code></td>
        <td>Begins cycle-accurate DMA memory movement and pipeline execution.</td>
      </tr>
      <tr>
        <td><strong>Escape Key (ESC)</strong></td>
        <td>Press <code>ESC</code></td>
        <td>Closes the CPU Microarchitecture X-Ray modal or exits Presentation Cinema Mode.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h1>Part 2: Step-by-Step Interactive DMA Demonstration Guide</h1>

  <p>The DMA simulator allows you to visually demonstrate how the DMA controller offloads bulk data movement from the CPU and how bus contention alters system throughput.</p>

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
      <span class="step-num">Step 3: Showcase the Hardware Bus Arbitration Signals</span>
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

  <h3>4. Key Internal Registers of the DMA Controller (Intel 8237)</h3>
  <ul>
    <li><strong>Memory Address Register (MAR):</strong> Holds the physical memory address in RAM where the next byte/word will be read or written. Automatically increments after every transfer.</li>
    <li><strong>Word / Byte Count Register (WCR):</strong> Initialized with the number of bytes to transfer. Automatically decrements after each transfer. When it hits zero, a terminal count pulse is triggered.</li>
    <li><strong>Control / Command Register (CR):</strong> Specifies the transfer mode (Burst, Cycle Stealing, Transparent), transfer direction (Memory-to-I/O or I/O-to-Memory), and priority level.</li>
    <li><strong>Status Register (SR):</strong> Reflects current channel activity, terminal count flags, and pending transfer requests.</li>
  </ul>

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
    <div class="viva-q">Q4: Why does Programmed I/O fail for high-speed peripherals like NVMe SSDs or Gigabit Ethernet?</div>
    <div class="viva-a">
      <strong>Answer:</strong> Under Programmed I/O, the CPU must execute an explicit polling loop and read/write every single byte into its own accumulator register before storing it to RAM. For gigabyte-per-second peripherals, this consumes 100% of CPU processing capacity, starving user applications. DMA solves this by transferring data directly between the peripheral and RAM over the system bus without passing through CPU registers.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q5: What is "Bus Tri-Stating" and why is it necessary during DMA?</div>
    <div class="viva-a">
      <strong>Answer:</strong> In digital logic, bus lines cannot be driven by two masters simultaneously without causing short circuits and signal corruption. When the CPU acknowledges DMA via <code>HLDA = 1</code>, it places its bus drivers into a high-impedance ("tri-state" or floating) state, effectively disconnecting the CPU electrically from the Address, Data, and Control buses so the DMA controller can drive them cleanly.
    </div>
  </div>

  <div class="viva-card">
    <div class="viva-q">Q6: What are the DREQ and DACK control lines?</div>
    <div class="viva-a">
      <strong>Answer:</strong> <code>DREQ</code> (DMA Request) is asserted by the I/O peripheral to inform the DMA controller that its FIFO buffer has data ready to transfer. <code>DACK</code> (DMA Acknowledge) is asserted by the DMA controller back to the peripheral when bus mastership is secured, notifying the peripheral to place data on the bus.
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
