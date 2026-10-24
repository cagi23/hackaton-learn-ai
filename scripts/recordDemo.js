import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const recordingsDir = path.join(rootDir, 'recordings');

// MIME types dictionary for static file server
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 1. Create a minimal static HTTP server for the built application
function startServer(port = 5173) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
      }

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(port, () => {
      console.log(`[Demo Agent] Server running at http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

// 2. Main demo recording agent
async function recordDemo() {
  console.log('[Demo Agent] Starting ReviewLens Demo Recording Agent...');

  if (!fs.existsSync(distDir)) {
    console.error('[Demo Agent] Error: dist/ directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  fs.mkdirSync(recordingsDir, { recursive: true });

  const port = 5173;
  let server;
  try {
    server = await startServer(port);
  } catch (err) {
    console.warn(`[Demo Agent] Port ${port} occupied, attempting port 5174...`);
    server = await startServer(5174);
  }

  const serverPort = server.address().port;
  const targetUrl = `http://localhost:${serverPort}`;

  // Find Chrome executable path
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const launchOptions = {
    headless: true,
  };
  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  console.log('[Demo Agent] Launching Google Chrome browser...');
  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Helper to inject a visible animated mouse cursor
  async function setupVisualCursor() {
    await page.evaluate(() => {
      const cursor = document.createElement('div');
      cursor.id = 'demo-virtual-cursor';
      cursor.style.position = 'fixed';
      cursor.style.width = '24px';
      cursor.style.height = '24px';
      cursor.style.borderRadius = '50%';
      cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.85)';
      cursor.style.border = '2.5px solid #ffffff';
      cursor.style.boxShadow = '0 0 16px rgba(99, 102, 241, 1), 0 0 4px rgba(255, 255, 255, 0.8)';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.15s ease';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.top = '120px';
      cursor.style.left = '150px';
      document.body.appendChild(cursor);

      // Ripple animation on click
      window.createClickRipple = (x, y) => {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '12px';
        ripple.style.height = '12px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '3px solid #818cf8';
        ripple.style.transform = 'translate(-50%, -50%) scale(1)';
        ripple.style.opacity = '1';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999998';
        ripple.style.transition = 'transform 0.5s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.5s ease';
        document.body.appendChild(ripple);

        requestAnimationFrame(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(5)';
          ripple.style.opacity = '0';
        });

        setTimeout(() => ripple.remove(), 600);
      };
    });
  }

  // Smooth human-like cursor movement and click helper
  async function humanClick(selector, options = {}) {
    const element = await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    const box = await element.boundingBox();
    if (!box) return;

    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    // Smoothly animate the virtual cursor to target
    await page.evaluate(({ x, y }) => {
      const cursor = document.getElementById('demo-virtual-cursor');
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    }, { x: targetX, y: targetY });

    await page.waitForTimeout(options.preDelay || 700);

    // Trigger click ripple
    await page.evaluate(({ x, y }) => {
      if (window.createClickRipple) window.createClickRipple(x, y);
    }, { x: targetX, y: targetY });

    await element.click();
    await page.waitForTimeout(options.postDelay || 800);
  }

  // Smooth scroll helper
  async function smoothScroll(distance, duration = 800) {
    await page.evaluate(({ dist }) => {
      window.scrollBy({ top: dist, behavior: 'smooth' });
    }, { dist: distance });
    await page.waitForTimeout(duration);
  }

  console.log(`[Demo Agent] Navigating to ${targetUrl}...`);
  await page.goto(targetUrl);
  await page.waitForLoadState('networkidle');
  await setupVisualCursor();

  // --- DEMO SCENARIO (MATCHING DEMO.MD) ---

  // Phase 1: Intro & Initial Dashboard
  console.log('[Demo Agent] 1. Initial Overview & Skill Dashboard...');
  await page.waitForTimeout(2500);

  // Phase 2: Load Demo Example
  console.log('[Demo Agent] 2. Clicking "Load Demo Example"...');
  await humanClick('button:has-text("Load Demo Example")', { postDelay: 1500 });
  await page.waitForTimeout(1000);

  // Phase 3: Review My Code
  console.log('[Demo Agent] 3. Clicking "Review My Code"...');
  await humanClick('button:has-text("Review My Code")', { postDelay: 500 });

  // Phase 4: Loading State inspection
  console.log('[Demo Agent] 4. Showing animated domain loading pipeline...');
  try {
    await page.waitForSelector('text=Reviewing your code', { state: 'visible', timeout: 3000 });
    await page.waitForTimeout(1800);
  } catch (e) {
    console.log('[Demo Agent] Loading stage progressed quickly');
  }

  // Phase 5: Findings List & Summary
  console.log('[Demo Agent] 5. Exploring findings summary and cards...');
  await page.waitForSelector('text=REVIEW COMPLETE', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(2500);

  // Phase 6: Explore Finding 1 (Null Safety / Undefined Access)
  console.log('[Demo Agent] 6. Clicking "Explore Issue" on Possible undefined access...');
  await humanClick('button:has-text("Explore Issue"):first-of-type', { postDelay: 1500 });

  // Phase 7: Pedagogy Showcase (Why Does This Matter? & Principle)
  console.log('[Demo Agent] 7. Deep-dive into "WHY DOES THIS MATTER?" & "ENGINEERING PRINCIPLE"...');
  await page.waitForSelector('text=WHY DOES THIS MATTER?', { state: 'visible', timeout: 5000 });
  await smoothScroll(250, 1000);
  await page.waitForTimeout(2500); // Allow reading "Why Does This Matter?"

  await smoothScroll(300, 1000);
  await page.waitForTimeout(2500); // Allow reading "Engineering Principle" & Diff

  // Phase 8: Trigger Challenge Me
  console.log('[Demo Agent] 8. Activating "Challenge Me"...');
  await humanClick('button:has-text("Challenge Me")', { postDelay: 1500 });

  // Phase 9: Answer Challenge Quiz
  console.log('[Demo Agent] 9. Interactive Deliberate Practice Quiz...');
  await page.waitForSelector('text=Deliberate Practice Challenge', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(2000); // Reading the question

  // Click correct answer option (Option A)
  console.log('[Demo Agent] 10. Selecting Option A...');
  await humanClick('button:has-text("targetItem?.quantity ?? 0")', { postDelay: 1000 });

  // Click Check Answer
  console.log('[Demo Agent] 11. Submitting answer via "Check Answer"...');
  await humanClick('button:has-text("Check Answer")', { postDelay: 1500 });

  // Phase 10: Feedback & Skill Delta
  console.log('[Demo Agent] 12. Observing "Correct!" feedback and score delta (+3)...');
  await page.waitForSelector('text=Correct! Well Done', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(3000); // View celebration & explanation

  // Click Continue Reviewing to close modal
  console.log('[Demo Agent] 13. Closing challenge modal...');
  await humanClick('button:has-text("Continue Reviewing")', { postDelay: 1000 });

  // Phase 11: Return to Dashboard & Highlight Skill Increase
  console.log('[Demo Agent] 14. Returning to Skill Dashboard to highlight updated scores...');
  await smoothScroll(-800, 1200);
  await page.waitForTimeout(4000); // Final showcase frame

  console.log('[Demo Agent] Demo recording complete! Finalizing video file...');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();
  server.close();

  if (video) {
    const rawVideoPath = await video.path();
    const finalVideoPath = path.join(recordingsDir, 'reviewlens-demo.webm');
    if (fs.existsSync(finalVideoPath)) {
      fs.unlinkSync(finalVideoPath);
    }
    fs.renameSync(rawVideoPath, finalVideoPath);
    console.log(`\n======================================================`);
    console.log(`🎉 DEMO VIDEO GENERATED SUCCESSFULLY!`);
    console.log(`📹 Video file saved at: ${finalVideoPath}`);
    const stats = fs.statSync(finalVideoPath);
    console.log(`📦 Video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`======================================================\n`);
  } else {
    console.warn('[Demo Agent] Warning: No video handle captured.');
  }
}

recordDemo().catch((err) => {
  console.error('[Demo Agent] Error executing demo recording:', err);
  process.exit(1);
});
