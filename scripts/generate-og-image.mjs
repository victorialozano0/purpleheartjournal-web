import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateOgImage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 630 });

  const htmlPath = path.join(__dirname, 'og-image.html');
  await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`);

  // Wait for fonts to load
  await page.waitForTimeout(2000);

  const outputPath = path.join(__dirname, '..', 'public', 'og-image.jpg');
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 92,
  });

  console.log(`OG image saved to: ${outputPath}`);
  await browser.close();
}

generateOgImage().catch(console.error);
