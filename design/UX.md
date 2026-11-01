# UX Contract — CarSense AI

> Fill this before writing UI code. It is the acceptance contract for the
> frontend: if the implementation does not match this file, the implementation
> is wrong. Keep it short and specific.

## 1. Product

- **One-liner**: Real-time connected car telematics & AI diagnostic copilot that translates cryptic OBD-II DTC codes and freeze-frame sensor telemetry into plain-English root causes, safety urgency, and repair estimates.
- **Primary user**: Everyday car owners, DIY mechanics, and small fleet drivers facing vehicle warning lights or unexpected engine behavior.
- **Job to be done**: Ingest live or recorded OBD-II / CAN-bus vehicle telemetry, detect active and pending trouble codes, correlate multi-sensor anomalies, and explain in plain English whether the car is safe to drive, what specifically broke, and how much it will cost to fix.
- **Core success action**: Select a telematics scenario (or connect stream/custom log), click "Run AI Triage", and receive an accurate plain-English root-cause diagnosis with safety urgency rating and actionable repair advice in ≤ 2 seconds.
- **What the user should never have to guess**:
  1. Is it safe to drive right now? (Highlighted by an unambiguous 3-tier Urgency Banner: Green = Safe, Amber = Service Soon, Red = Pull Over Immediately).
  2. Which specific part failed and why (e.g. not just "P0171 System Too Lean", but "Intake vacuum leak detected: Short-Term Fuel Trim is pegged at +25% at idle while MAF reads unusually low").
  3. Realistic repair cost range and DIY difficulty level.

## 2. Core flow

| # | Step | User action | System feedback | Next step is obvious? |
|---|---|---|---|---|
| 1 | Telematics Stream Selection | User lands on cockpit and selects a vehicle profile / fault scenario (e.g. Intake Vacuum Leak, Severe Cylinder Misfire, Alternator Diode Fault, EV Battery Imbalance, or Custom Log) | Gauge cluster and live sparklines immediately reflect engine RPM, speed, fuel trims, MAF, and battery voltage. MIL / Check Engine light updates. | Yes — prominent "Run AI Diagnostic Triage" button pulses amber/red if fault is detected. |
| 2 | Diagnostic Triage Execution | User clicks "Run AI Diagnostic Triage" (or clicks a specific freeze-frame anomaly pin) | Progress bar activates (<300ms analysis); diagnostic panel unlocks with Root Cause Card, Urgency Badge, Affected Component, and Repair Estimate. | Yes — action buttons appear: "Ask AI Mechanic", "Simulate Part Fix", "Export Telemetry Report", or "Clear DTC Code". |
| 3 | Interactive Mechanic Consultation | User asks a question in the AI Mechanic console (e.g. "Can I drive 40 miles home with this?") or clicks one of the suggested quick questions | Real-time response with grounded explanation citing the exact telemetry PIDs and actionable driving precautions. | Yes — conversation history persists with timestamp and telemetry citation badges. |
| 4 | Component Repair & Drive Cycle Verification | User clicks "Simulate Repair & Clear Codes" | System clears DTCs, updates telemetry stream to nominal baseline, initiates OBD-II Drive Cycle Readiness monitor, and confirms readiness status. | Yes — cockpit shows green "All Systems Nominal" badge. |

Target: ≤ 2 steps and ≤ 1 minute from landing to the core result.

## 3. Pages

| Page | Purpose | Primary action | Secondary actions |
|---|---|---|---|
| `/` (Cockpit & Diagnostic Lab) | Unified automotive telematics dashboard: live gauge cluster, multi-PID sparklines, DTC scanner, AI diagnostic triage, and mechanic copilot | Run AI Diagnostic Triage (or switch scenario) | Ask Mechanic, Clear DTC, Inject Custom Fault, Export Report |

One primary action per page. The cockpit is a dense, high-efficiency single-page automotive instrument cluster (common in motorsport and telematics telemetry consoles).

## 4. Required states

For every page and interactive component:

- [x] **Empty / first visit**: Explains what OBD-II telematics streams are, loads a safe baseline profile with 0 active faults, and guides user to test with preloaded fault scenarios or upload CAN logs.
- [x] **Loading**: Active telemetry scanner animation, PID scanning progress, "Analyzing multi-sensor freeze-frame data..." indicator.
- [x] **Success**: Confirms diagnostic triage completed; shows green checkmarks for verified sensor readings and readiness monitors.
- [x] **Error**: Clear error message if custom log format is malformed or sensor stream drops, with 1-click fallback to preloaded verified vehicle profiles.
- [x] **Invalid input**: Form validation on custom PID inputs with exact allowable ranges (e.g. RPM: 0–9000, Fuel Trim: -100% to +100%).
- [x] **No permission / signed out**: Not applicable (zero-install public web tool; client-side telemetry state with local storage persistence).
- [x] **Mobile 390px layout**: Single-column vertical layout: Telemetry HUD gauges stack cleanly, freeze-frame cards adapt with touch-friendly tabs, 44px+ touch targets.

## 5. Design tokens

- **Font family and scale**:
  - UI Sans: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (12px, 14px, 16px, 18px, 24px, 32px)
  - Telemetry Monospace: `'JetBrains Mono', 'Fira Code', 'Roboto Mono', ui-monospace, monospace` (for all numbers, PIDs, DTCs, and hexadecimal frames)
- **Spacing scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px (compact, dense telemetry spacing)
- **Colors**:
  - Background Base: `#0a0d12` (deep automotive carbon black)
  - Surface Card / Dial: `#121721` (dark instrumentation slate)
  - Border / Gridlines: `#1e2638` (subtle technical divider)
  - Primary Text: `#f1f5f9` (bright slate-50)
  - Muted Text / Labels: `#94a3b8` (slate-400)
  - Accent / Telematic Cyan: `#06b6d4` (cyan-500) & `#3b82f6` (blue-500)
  - Caution / MIL Amber: `#f59e0b` (amber-500)
  - Danger / Critical Red: `#ef4444` (red-500)
  - Nominal / Safe Emerald: `#10b981` (emerald-500)
- **Radius and borders**: `rounded-md` (4px to 8px max; crisp automotive bezel corners, not puffy toy pill buttons). 1px crisp technical borders (`border-slate-800`).
- **Button and input height**: Minimum 44px touch targets on mobile; 38px compact on desktop instrumentation panels.
- **Icon style and stroke**: Lucide technical icons (1.75px stroke, crisp geometric outlines).

## 6. References

| Reference (URL or screenshot) | What to borrow | What not to copy |
|---|---|---|
| **Foxglove Studio** (`https://foxglove.dev/`) | High-density multi-panel layout, synchronized time-scrubbing, telemetry sparklines | Proprietary cloud sync, heavy ROS2 dependencies |
| **Tesla Vehicle Service Mode / Comma openpilot Cabana** | Clean automotive gauge typography, clear CAN signal graphing, bold diagnostic urgency banners | Comma brand assets, Tesla proprietary CAN DBC files |
| **Torque Pro / Carly App** | SAE standard PID naming (STFT, LTFT, MAF, MAP, ECT, RPM) and DTC conventions | Outdated skeuomorphic dials, paywalls, cluttered menus |

## 7. Mobile (390px)

- **390px layout**: Stacked single-column hierarchy:
  1. Vehicle Status & Urgency Banner (sticky top bar)
  2. Compact Digital Instrument Cluster (RPM, Speed, Temp, Battery)
  3. Diagnostic Triage & Freeze-Frame Card (with expandable root cause details)
  4. Multi-PID Telemetry Sparklines (horizontal scrollable or tabbed view)
  5. Interactive AI Mechanic Assistant Drawer
- **Primary action reachable without horizontal scroll**: "Run AI Diagnostic Triage" stays fixed/prominent at all times.
- **What is collapsed or hidden**: Advanced raw hex CAN frame viewer collapsed behind an "Advanced Diagnostics / Raw PIDs" toggle.
- **Keyboard behavior**: Chat input auto-scrolls to ensure message and send button remain visible above virtual keyboard.

## 8. Visual direction

- **Three adjectives**: Industrial, High-Precision, Plain-Spoken (工业级、高精度、通俗直击).
- **Product archetype**: Dashboard & Diagnostic Lab (high-density automotive telemetry console).
- **Palette and why it fits the domain**: Deep carbon slate (`#0a0d12`) paired with SAE-standard Check Engine amber (`#f59e0b`), critical red (`#ef4444`), telematic cyan (`#06b6d4`), and nominal emerald (`#10b981`). Mirrors physical vehicle instrument clusters and professional dealer diagnostic tablets (e.g. Bosch / Snap-on scanners), eliminating eye strain.
- **Type pairing**: Crisp Technical Sans (`Inter`) for readability + Monospace (`JetBrains Mono`) for strict numeric and telemetry PID alignment.
- **Density**: Dense. Automotive telemetry demands high data density so engineers and drivers can cross-reference multiple sensor readings without scrolling miles of white space.
- **Signature element**:
  - **"Diagnostic Freeze-Frame Anomaly Matrix"**: Synchronized sensor time-scrubber where the Check Engine trigger event is pinned, highlighting anomalous PID deviations (e.g. fuel trim excursion vs. engine load) with visual crosshairs directly linked to the plain-English AI causal deduction.
- **Motion rules**:
  - Smooth gauge needles and sparkline updates (60fps canvas/SVG interpolation).
  - Subtle pulsing indicator on active MIL / Check Engine alert.
  - Zero decorative bouncing blobs, zero spinning 3D marketing fluff.
- **Rejected clichés**: Purple gradients, glassmorphism, three-card hero landing page, generic SaaS KPI metrics, emoji icons, abstract blob art.

**Generic test:** Could this first screen be dropped into any other SaaS product without looking out of place?
**No.** It immediately and undeniably looks like an authentic, high-precision vehicle telemetry cockpit and diagnostic laboratory.

## 9. UX acceptance

- [x] A first-time user can explain the product's purpose within 5 seconds (diagnoses car warning lights & telemetry in plain English).
- [x] The core task is reachable from the landing page without reading docs (single click to run AI triage).
- [x] Every action produces visible feedback within 100ms, or a loading state.
- [x] Every error says what happened and what to do next.
- [x] Empty states are actionable, not blank (preloaded scenarios ready to run).
- [x] No dead ends; no unlabeled icon-only buttons.
- [x] Desktop and mobile screenshots reviewed side by side in QA.
- [x] The flow works deterministically on local and deployed environments.
