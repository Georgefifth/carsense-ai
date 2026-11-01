"use strict";

// CarSense AI — Stage 4 Hackathon Demo Scene Specification
// Uses Cold-Open (in-medias-res) narrative arc + live HTML visual slides + real deployed app interactions.

const APP_URL = "https://remote-control-ai.vercel.app";

module.exports = [
  // SCENE 1: Cold Open inside the live deployed application
  {
    name: "cold-open-live",
    session: "open",
    url: APP_URL,
    actions: [
      { type: "waitFor", sel: "text=Run AI Diagnostic Triage", timeout: 15000 },
      { type: "click", sel: "text=Run AI Diagnostic Triage" },
      { type: "wait", ms: 1200 },
      { type: "spotlight", sel: "text=Post-MAF Intake Vacuum Leak", label: "★ MULTI-PID ROOT CAUSE", ms: 2200 },
      { type: "wait", ms: 1200 },
    ],
    vo: "When a 'Check Engine light' appears, CarSense AI correlates 'live CAN telemetry' in under 1ms—turning a cryptic 'P0171 fault code' into a verified '$28 vacuum hose' diagnosis.",
    pause: 0.3,
  },

  // SCENE 2: Live HTML Visual Slide — Before / After Problem Illustration
  {
    name: "slide-problem-compare",
    duration: 9.5,
    card: {
      html: "demo/slides.html",
      slide: "#slide-problem",
    },
    vo: "Legacy scanners dump raw trouble codes with zero sensor context, tricking drivers into wasting '$250' on an oxygen sensor when 'fuel trim' and 'airflow' prove a simple intake leak.",
    pause: 0.3,
  },

  // SCENE 3: Live HTML Visual Slide — System Architecture & 4-Stage Pipeline
  {
    name: "slide-architecture",
    duration: 10.0,
    card: {
      html: "demo/slides.html",
      slide: "#slide-architecture",
    },
    vo: "Our architecture ingests '20Hz SAE J1979' streams, pins the '10-second freeze-frame' window, and runs cross-sensor causal physics on our '/api/diagnose' engine.",
    pause: 0.3,
  },

  // SCENE 4: Live App — Fault Injection (P0303 Critical Flashing Misfire) & Mechanic Copilot
  {
    name: "live-critical-triage",
    session: "app",
    url: APP_URL,
    actions: [
      { type: "waitFor", sel: "button[aria-label='Open Fault Injector']", timeout: 10000 },
      { type: "click", sel: "button[aria-label='Open Fault Injector']" },
      { type: "waitFor", sel: "text=P0303 Flashing Misfire", timeout: 10000 },
      { type: "click", sel: "text=P0303 Flashing Misfire" },
      { type: "click", sel: "text=Apply Injected Telemetry" },
      { type: "wait", ms: 1200 },
      { type: "click", sel: "text=Can I drive 40 miles home with this?" },
      { type: "wait", ms: 1800 },
    ],
    vo: "Injecting a 'Cylinder 3 misfire' under 65% load triggers an immediate 'STOP verdict' and grounds our 'AI Master Mechanic' to warn of '$1,200 catalyst melt' risk.",
    pause: 0.3,
  },

  // SCENE 5: Live App — Simulate Part Repair, Clear ECU Codes & Verify 6/6 I/M Readiness
  {
    name: "live-repair-readiness",
    session: "app",
    actions: [
      { type: "waitFor", sel: "text=Simulate Part Fix & Clear", timeout: 10000 },
      { type: "click", sel: "text=Simulate Part Fix & Clear" },
      { type: "wait", ms: 1000 },
      { type: "click", sel: "button[aria-label='Open I/M Readiness Monitors']" },
      { type: "waitFor", sel: "text=Run Drive Cycle Complete", timeout: 10000 },
      { type: "click", sel: "text=Run Drive Cycle Complete" },
      { type: "wait", ms: 1800 },
    ],
    vo: "After simulating the 'coil replacement', CarSense AI clears stored codes, resets fuel trims, and verifies all '6 of 6 OBD-II readiness' monitors pass inspection.",
    pause: 0.3,
  },

  // SCENE 6: Live HTML Visual Slide — Stage 3.5 Benchmark Proof & Closing
  {
    name: "slide-benchmark-proof",
    duration: 9.5,
    card: {
      html: "demo/slides.html",
      slide: "#slide-benchmark",
    },
    vo: "Validated across '24 real-world cases', CarSense AI achieved '100% diagnostic accuracy' in under '0.25ms', outperforming static code lookups by '70.8 percentage points'.",
    pause: 0.4,
  },
];
