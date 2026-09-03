import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runPlaywrightAudit(url, name) {
  console.log(`\n========================================`);
  console.log(`Running Playwright Audit for: ${url} (${name})`);
  console.log(`========================================`);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  const networkRequests = [];
  const consoleMessages = [];

  page.on('request', (req) => {
    networkRequests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });

  page.on('response', async (res) => {
    const req = networkRequests.find(r => r.url === res.url());
    if (req) {
      req.status = res.status();
      try {
        const headers = res.headers();
        req.contentLength = headers['content-length'] || 0;
      } catch (e) {}
    }
  });

  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  const startTime = Date.now();
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  const loadDuration = Date.now() - startTime;

  // Performance metrics via Navigation Timing & Performance API
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const fp = paint.find(p => p.name === 'first-paint');

    return {
      title: document.title,
      domNodes: document.querySelectorAll('*').length,
      dnsTime: nav ? nav.domainLookupEnd - nav.domainLookupStart : 0,
      tcpHandshake: nav ? nav.connectEnd - nav.connectStart : 0,
      ttfb: nav ? nav.responseStart - nav.requestStart : 0,
      domInteractive: nav ? nav.domInteractive - nav.startTime : 0,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
      loadEvent: nav ? nav.loadEventEnd - nav.startTime : 0,
      firstPaint: fp ? fp.startTime : null,
      firstContentfulPaint: fcp ? fcp.startTime : null,
    };
  });

  const screenshotPath = path.resolve(`./playwright-${name}-screenshot.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Page Title: "${metrics.title}"`);
  console.log(`HTTP Status: ${response.status()}`);
  console.log(`Total Requests: ${networkRequests.length}`);
  console.log(`Total Load Duration (network idle): ${loadDuration}ms`);
  console.log(`TTFB: ${metrics.ttfb.toFixed(2)}ms`);
  console.log(`First Paint: ${metrics.firstPaint ? metrics.firstPaint.toFixed(2) + 'ms' : 'N/A'}`);
  console.log(`First Contentful Paint (FCP): ${metrics.firstContentfulPaint ? metrics.firstContentfulPaint.toFixed(2) + 'ms' : 'N/A'}`);
  console.log(`DOMContentLoaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
  console.log(`Load Event: ${metrics.loadEvent.toFixed(2)}ms`);
  console.log(`DOM Elements Count: ${metrics.domNodes}`);
  console.log(`Screenshot saved to: ${screenshotPath}`);

  if (consoleMessages.length > 0) {
    console.log(`\nConsole Messages (${consoleMessages.length}):`);
    consoleMessages.forEach(c => console.log(`  [${c.type.toUpperCase()}] ${c.text}`));
  }

  // Summary of largest requests
  console.log(`\nTop Network Requests:`);
  networkRequests.slice(0, 10).forEach(r => {
    console.log(`  ${r.method} [${r.status || 'pending'}] (${r.resourceType}) ${r.url.slice(0, 80)}`);
  });

  await browser.close();
  return { metrics, networkRequests, consoleMessages, loadDuration };
}

async function main() {
  await runPlaywrightAudit('http://localhost:5173/', 'dev-server');
  try {
    await runPlaywrightAudit('http://localhost:4173/', 'preview-server');
  } catch (e) {
    console.log('Preview server audit note:', e.message);
  }
}

main().catch(console.error);
