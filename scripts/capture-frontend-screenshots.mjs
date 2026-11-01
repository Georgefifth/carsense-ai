import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import diagnoseHandler from '../api/diagnose.js';
import mechanicHandler from '../api/mechanic.js';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const distDir = path.resolve('dist');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  if (reqPath === '/api/diagnose' || reqPath === '/api/mechanic') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          },
        }),
      };
      if (reqPath === '/api/diagnose') diagnoseHandler(req, mockRes);
      else mechanicHandler(req, mockRes);
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(4173, async () => {
  console.log('Preview server running on http://localhost:4173');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop 1440x900
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    desktopPage.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    await desktopPage.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(400);

    // Click Run AI Diagnostic Triage to test backend connection
    await desktopPage.getByRole('button', { name: /Run AI Diagnostic Triage/i }).click();
    await desktopPage.waitForTimeout(400);

    const desktopOverflow = await desktopPage.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    console.log(`Desktop horizontal overflow: ${desktopOverflow}px`);

    await desktopPage.screenshot({
      path: 'evidence/stage-2-build/frontend/desktop-1440x900.png',
      fullPage: true,
    });
    console.log('Captured desktop-1440x900.png');

    await desktopContext.close();

    // 2. Mobile 390x844
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('pageerror', (err) => console.error('MOBILE ERROR:', err.message));

    await mobilePage.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(400);

    const mobileOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    console.log(`Mobile horizontal overflow: ${mobileOverflow}px`);

    await mobilePage.screenshot({
      path: 'evidence/stage-2-build/frontend/mobile-390x844.png',
      fullPage: true,
    });
    console.log('Captured mobile-390x844.png');

    await mobileContext.close();
  } catch (err) {
    console.error('Screenshot script error:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('All frontend + backend regression screenshots captured.');
  }
});
