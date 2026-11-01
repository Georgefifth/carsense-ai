# CarSense AI — Connected Vehicle Telematics & Diagnostic Copilot

> **Built for the Remote Control AI Hackathon 2026**
> *"Take control of what AI can do. Build anywhere. Control everything."*

**CarSense AI** is a web-first connected car telematics dashboard and AI diagnostic copilot. It ingests real-time OBD-II / CAN-FD vehicle sensor telemetry and freeze-frame trouble codes (SAE J1979 / J2012), correlates multi-sensor anomalies (Short-Term & Long-Term Fuel Trims, Mass Air Flow, O2 Sensor Switching Voltage, Engine Load, and Charging Line Voltage), and translates them into **plain-English root causes**, **3-tier driving safety urgency verdicts**, **DIY vs. mechanic repair cost estimates**, and an **interactive AI Master Mechanic assistant**.

---

## Why CarSense AI?

Every year, tens of millions of drivers face an unexpected **Check Engine Light (MIL)**. Existing consumer OBD-II apps (such as Torque Pro or Carly) either dump raw, cryptic PID dials and alphanumeric trouble codes (`P0171`, `P0303`, `P0562`, `P0A80`) onto the screen without causal context, or lock basic diagnostic explanations behind $100+/year hardware and subscription paywalls. Worse, single trouble codes frequently mislead drivers into replacing the wrong part (e.g., replacing an expensive $250 Oxygen Sensor on a `P0171` code when the true culprit is a $28 cracked PCV vacuum hose).

**CarSense AI solves this by:**
1. **Multi-Sensor Freeze-Frame Correlation**: Cross-referencing fuel trims, airflow, engine load, and line voltage at the exact millisecond a fault triggers (`T-4.0s` Freeze-Frame Scrubber) to pinpoint the physical failure.
2. **Unambiguous 3-Tier Safety Triage**: Instant visual verdict telling the driver whether the car is **Roadworthy (Green)**, **Safe to Drive Home <50 Miles (Amber)**, or **PULL OVER IMMEDIATELY — Catalyst Melt / Fire Risk (Flashing Red)**.
3. **Transparent Cost & DIY Guidance**: Side-by-side DIY parts cost vs. professional mechanic labor estimates, wrench difficulty ratings (1–5), and step-by-step replacement instructions.
4. **Grounded AI Master Mechanic Copilot**: Answers natural questions (*"Can I drive 40 miles home with this?"*, *"Is this covered under emissions warranty?"*) grounded in live vehicle telemetry.
5. **Interactive Fault Injector & I/M Readiness Simulator**: Test custom PID excursions, simulate component repairs, clear ECU codes, and verify OBD-II emissions drive-cycle readiness monitors.

---

## Key Features

- **Automotive Precision Gauge Cluster**: Live 20Hz CAN telemetry readouts for Engine/Motor RPM (`PID 0x0C`), Vehicle Speed (`PID 0x0D`), Short-Term Fuel Trim (`PID 0x06`), Mass Air Flow (`PID 0x10`), Coolant Temp (`PID 0x05`), and System/Traction Voltage (`PID 0x42`).
- **Diagnostic Freeze-Frame Anomaly Matrix**: Synchronized 4-channel SVG telemetry sparklines with interactive time-scrubbing (`T-10s` to `T-0s`) and MIL trigger pinning.
- **5 Preloaded Real-World Vehicle Scenarios**:
  1. *2024 Honda Civic 1.5T* — All Systems Nominal (Stoichiometric Highway Cruise)
  2. *2021 Toyota RAV4 2.5L* — Post-MAF Intake Vacuum Leak (`P0171` Lean Bank 1)
  3. *2020 Ford F-150 3.5L EcoBoost* — Severe Cylinder 3 Misfire (`P0303` & Flashing MIL)
  4. *2022 Subaru Outback 2.5i* — Alternator Diode Bridge Failure (`P0562` Low System Voltage)
  5. *2023 Tesla Model 3 Long Range* — EV High-Voltage Pack Cell Imbalance (`P0A80` >285mV Delta)
- **Raw CAN-FD / ISO 15765-4 Frame Sniffer**: Inspect raw hexadecimal Mode `$01` and Mode `$03` request/reply frames (`0x7DF` broadcast / `0x7E8` ECM reply).

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Automotive Icons, Custom SVG Telemetry Sparklines
- **Backend / API**: Node.js / Vercel Serverless Functions (`/api/diagnose`, `/api/mechanic`) implementing SAE J1979 multi-PID correlation rules + deterministic local fallback engine
- **QA & Verification**: Playwright real-browser end-to-end verification (Desktop `1440×900` & Mobile `390×844`) + Node native test suite

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+ and npm

### Install & Run
```bash
# Install dependencies
npm install

# Run unit & API correlation tests
npm test

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build
```

---

## License & Credits

- Built during the **Remote Control AI Hackathon 2026**.
- Standard OBD-II PID definitions and DTC nomenclature follow public **SAE J1979** and **SAE J2012** automotive diagnostic standards.
- Open-source under the MIT License.
