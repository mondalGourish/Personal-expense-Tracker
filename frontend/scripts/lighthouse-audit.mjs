import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

async function runAudit(url, name, preset = 'desktop') {
  console.log(`\n========================================`);
  console.log(`Running Lighthouse Audit: ${url} [${name}] (Preset: ${preset.toUpperCase()})`);
  console.log(`========================================`);

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const config = preset === 'desktop' ? {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      }
    }
  } : undefined;

  let runnerResult;
  try {
    runnerResult = await lighthouse(url, options, config);
  } finally {
    try {
      await chrome.kill();
    } catch (e) {
      // Ignore temporary process kill error on Windows
    }
  }

  const report = runnerResult.lhr;

  const perfScore = report.categories.performance ? Math.round(report.categories.performance.score * 100) : 0;
  const a11yScore = report.categories.accessibility ? Math.round(report.categories.accessibility.score * 100) : 0;
  const bpScore = report.categories['best-practices'] ? Math.round(report.categories['best-practices'].score * 100) : 0;
  const seoScore = report.categories.seo ? Math.round(report.categories.seo.score * 100) : 0;

  console.log(`\n--- SCORES: ${name} (${preset.toUpperCase()}) ---`);
  console.log(`Performance:    ${perfScore} / 100  ${perfScore >= 80 ? '✅ (PASS 80+)' : '❌'}`);
  console.log(`Accessibility:  ${a11yScore} / 100`);
  console.log(`Best Practices: ${bpScore} / 100`);
  console.log(`SEO:            ${seoScore} / 100`);

  console.log(`\n--- KEY WEB VITALS ---`);
  const audits = report.audits;
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
  ];

  metrics.forEach(m => {
    if (audits[m]) {
      console.log(`  ${audits[m].title}: ${audits[m].displayValue} (score: ${audits[m].score})`);
    }
  });

  try {
    fs.writeFileSync(`./lighthouse-${name}-${preset}-result.json`, JSON.stringify(report, null, 2));
  } catch (e) {}

  return { name, preset, perfScore, a11yScore, bpScore, seoScore, audits };
}

async function main() {
  const results = [];
  
  console.log('\n>>> AUDITING PRODUCTION PREVIEW SERVER (http://localhost:4173/) <<<');
  results.push(await runAudit('http://localhost:4173/', 'preview', 'desktop'));
  results.push(await runAudit('http://localhost:4173/', 'preview', 'mobile'));

  console.log('\n>>> AUDITING DEV SERVER (http://localhost:5173/) <<<');
  results.push(await runAudit('http://localhost:5173/', 'dev', 'desktop'));
  results.push(await runAudit('http://localhost:5173/', 'dev', 'mobile'));

  console.log(`\n========================================`);
  console.log(`FINAL PERFORMANCE AUDIT SUMMARY TABLE`);
  console.log(`========================================`);
  console.table(results.map(r => ({
    Environment: r.name,
    Preset: r.preset,
    'Performance (Score)': `${r.perfScore}/100`,
    'Pass 80+': r.perfScore >= 80 ? 'YES ✅' : 'NO',
    Accessibility: `${r.a11yScore}/100`,
    'Best Practices': `${r.bpScore}/100`,
    SEO: `${r.seoScore}/100`
  })));
}

main().catch(console.error);
