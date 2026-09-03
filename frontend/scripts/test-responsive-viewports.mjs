import { chromium } from "playwright";

const viewports = [
  { name: "Mobile Small (320px)", width: 320, height: 568 },
  { name: "iPhone SE (375px)", width: 375, height: 667 },
  { name: "iPhone 12/13/14 (390px)", width: 390, height: 844 },
  { name: "iPhone Plus/Max (414px)", width: 414, height: 896 },
  { name: "iPad / Tablet Portrait (768px)", width: 768, height: 1024 },
  { name: "iPad / Tablet Landscape (1024px)", width: 1024, height: 768 },
  { name: "Desktop (1440px)", width: 1440, height: 900 },
];

async function run() {
  console.log("========================================");
  console.log("Testing Responsive Viewports via Playwright");
  console.log("========================================");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  let hasErrors = false;

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto("http://localhost:4173/login", { waitUntil: "networkidle" });

    // Check for unwanted horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalOverflow) {
      console.error(`  [FAIL] ${vp.name}: Horizontal overflow detected (scrollWidth > innerWidth)`);
      hasErrors = true;
    } else {
      console.log(`  [PASS] ${vp.name}: No horizontal overflow, rendered cleanly`);
    }

    await page.close();
  }

  await browser.close();

  if (hasErrors) {
    console.error("\n❌ Some responsive viewports failed!");
    process.exit(1);
  } else {
    console.log("\n✅ All responsive viewports PASSED with 0 horizontal overflow.");
  }
}

run().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
