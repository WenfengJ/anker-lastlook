import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/flink/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const outDir = "docs/submission-preselection/assets";
const url = "https://13-57-166-217.sslip.io/lastlook/";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1
});

await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/lastlook-home.png`, fullPage: true });

for (const scenario of ["confirmed", "uncertain", "abnormal"]) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click(`[data-scenario="${scenario}"]`);
  await page.click("#startCheck");
  await page.waitForSelector("#resultPanel:not(.hidden)", { timeout: 8000 });
  await page.screenshot({ path: `${outDir}/lastlook-${scenario}.png`, fullPage: true });
}

await browser.close();
