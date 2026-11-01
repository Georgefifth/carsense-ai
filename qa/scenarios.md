# CarSense AI — Stage 3 Real-Browser QA Scenarios

## Test Environment
- **Deployed Production URL**: `https://remote-control-ai.vercel.app`
- **Local Build URL**: `http://localhost:3000`
- **Browsers**: Headless Firefox (default per Stage 3 spec) & Chromium
- **Viewports**:
  - Desktop: `1440 × 900` (`deviceScaleFactor: 1`)
  - Mobile: `390 × 844` (`deviceScaleFactor: 2`)

---

## Scenario Checklist & Priority Matrix

| ID | Priority | Scenario Title | User Action | Expected Business Outcome & Assertions |
|---|---|---|---|---|
| `s1-landing-first-visit` | **P0** | First Visit & Telemetry Cockpit Initial State | Open `/` with clean storage | Document title contains `CarSense AI`; Urgency Banner displays default `P0171` intake vacuum leak; Gauge Cluster renders all 6 SAE PIDs; 0px horizontal overflow; 0 console/network errors. |
| `s2-core-diagnostic-triage` | **P0** | End-to-End Core Flow: Switch Scenario & Run AI Diagnostic Triage | Select `3. Severe Cylinder 3 Misfire (P0303 & Flashing MIL)` from profile dropdown → Click `Run AI Diagnostic Triage` | `POST /api/diagnose` returns `200 OK`; Urgency Banner updates to `STOP IMMEDIATELY — Catastrophic Catalyst Damage Risk`; Flashing MIL badge visible; Root-cause card shows `Ignition Coil Pack / Boot (72% Confidence)` and DIY vs. Mechanic cost; Toast confirmation appears; Reload page and verify `P0303` profile persists via `localStorage`. |
| `s3-mechanic-copilot-chat` | **P0** | AI Master Mechanic Consultation & Quick Chips | Click quick chip `"Can I drive 40 miles home with this?"` and submit custom question `"How much will a mechanic charge to fix this?"` | `POST /api/mechanic` returns `200 OK`; Assistant replies with grounded telemetry guidance (`NO, you should NOT drive` for critical misfire, and exact `$` cost breakdown); Empty input cannot be submitted (`Send` button disabled when input is blank). |
| `s4-repair-and-readiness` | **P1** | Simulate Component Repair, Clear Codes & Verify OBD-II Drive Cycle | Click `Simulate Part Fix & Clear` → Open `I/M Readiness` modal → Verify incomplete flags → Click `Run Drive Cycle Complete` | Active DTCs cleared (`MIL OFF (0 CODES)`); Urgency Banner turns green (`All Powertrain Systems Nominal`); Readiness modal shows `4/6` (Catalyst & EVAP Incomplete after clear) then updates to `6/6` (`READY TO PASS`) after running drive cycle. |
| `s5-custom-fault-injector` | **P1** | Custom Fault Injection & Boundary Recovery | Click `Fault Injector` → Click `P0562 Alternator Sag` preset → Click `Apply Injected Telemetry` | Modal closes; System Voltage gauge updates to `11.4 V`; Urgency Banner updates to `Critical Power Depletion` (`P0562`); Root cause identifies `Alternator`. |
| `s6-raw-can-sniffer-and-accessibility` | **P2** | Raw CAN-FD Frame Sniffer & Keyboard Navigation | Toggle `Advanced Diagnostic Telemetry: Raw CAN / PID Sniffer` drawer; test `Escape` / keyboard focus | Hexadecimal ISO 15765-4 trace (`0x7DF` / `0x7E8`) expands and displays current PID values; `Copy Trace` button is interactive; all controls reachable via keyboard without horizontal overflow. |
