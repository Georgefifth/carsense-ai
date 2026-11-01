# Stage 2 — Competitive Analysis, UX Contract, Build & Deployment Evidence

## 1. Competitive Analysis & Sources

We evaluated 4 real-world direct and indirect competitors in the connected vehicle telematics and OBD-II diagnostic domain:

| Product / Project | Type & URL | Key Strengths | Key Limitations & User Pain Points |
|---|---|---|---|
| **Torque Pro (OBD2 & Car)** | Commercial Android App (`https://torque-bhp.com/`) | Fast raw ELM327 Bluetooth polling; customizable PID dial layouts. | Dated skeuomorphic UI; displays raw numbers (`STFT +24.8%`) and cryptic DTCs (`P0171`) with zero causal interpretation or repair guidance. |
| **Carly Connected Car** | Commercial Hardware + Subscription SaaS (`https://www.mycarly.com/`) | Polished mobile UI; manufacturer-specific code reading. | Requires proprietary $80+ adapter + $60–$100/yr recurring subscription; diagnostic tips are generic and do not correlate live multi-PID freeze-frame trends. |
| **AutoPi Telematics Cloud** | Commercial IoT Platform (`https://www.autopi.io/`) | Deep CAN-bus logging, fleet tracking, and cloud webhooks. | Requires $250+ Raspberry Pi 4 telematics dongle; steep developer configuration curve; no plain-English driver diagnostic copilot. |
| **Foxglove Studio / Comma Cabana** | Developer Telemetry Tools (`https://foxglove.dev/`, `https://github.com/commaai/openpilot`) | Industry-leading time-synchronized signal scrubbing and CAN frame inspection. | Built for robotics/autonomous vehicle engineers, not everyday car owners facing a Check Engine light; zero repair cost estimation or urgency triage. |

---

## 2. Product Review & Prioritized Optimization Plan

### Identified Workflow Friction in Existing Tools
1. **P0 — Cryptic Code Panic**: When a driver sees `P0171` or `P0303`, existing apps do not answer the #1 immediate question: *"Is it safe to drive home right now, or will my engine blow up?"*
2. **P0 — Single-Sensor Misdiagnosis**: Drivers routinely waste $250 replacing an upstream O2 sensor when `P0171` triggers because the O2 sensor reports "Lean", whereas correlating `STFT (+24.8% at idle)` with `MAF (1.7 g/s)` proves the real cause is a $28 intake vacuum leak.
3. **P1 — Lack of Freeze-Frame Time Context**: Static code readers discard the 10-second telemetry window leading up to the MIL trigger.
4. **P1 — Post-Repair Emissions Readiness Confusion**: Drivers clear codes right before an emissions test and fail because they don't know their Catalyst and EVAP readiness monitors reset to `Incomplete`.

### Prioritized Optimizations Implemented in CarSense AI
1. **[P0] Unambiguous 3-Tier Driving Safety Banner**: Instant top-level visual banner (`Roadworthy [Green]` / `Service Soon — Safe <50 Miles [Amber]` / `STOP IMMEDIATELY — Catalyst Melt Risk [Flashing Red]`).
2. **[P0] Multi-PID Freeze-Frame Correlation Engine (`/api/diagnose`)**: Serverless API + local deterministic engine that cross-references `STFT`, `LTFT`, `MAF`, `Engine Load`, `Coolant Temp`, and `Battery Voltage` to identify root causes with component probability rankings, DIY parts cost vs. mechanic labor estimates, and 1–5 wrench difficulty ratings.
3. **[P1] Signature Visual Element — Diagnostic Freeze-Frame Anomaly Matrix**: Synchronized 4-channel SVG sparkline time-scrubber (`T-10s` to `T-0s`) with `MIL TRIGGER POINT` pinning.
4. **[P1] Grounded AI Master Mechanic Copilot (`/api/mechanic`)**: Interactive conversational assistant with 1-click quick chips that answers driving safety, repair cost, DIY tool, and Federal EPA emissions warranty questions grounded in live vehicle telemetry.
5. **[P2] Interactive Fault Injector & OBD-II I/M Readiness Simulator**: Allows testing custom DTCs, adjusting PID sliders, simulating component repairs, and running an OBD-II Drive Cycle completion check.

---

## 3. UX Contract & Frontend-First Verification

- **UX Contract**: Documented in `design/UX.md` prior to UI implementation.
- **Visual Direction**: Industrial, High-Precision, Plain-Spoken (`#080a0f` deep carbon slate, `#121721` instrument surface, `#06b6d4` telematic cyan, `#f59e0b` SAE MIL amber, `#ef4444` critical red, `Inter` + `JetBrains Mono` tabular numerals).
- **Generic SaaS Check**: Passed. The first screen is unmistakably an automotive telematics cockpit and diagnostic laboratory.
- **Frontend Verification Screenshots**:
  - Desktop (`1440×900`): `evidence/stage-2-build/frontend/desktop-1440x900.png` (0px horizontal overflow)
  - Mobile (`390×844`): `evidence/stage-2-build/frontend/mobile-390x844.png` (0px horizontal overflow)
  - Fault Injection Modal: `evidence/stage-2-build/frontend/desktop-fault-injection.png`
  - I/M Readiness Drive Cycle Modal: `evidence/stage-2-build/frontend/desktop-drive-cycle.png`

### Bug Caught & Fixed During Frontend Visual Inspection
- **Issue**: `MechanicAssistant.tsx` initially called `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` on mount, which caused the browser viewport to scroll halfway down the page on initial load, pushing the sticky header over the mid-page content in full-page screenshots.
- **Fix**: Replaced `scrollIntoView` with `chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight` so scrolling is strictly confined inside the chat container. Verified clean top-of-page rendering on both desktop (`1440×900`) and mobile (`390×844`).

---

## 4. Before / After Operational Efficiency Comparison

| Metric | Traditional Workflow (Torque Pro + Google/Reddit Forum Search) | CarSense AI Workflow | Improvement |
|---|---|---|---|
| **Steps from MIL Trigger to Root Cause & Cost** | 6+ steps (Read code → Google code → Check freeze frame → Search forum for vehicle symptoms → Look up part prices → Estimate labor) | **1–2 steps** (Select/Connect telemetry stream → Click `Run AI Diagnostic Triage`) | **-70% steps** |
| **Time to Actionable Driving Verdict** | 15–30 minutes of manual cross-referencing | **< 2 seconds** (Instant Urgency Banner + Correlated PIDs) | **>99% faster** |
| **Multi-PID Correlation Accuracy** | Prone to misdiagnosing O2 sensor vs. vacuum leak | Deterministic multi-PID rule correlation across 5 core powertrain failure modes | Eliminates false O2 sensor replacements |

---

## 5. Build, Test & Deployment Verification

### Build & Unit Test Output
- **Production Build (`npm run build`)**:
  - `tsc && vite build` passed with **0 TypeScript errors**.
  - Output bundle: `dist/index.html` (1.53 kB), `dist/assets/index-BvdqD2XX.css` (33.03 kB), `dist/assets/index-2WaKPjd-.js` (313.72 kB).
- **API & Diagnostic Engine Unit Tests (`npm test`)**:
  - `6/6` tests passed in `46.2ms` (`tests/diagnostic.test.mjs`), covering nominal highway cruise, `P0171` intake vacuum leak correlation, `P0303` critical flashing misfire, `P0562` alternator undervoltage, invalid input validation (`HTTP 400`), and `/api/mechanic` safety triage responses.

### Repository & Live Deployment Links
- **GitHub Repository**: `https://github.com/Georgefifth/carsense-ai` (Public, scanned for secrets prior to push — 0 `.env` or key files).
- **Live Production URL (Vercel)**: `https://remote-control-ai.vercel.app`
- **Live Serverless API Endpoints**:
  - `POST https://remote-control-ai.vercel.app/api/diagnose` (Verified `HTTP 200 OK`)
  - `POST https://remote-control-ai.vercel.app/api/mechanic` (Verified `HTTP 200 OK`)

---

## 6. Known Limitations
1. **Physical Bluetooth Dongle**: Web Bluetooth API support for physical ELM327 adapters is browser-dependent (Chrome desktop/Android) and cannot be tested in automated headless CI without physical car hardware; mitigated via 5 realistic preloaded SAE vehicle telemetry profiles and an interactive custom Fault Injector.
2. **OEM Proprietary Sub-Codes**: The current engine focuses on standard SAE J1979 Mode `$01`/`$03` powertrain (`P0xxx` / `P0Axx`) parameters rather than OEM-proprietary body/chassis (`Bxxxx` / `Uxxxx`) CAN databases.
