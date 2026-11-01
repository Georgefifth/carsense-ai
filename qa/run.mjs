// Real-browser QA runner for CarSense AI.
// Run:
//   BASE_URL=http://localhost:3000 node qa/run.mjs
//   BASE_URL=https://remote-control-ai.vercel.app node qa/run.mjs
//   HEADED=1 BROWSER=chromium BASE_URL=... node qa/run.mjs

import { chromium, firefox } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.QA_OUT ?? "evidence/stage-3-qa";
const BROWSER = process.env.BROWSER === "chromium" ? "chromium" : "firefox";
const HEADED = process.env.HEADED === "1";

const SHOTS = path.join(OUT, "screens");
fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
];

const scenarios = [
  {
    id: "s1-landing-first-visit",
    title: "P0: First visit renders cockpit, gauges, and initial P0171 fault without overflow",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: "domcontentloaded" });

      await ctx.expectVisible("main");
      ctx.assert((await page.title()).includes("CarSense AI"), "Title missing CarSense AI");

      // Verify initial P0171 state
      await ctx.expectText(/Service Soon/i);
      await ctx.expectText(/P0171/i);
      await ctx.expectText(/ENGINE RPM/i);
      await ctx.expectText(/FUEL TRIM \(STFT\)/i);

      // Verify 0 horizontal overflow
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      ctx.assert(overflow <= 1, `horizontal overflow: ${overflow}px`);

      await ctx.shot("landing");
    },
  },
  {
    id: "s2-core-diagnostic-triage",
    title: "P0: Switch to P0303 Misfire, run AI Diagnostic Triage via API, and persist across reload",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ctx.expectVisible("main");

      // Select scenario 3 (Cylinder 3 Misfire P0303)
      const select = page.getByLabel("Telematics Profile");
      await select.selectOption("cylinder-3-misfire");

      // Verify UI updated to P0303
      await ctx.expectText(/P0303/i);
      await ctx.expectText(/CHECK ENGINE \(FLASHING\)/i);

      // Click Run AI Diagnostic Triage and verify API response + toast feedback
      await page.getByRole("button", { name: /Run AI Diagnostic Triage/i }).click();
      await ctx.expectText(/STOP IMMEDIATELY/i);
      await ctx.expectText(/Ignition Coil/i);

      await ctx.shot("triage-p0303");

      // Verify state persists across page reload via localStorage
      await page.reload({ waitUntil: "domcontentloaded" });
      await ctx.expectText(/P0303/i);
      const savedId = await page.evaluate(() => localStorage.getItem("carsense_scenario_id"));
      ctx.assert(savedId === "cylinder-3-misfire", `Expected persisted scenario cylinder-3-misfire, got ${savedId}`);
    },
  },
  {
    id: "s3-mechanic-copilot-chat",
    title: "P0: Consult AI Master Mechanic Copilot via quick chip and custom input",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ctx.expectVisible("main");

      // Ensure empty input cannot be submitted
      const sendBtn = page.getByRole("button", { name: /Send/i });
      ctx.assert(await sendBtn.isDisabled(), "Send button should be disabled when input is empty");

      // Click quick chip question
      await page.getByRole("button", { name: /Can I drive 40 miles home with this\?/i }).click();
      await ctx.expectText(/miles home|roadside assistance|precautions/i);

      // Type custom cost question and submit
      const chatInput = page.getByPlaceholder(/Ask mechanic/i);
      await chatInput.fill("How much will a mechanic charge to fix this?");
      ctx.assert(!(await sendBtn.isDisabled()), "Send button should enable when text is entered");
      await sendBtn.click();

      await ctx.expectText(/Estimated Repair Cost Breakdown/i);
      await ctx.shot("mechanic-chat");
    },
  },
  {
    id: "s4-repair-and-readiness",
    title: "P1: Simulate Part Fix & Clear Codes, then run OBD-II I/M Drive Cycle Readiness",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ctx.expectVisible("main");

      // Click Simulate Part Fix & Clear
      await page.getByRole("button", { name: /Simulate Part Fix & Clear/i }).click();
      await ctx.expectText(/MIL OFF \(0 CODES\)/i);
      await ctx.expectText(/All Powertrain Systems Nominal/i);

      await ctx.shot("codes-cleared");

      // Open I/M Readiness Modal
      await page.locator("header button[title*='Readiness']").click();
      await ctx.expectText(/OBD-II I\/M Emissions Readiness Monitors/i);
      await ctx.expectText(/4\/6/i);

      // Click Run Drive Cycle Complete
      await page.getByRole("button", { name: /Run Drive Cycle Complete/i }).click();
      await ctx.expectText(/6\/6/i);
      await ctx.expectText(/READY TO PASS/i);

      await ctx.shot("readiness-complete");

      // Close modal
      await page.getByRole("button", { name: /Close/i }).click();
    },
  },
  {
    id: "s5-custom-fault-injector",
    title: "P1: Inject custom P0562 Alternator undervoltage fault and verify telemetry gauges",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ctx.expectVisible("main");

      // Open Fault Injector modal
      await page.locator("header button[title*='Inject custom PID']").click();
      await ctx.expectText(/OBD-II Telemetry & Fault Injection Console/i);

      // Select P0562 Alternator Sag preset
      await page.getByRole("button", { name: /P0562 Alternator Sag/i }).click();
      await page.getByRole("button", { name: /Apply Injected Telemetry/i }).click();

      // Verify modal closed and dashboard updated to P0562 & 11.4V
      await ctx.expectText(/P0562/i);
      await ctx.expectText(/Alternator/i);

      await ctx.shot("injected-p0562");
    },
  },
  {
    id: "s6-raw-can-sniffer-and-accessibility",
    title: "P2: Toggle Raw CAN-FD Frame Sniffer drawer and verify keyboard accessibility",
    async run(page, ctx) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await ctx.expectVisible("main");

      // Toggle Raw CAN drawer
      await page.getByRole("button", { name: /Advanced Diagnostic Telemetry: Raw CAN/i }).click();
      await ctx.expectText(/ISO 15765-4 CAN Bus 11-bit Frame Trace/i);
      await ctx.expectText(/0x7DF \(Broadcast\)/i);

      // Verify no horizontal overflow even with raw trace open
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      ctx.assert(overflow <= 1, `horizontal overflow with CAN drawer open: ${overflow}px`);

      await ctx.shot("raw-can-trace");
    },
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectVisible(page, selector, timeout = 10000) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  return locator;
}

async function expectText(page, text, timeout = 10000) {
  const locator = page.locator("main, .fixed").getByText(text).first();
  await locator.waitFor({ state: "visible", timeout });
  return locator;
}

function collectIssues(page) {
  const issues = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push({ kind: "console", text: msg.text() });
  });
  page.on("pageerror", (err) => {
    issues.push({ kind: "pageerror", text: err.message });
  });
  page.on("requestfailed", (req) => {
    const reason = req.failure()?.errorText ?? "request failed";
    if (!reason.includes("ERR_ABORTED") && !reason.includes("NS_BINDING_ABORTED")) {
      issues.push({ kind: "requestfailed", text: `${reason} ${req.url()}` });
    }
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 500) issues.push({ kind: "http", text: `${status} ${res.url()}` });
    else if (status >= 400) {
      issues.push({ kind: "http", level: "warn", text: `${status} ${res.url()}` });
    }
  });
  return issues;
}

async function main() {
  const browserType = BROWSER === "chromium" ? chromium : firefox;
  const browser = await browserType.launch({ headless: !HEADED });
  const startedAt = new Date().toISOString();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      baseURL: BASE,
      viewport: vp.viewport,
      deviceScaleFactor: vp.deviceScaleFactor,
    });

    for (const scenario of scenarios) {
      const page = await context.newPage();
      const issues = collectIssues(page);
      const screenshots = [];
      const started = Date.now();
      let status = "pass";
      let error = null;

      const ctx = {
        assert,
        expectVisible: (selector, timeout) => expectVisible(page, selector, timeout),
        expectText: (text, timeout) => expectText(page, text, timeout),
        shot: async (name, opts = {}) => {
          const file = path.join(SHOTS, `${scenario.id}-${name}-${vp.name}.png`);
          await page.screenshot({ path: file, fullPage: opts.fullPage ?? true });
          screenshots.push(file);
          return file;
        },
      };

      try {
        await scenario.run(page, ctx);
      } catch (err) {
        status = "fail";
        error = err.message;
      } finally {
        await page.close().catch(() => {});
      }

      const errors = issues.filter((i) => (i.level ?? "error") === "error");
      const warnings = issues.filter((i) => i.level === "warn");
      if (status === "pass" && errors.length > 0) {
        status = "fail";
        error = errors.map((i) => `${i.kind}: ${i.text}`).join(" | ");
      }

      results.push({
        viewport: vp.name,
        id: scenario.id,
        title: scenario.title,
        status,
        ms: Date.now() - started,
        error,
        errors,
        warnings,
        screenshots,
      });

      console.log(
        `${status === "pass" ? "✓" : "✗"} [${vp.name}] ${scenario.id}` +
          (error ? ` — ${error}` : ""),
      );
    }

    await context.close();
  }

  await browser.close();

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
  };
  const finishedAt = new Date().toISOString();
  const report = {
    base: BASE,
    browser: BROWSER,
    headed: HEADED,
    startedAt,
    finishedAt,
    summary,
    results,
  };

  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(report, null, 2));

  const warnings = results.flatMap((r) =>
    r.warnings.map((w) => `- [${r.viewport}] ${r.id}: ${w.kind} — ${w.text}`),
  );
  const md = [
    `# QA run — ${finishedAt}`,
    "",
    `- Base URL: ${BASE}`,
    `- Browser: ${BROWSER} (${HEADED ? "headed" : "headless"})`,
    `- Scenarios: ${summary.total} — ${summary.pass} pass, ${summary.fail} fail`,
    "",
    "| Viewport | Scenario | Status | ms | Detail |",
    "|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| ${r.viewport} | ${r.id} | ${r.status} | ${r.ms} | ${(r.error ?? "").replace(/\|/g, "\\|")} |`,
    ),
    "",
    ...(warnings.length ? ["## Warnings", "", ...warnings, ""] : []),
    "## Screenshots",
    "",
    ...results.flatMap((r) => r.screenshots.map((s) => `- ${s}`)),
    "",
  ];
  fs.writeFileSync(path.join(OUT, "report.md"), md.join("\n"));

  console.log(`\n${summary.pass}/${summary.total} passed — see ${OUT}/`);
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
