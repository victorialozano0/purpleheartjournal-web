import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'public', 'journal');
const pdfPath = 'C:/Users/victo/Documents/LoveYourselfJournal/Web/flipbook/Love Yourself Journal para ARMY - Primeras páginas.pdf';
const MAX_PAGES = 12;
// Only visual/attractive pages — skip text-heavy pages
const PAGES_TO_RENDER = [2, 7, 9, 10, 12, 13, 14, 16, 18, 20];

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const html = `<!DOCTYPE html>
<html><head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs" type="module"></script>
</head><body>
<canvas id="canvas"></canvas>
<script type="module">
const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

window.renderPage = async function(data, pageNum) {
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 3.0 });
  const canvas = document.getElementById('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { width: canvas.width, height: canvas.height, pages: doc.numPages };
};
window.pdfReady = true;
</script></body></html>`;

async function run() {
  const pdfData = fs.readFileSync(pdfPath);
  const base64 = pdfData.toString('base64');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(html);
  await page.waitForFunction('window.pdfReady === true', { timeout: 15000 });

  // Get total pages
  const info = await page.evaluate(async (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return await window.renderPage(bytes, 1);
  }, base64);

  console.log(`PDF has ${info.pages} pages, converting ${PAGES_TO_RENDER.length} selected pages at 3x scale...`);

  for (let idx = 0; idx < PAGES_TO_RENDER.length; idx++) {
    const pdfPage = PAGES_TO_RENDER[idx];
    await page.evaluate(async (args) => {
      const { b64, pageNum } = args;
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
      await window.renderPage(bytes, pageNum);
    }, { b64: base64, pageNum: pdfPage });

    const canvas = page.locator('#canvas');
    const filename = `page-${String(idx + 1).padStart(2, '0')}.webp`;
    await canvas.screenshot({
      path: path.join(outputDir, filename),
      type: 'png',
    });

    const size = fs.statSync(path.join(outputDir, filename)).size;
    console.log(`  PDF page ${pdfPage} → ${filename} (${Math.round(size / 1024)} KB)`);
  }

  await browser.close();
  console.log(`\nDone! Images saved to ${outputDir}`);
}

run().catch(console.error);
