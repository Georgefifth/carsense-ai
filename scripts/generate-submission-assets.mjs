import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync('submission/assets', { recursive: true });

const THUMBNAIL_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 800px;
    background: #080a0f;
    background-image:
      radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.22), transparent 45%),
      radial-gradient(circle at 20% 85%, rgba(245, 158, 11, 0.16), transparent 45%),
      linear-gradient(to right, rgba(38, 51, 74, 0.32) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(38, 51, 74, 0.32) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px;
    overflow: hidden;
    position: relative;
    border: 3px solid #1e293b;
  }
  .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 18px;
    border-radius: 999px;
    background: rgba(6, 182, 212, 0.14);
    border: 1.5px solid #06b6d4;
    color: #22d3ee;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  .pulse-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 12px #10b981;
  }
  .center-hero {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 40px;
    align-items: center;
    margin: 16px 0;
  }
  .title {
    font-size: 76px;
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 0.98;
    margin-bottom: 18px;
  }
  .title span {
    color: #06b6d4;
  }
  .subtitle {
    font-size: 24px;
    color: #cbd5e1;
    line-height: 1.4;
    font-weight: 500;
    margin-bottom: 28px;
  }
  .metrics-pills {
    display: flex;
    gap: 14px;
  }
  .pill {
    background: #121721;
    border: 1.5px solid #26334a;
    border-radius: 10px;
    padding: 14px 18px;
  }
  .pill .num {
    font-size: 26px;
    font-weight: 800;
    color: #10b981;
  }
  .pill .lbl {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 3px;
  }
  .telemetry-art {
    background: #121721;
    border: 2px solid #06b6d4;
    border-radius: 18px;
    padding: 26px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.65);
  }
  .art-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid #26334a;
    margin-bottom: 16px;
  }
  .mil-tag {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid #f59e0b;
    color: #fbbf24;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
  }
  .gauge-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  .mini-gauge {
    background: #080a0f;
    border: 1px solid #26334a;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .mini-gauge .g-label { font-size: 11px; color: #94a3b8; }
  .mini-gauge .g-val { font-size: 26px; font-weight: 800; margin-top: 4px; }
  .verdict-strip {
    background: rgba(16, 185, 129, 0.14);
    border: 1px solid #10b981;
    border-radius: 10px;
    padding: 14px;
  }
  .verdict-strip .v-head { font-size: 12px; color: #6ee7b7; font-weight: 700; }
  .verdict-strip .v-body { font-size: 16px; color: #fff; font-weight: 700; margin-top: 4px; }
  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1.5px solid #1e293b;
    font-size: 14px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="top-row">
    <div class="badge mono"><span class="pulse-dot"></span>REMOTE CONTROL AI HACKATHON 2026</div>
    <div class="mono" style="color:#94a3b8;font-size:14px">SAE J1979 • CAN-FD 20Hz • MULTI-PID AI</div>
  </div>

  <div class="center-hero">
    <div>
      <div class="title">CarSense <span>AI</span></div>
      <div class="subtitle">
        Connected Vehicle Telematics &amp; AI Diagnostic Copilot. Translates cryptic OBD-II freeze-frame data into plain-English root causes &amp; safety triage.
      </div>
      <div class="metrics-pills mono">
        <div class="pill">
          <div class="num">100.0%</div>
          <div class="lbl">24-Case Benchmark</div>
        </div>
        <div class="pill">
          <div class="num" style="color:#06b6d4">&lt;0.25ms</div>
          <div class="lbl">PID Correlation</div>
        </div>
        <div class="pill">
          <div class="num" style="color:#f59e0b">$222</div>
          <div class="lbl">Avg Repair Saved</div>
        </div>
      </div>
    </div>

    <div class="telemetry-art">
      <div class="art-header mono">
        <span style="color:#06b6d4;font-weight:700;font-size:14px">FREEZE-FRAME CORRELATOR</span>
        <span class="mil-tag">DTC P0171</span>
      </div>
      <div class="gauge-row mono">
        <div class="mini-gauge">
          <div class="g-label">FUEL TRIM (STFT)</div>
          <div class="g-val" style="color:#f59e0b">+24.8%</div>
        </div>
        <div class="mini-gauge">
          <div class="g-label">MASS AIR FLOW</div>
          <div class="g-val" style="color:#06b6d4">1.7 g/s</div>
        </div>
        <div class="mini-gauge">
          <div class="g-label">ENGINE SPEED</div>
          <div class="g-val" style="color:#fff">700 rpm</div>
        </div>
        <div class="mini-gauge">
          <div class="g-label">SYSTEM VOLTAGE</div>
          <div class="g-val" style="color:#10b981">13.8 V</div>
        </div>
      </div>
      <div class="verdict-strip">
        <div class="v-head mono">AI ROOT CAUSE SYNTHESIS (68% CONFIDENCE)</div>
        <div class="v-body">Post-MAF Intake Vacuum Leak ($28 PCV Hose)</div>
      </div>
    </div>
  </div>

  <div class="bottom-bar mono">
    <span>TAKE CONTROL OF WHAT AI CAN DO // VEHICLE TELEMATICS</span>
    <span style="color:#06b6d4">remote-control-ai.vercel.app</span>
  </div>
</body>
</html>`;

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Render bespoke 1200x800 (3:2) Thumbnail
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(THUMBNAIL_HTML, { waitUntil: 'load' });
  await page.screenshot({ path: 'submission/assets/thumbnail.png' });
  console.log('Generated submission/assets/thumbnail.png (1200x800, 3:2)');

  // 2. Render 3:2 (1200x800) gallery images from source PNGs by framing them cleanly on #080a0f canvas
  const gallerySources = [
    { src: 'evidence/stage-4-demo/qa/frame-5.png', out: 'submission/assets/01-cockpit-overview.png' },
    { src: 'evidence/stage-4-demo/slides/slide-1-problem.png', out: 'submission/assets/02-problem-vs-solution.png' },
    { src: 'evidence/stage-4-demo/slides/slide-2-architecture.png', out: 'submission/assets/03-system-architecture.png' },
    { src: 'evidence/stage-4-demo/qa/frame-52.png', out: 'submission/assets/04-critical-misfire-mechanic.png' },
    { src: 'evidence/stage-4-demo/slides/slide-3-benchmark.png', out: 'submission/assets/05-validation-benchmark.png' },
  ];

  for (const item of gallerySources) {
    const b64 = fs.readFileSync(item.src).toString('base64');
    const wrapperHtml = `<!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 1200px; height: 800px;
          background: #080a0f;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        img {
          max-width: 100%; max-height: 100%;
          border-radius: 12px;
          border: 2px solid #1e293b;
          box-shadow: 0 20px 50px rgba(0,0,0,0.7);
        }
      </style>
    </head>
    <body>
      <img src="data:image/png;base64,${b64}" />
    </body>
    </html>`;
    await page.setContent(wrapperHtml, { waitUntil: 'load' });
    await page.screenshot({ path: item.out });
    console.log(`Generated ${item.out} (1200x800, 3:2)`);
  }

  await browser.close();

  // 3. Copy demo.mp4 into submission/assets/demo.mp4
  fs.copyFileSync('evidence/stage-4-demo/demo.mp4', 'submission/assets/demo.mp4');
  console.log('Copied evidence/stage-4-demo/demo.mp4 -> submission/assets/demo.mp4');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
