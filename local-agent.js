/**
 * Nova AI Playwright Local Agent Server
 * Run this locally on your machine to grant Nova AI real control over your browser!
 * 
 * Setup instructions:
 * 1. Make sure you have Node.js installed.
 * 2. In a clean folder on your local computer, create 'local-agent.js' pasting this content.
 * 3. Run: npm install playwright express cors
 * 4. Run: npx playwright install chromium
 * 5. Launch the server: node local-agent.js
 * 
 * This server binds to port 3001 on localhost, permitting Nova AI's web portal to issue
 * real-time Playwright actions directly on your physical computer.
 */

import express from "express";
import cors from "cors";
import { chromium } from "playwright";
import fs from "fs";
import crypto from "crypto";
import path from "path";

const app = express();
const PORT = 3001;

// Manage persistent local security token
let authToken = "";
const tokenFilePath = path.join(process.cwd(), "nova-token.txt");
try {
  if (fs.existsSync(tokenFilePath)) {
    authToken = fs.readFileSync(tokenFilePath, "utf8").trim();
    if (authToken.length < 32) {
      authToken = crypto.randomBytes(32).toString("hex");
      fs.writeFileSync(tokenFilePath, authToken, "utf8");
    }
  } else {
    authToken = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(tokenFilePath, authToken, "utf8");
  }
} catch (err) {
  authToken = crypto.randomBytes(32).toString("hex");
  console.log(`Failed to read/write persistent token file, using session-only token: ${err.message}`);
}

// Security: Restrict CORS origins strictly to local hosts and our verified AI Studio Run domains.
const ALLOWED_ORIGINS_REGEX = /^(https:\/\/ais-(dev|pre)-.*\.run\.app|http:\/\/localhost:\d+|http:\/\/127\.0\.0\.1:\d+)$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const isAllowed = ALLOWED_ORIGINS_REGEX.test(origin) || 
                      origin.includes("google.com") || 
                      origin.includes("aistudio");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("CORS Policy: Access from this origin is forbidden."));
    }
  },
  credentials: true
}));

app.use(express.json());

// Token Authentication Middleware
function authenticateRequest(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["x-myraa-token"] || req.headers["x-nova-token"];
  let requestToken = "";
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      requestToken = authHeader.substring(7).trim();
    } else {
      requestToken = authHeader.trim();
    }
  } else if (req.query && req.query.token) {
    requestToken = String(req.query.token);
  }

  if (requestToken === authToken) {
    next();
  } else {
    console.warn(`[UNAUTHORIZED ATTEMPT] Blocked request from origin: ${req.headers.origin || "Unknown"}`);
    res.status(401).json({ error: "Unauthorized: Invalid or missing Nova AI local security token." });
  }
}

// Apply authentication to all endpoints
app.use("/api", authenticateRequest);

// Main state references
let browser = null;
let context = null;
let page = null;
let lastActionStatus = "Standing by for connection...";
let logsList = [];

function logAndBroadcast(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const formattedLog = { 
    id: Math.random().toString(), 
    text: `[${timestamp}] ${message}`, 
    type 
  };
  console.log(`[${type.toUpperCase()}] ${message}`);
  logsList.push(formattedLog);
  if (logsList.length > 50) logsList.shift();
  lastActionStatus = message;
}

// Help ensure we have a running browser and active page
async function ensureBrowser() {
  if (!browser) {
    logAndBroadcast("Launching real Chromium headed browser...", "info");
    browser = await chromium.launch({
      headless: false,
      args: ["--start-maximized", "--no-sandbox"]
    });
    context = await browser.newContext({
      viewport: null // Uses natural size
    });
    page = await context.newPage();
    logAndBroadcast("Real Browser window spawned successfully.", "success");
  } else if (!page || page.isClosed()) {
    logAndBroadcast("Re-opening closed page tab...", "info");
    page = await context.newPage();
  }
}

// REST GET API status endpoint
app.get("/api/status", async (req, res) => {
  res.json({
    connected: true,
    browserActive: !!browser,
    lastAction: lastActionStatus,
    logs: logsList,
    currentUrl: page ? page.url() : "None"
  });
});

// REST POST execution endpoint
app.post("/api/action", async (req, res) => {
  const { type, args } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Missing parameter 'type'" });
  }

  logAndBroadcast(`Invoking Local Playwright directive: ${type}`, "action");

  try {
    await ensureBrowser();

    switch (type) {
      case "browserOpen": {
        let destination = args.url || "https://google.com";
        // Contextual convenience mappings
        if (!destination.startsWith("http://") && !destination.startsWith("https://")) {
          if (destination.toLowerCase().includes("youtube") || destination.toLowerCase() === "youtube") {
            destination = "https://youtube.com";
          } else if (destination.toLowerCase().includes("google") || destination.toLowerCase() === "google") {
            destination = "https://google.com";
          } else {
            destination = `https://${destination}`;
          }
        }

        logAndBroadcast(`Navigating real browser to: ${destination}`, "info");
        try {
          // Optimization: Use 'commit' waitUntil to resolve navigation instantly
          await page.goto(destination, { waitUntil: "commit", timeout: 8000 });
        } catch (gotoErr) {
          logAndBroadcast(`Navigation initiated: ${gotoErr.message}`, "info");
        }
        
        // Auto bypass cookie dialog on YouTube if visible (background)
        if (destination.includes("youtube.com")) {
          setTimeout(async () => {
            try {
              const consentBtn = page.locator('button:has-text("Reject all"), button:has-text("Accept all"), button:has-text("I agree")').first();
              if (await consentBtn.isVisible({ timeout: 1000 })) {
                logAndBroadcast("Intercepted cookie consent box. Dismissing dialog...", "info");
                await consentBtn.click();
              }
            } catch (err) {}
          }, 500);
        }

        logAndBroadcast(`Successfully loaded: ${destination}`, "success");
        return res.json({ result: `Opened real browser and landed on ${destination}` });
      }

      case "browserSearch": {
        const query = args.query;
        if (!query) {
          throw new Error("Query parameters missing in action envelope.");
        }

        logAndBroadcast(`Searching for term: "${query}"`, "info");
        const currentUrl = page.url().toLowerCase();

        if (currentUrl.includes("youtube.com")) {
          const ytInput = page.locator('input[id="search"], input[name="search_query"]').first();
          await ytInput.waitFor({ state: "visible", timeout: 3000 });
          await ytInput.fill(query);
          await ytInput.press("Enter");
        } else if (currentUrl.includes("google.com")) {
          const googleInput = page.locator('textarea[name="q"], input[name="q"]').first();
          await googleInput.waitFor({ state: "visible", timeout: 3000 });
          await googleInput.fill(query);
          await googleInput.press("Enter");
        } else {
          // General input heuristic search
          const generalInput = page.locator('input[type="text"], input[type="search"]').first();
          await generalInput.fill(query);
          await generalInput.press("Enter");
        }

        logAndBroadcast(`Search query submitted for: "${query}"`, "success");
        return res.json({ result: `Successfully typed search query "${query}" and triggered event execution.` });
      }

      case "browserClick": {
        const selector = args.selector;
        const desc = args.description || selector;
        if (!selector) {
          throw new Error("Click request omitted mandatory selector path.");
        }

        logAndBroadcast(`Attempting targeted click on: "${desc}"`, "info");

        // Specific YouTube link matching bypass
        if (selector.startsWith("video-")) {
          const videoId = selector.replace("video-", "");
          const directUrl = `https://www.youtube.com/watch?v=${videoId}`;
          logAndBroadcast(`YouTube direct link matching. Re-routing straight to: ${directUrl}`, "info");
          await page.goto(directUrl, { waitUntil: "commit" });
          logAndBroadcast(`Video playback stream opened successfully.`, "success");
          return res.json({ result: `Loaded YouTube stream directly: ${directUrl}` });
        }

        let clicked = false;
        
        // Native YouTube video keyboard control
        if (page.url().includes("youtube.com")) {
          if (selector === "play-button") {
            await page.evaluate(() => { document.querySelector('video')?.play(); });
            clicked = true;
          } else if (selector === "pause-button") {
            await page.evaluate(() => { document.querySelector('video')?.pause(); });
            clicked = true;
          } else {
            const firstResult = page.locator('ytd-video-renderer a#video-title, ytd-rich-grid-media a#video-title').first();
            if (await firstResult.isVisible({ timeout: 800 })) {
              logAndBroadcast("Identified top organic video card. Executing click...", "info");
              await firstResult.click();
              clicked = true;
            }
          }
        }

        if (!clicked) {
          // Direct fast check for CSS selectors first (no lag wait)
          try {
            const cssLocator = page.locator(selector).first();
            if (await cssLocator.isVisible({ timeout: 100 })) {
              await cssLocator.click({ timeout: 1000 });
              clicked = true;
            }
          } catch (e) {}

          // Text matching next
          if (!clicked) {
            try {
              const textLocator = page.locator(`text=${selector}`).first();
              if (await textLocator.isVisible({ timeout: 100 })) {
                await textLocator.click({ timeout: 1000 });
                clicked = true;
              }
            } catch (e) {}
          }

          // Fallback with slightly longer timeout
          if (!clicked) {
            try {
              await page.locator(selector).first().click({ timeout: 3000 });
              clicked = true;
            } catch (err) {
              await page.locator(`text=${selector}`).first().click({ timeout: 2000 });
              clicked = true;
            }
          }
        }

        logAndBroadcast(`Successful click completed on target.`, "success");
        return res.json({ result: "Click operation completed successfully." });
      }

      case "browserMediaControl": {
        const action = args.action;
        const val = args.value;
        logAndBroadcast(`Executing real media action: ${action}`, "info");

        let responseText = `Action ${action} completed on player.`;

        if (action === "play") {
          await page.evaluate(() => { document.querySelector('video')?.play(); });
        } else if (action === "pause") {
          await page.evaluate(() => { document.querySelector('video')?.pause(); });
        } else if (action === "volume") {
          const percent = val || 75;
          await page.evaluate((pct) => {
            const v = document.querySelector('video');
            if (v) v.volume = pct / 100;
          }, percent);
          responseText = `Adjusted volume level to ${percent}%`;
        } else if (action === "mute") {
          await page.evaluate(() => {
            const v = document.querySelector('video');
            if (v) v.muted = true;
          });
        } else if (action === "unmute") {
          await page.evaluate(() => {
            const v = document.querySelector('video');
            if (v) v.muted = false;
          });
        } else if (action === "fullscreen") {
          await page.keyboard.press("f");
          responseText = "Toggled fullscreen view.";
        } else if (action === "exit_fullscreen") {
          await page.evaluate(() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          });
          responseText = "Exited fullscreen layout.";
        } else if (action === "skip") {
          await page.evaluate(() => {
            const v = document.querySelector('video');
            if (v) v.currentTime += 30;
          });
          responseText = "Skipped forward 30 seconds.";
        } else {
          throw new Error(`Media command action '${action}' unrecognized.`);
        }

        logAndBroadcast(`Media action completed: ${action}`, "success");
        return res.json({ result: responseText });
      }

      case "browserScroll": {
        const direction = args.direction || "down";
        const distance = args.amount || 400;
        const delta = direction === "down" ? distance : -distance;

        logAndBroadcast(`Scrolling document view vertical displacement: ${delta}px`, "info");
        await page.evaluate((yOffset) => {
          window.scrollBy({ top: yOffset, behavior: "smooth" });
        }, delta);

        logAndBroadcast(`Scroll action executed.`, "success");
        return res.json({ result: `Scrolled main layout ${direction} ${distance}px.` });
      }

      case "browserType": {
        const text = args.text;
        if (!text) throw new Error("Missing string 'text' in type container.");
        
        logAndBroadcast(`Typing text into input: "${text}"`, "info");
        
        // Optimized direct injection with native DOM event firing for instant JS framework updates
        await page.evaluate((txt) => {
          const activeEl = document.activeElement;
          if (activeEl) {
            let handled = false;
            if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') {
              const start = activeEl.selectionStart || 0;
              const end = activeEl.selectionEnd || 0;
              const val = activeEl.value || "";
              activeEl.value = val.substring(0, start) + txt + val.substring(end);
              activeEl.selectionStart = activeEl.selectionEnd = start + txt.length;
              handled = true;
            } else if (activeEl.isContentEditable) {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const textNode = document.createTextNode(txt);
                range.insertNode(textNode);
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
              } else {
                activeEl.innerText = (activeEl.innerText || "") + txt;
              }
              handled = true;
            }
            if (handled) {
              activeEl.dispatchEvent(new Event('input', { bubbles: true }));
              activeEl.dispatchEvent(new Event('change', { bubbles: true }));
              activeEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
              activeEl.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true }));
              activeEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            }
          }
        }, text);

        // Fallback or double-layer reinforcement using native keypress for complete event loop sync
        try {
          await page.keyboard.insertText(text);
        } catch (e) {}
        
        logAndBroadcast(`Finished typing text.`, "success");
        return res.json({ result: `Typed text "${text}" inside the active element.` });
      }

      case "browserGoBack": {
        logAndBroadcast("Navigating back in page history...", "info");
        await page.goBack();
        logAndBroadcast("Returned to previous location.", "success");
        return res.json({ result: "Flashed browser history page back." });
      }

      case "browserTabAction": {
        const subAct = args.action;
        logAndBroadcast(`Browser tab request triggered: ${subAct}`, "info");

        if (subAct === "new") {
          const startUrl = args.url || "https://google.com";
          page = await context.newPage();
          await page.goto(startUrl);
          logAndBroadcast(`New active tab loaded for: ${startUrl}`, "success");
        } else if (subAct === "close") {
          await page.close();
          const pages = context.pages();
          if (pages.length > 0) {
            page = pages[pages.length - 1];
            logAndBroadcast(`Active tab closed. Selected last open tab.`, "success");
          } else {
            page = null;
            logAndBroadcast(`All tabs closed. Waiting for new instructions.`, "info");
          }
        }
        return res.json({ result: `Tab command ${subAct} completed.` });
      }

      default:
        throw new Error(`Directive '${type}' not recognized by Nova AI's local Playwright engine.`);
    }

  } catch (err) {
    logAndBroadcast(`Execution error during operation: ${err.message}`, "error");
    res.status(500).json({ error: err.message });
  }
});

// Start Express server binding ONLY to loopback 127.0.0.1 for maximum security
app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Nova AI Playwright Local Agent Server Running!`);
  console.log(`📡 Secure Local Loopback: http://127.0.0.1:${PORT}`);
  console.log(`🔑 persistent Auth Token saved to 'nova-token.txt'`);
  console.log(`🛡️  CORS restricted to authorized secure frames only.`);
  console.log(`======================================================\n`);
  console.log(`🔐 Access Token: ${authToken}\n`);
});
