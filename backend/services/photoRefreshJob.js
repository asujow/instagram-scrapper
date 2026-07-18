import { readDB, writeDB } from "../utils/db.js";
import {
  launchBrowser,
  closeBrowser,
  scrapeProfilePhoto,
  SCRAPE_DELAY_MS
} from "./instagramScraper.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialState() {
  return {
    running: false,
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    currentUsername: null,
    startedAt: null,
    finishedAt: null,
    error: null
  };
}

// Single in-memory job state. This is a personal single-user tool running
// one Node process, so there's no need for a job queue/database — this
// is intentionally simple and resets if the server restarts.
let state = initialState();

export function getPhotoRefreshStatus() {
  return { ...state };
}

/**
 * Starts a background job that (re-)downloads the profile photo for a
 * set of usernames — either an explicit list (e.g. just the profiles a
 * fresh import added) or, if omitted, every profile currently in the
 * DB. Returns false without doing anything if a job is already running
 * (call getPhotoRefreshStatus() to see it).
 */
export function startPhotoRefresh(usernames) {
  if (state.running) return false;

  const targetUsernames = usernames ?? readDB().profiles.map((p) => p.username);

  state = {
    ...initialState(),
    running: true,
    total: targetUsernames.length,
    startedAt: new Date().toISOString()
  };

  // Intentionally not awaited — this runs in the background while the
  // HTTP request that triggered it returns immediately. Progress is
  // exposed via getPhotoRefreshStatus() for polling.
  runJob(targetUsernames)
    .catch((err) => {
      state.error = err.message;
    })
    .finally(() => {
      state.running = false;
      state.finishedAt = new Date().toISOString();
      state.currentUsername = null;
    });

  return true;
}

async function runJob(usernames) {
  if (!usernames.length) return;

  const browser = await launchBrowser();

  try {
    for (const username of usernames) {
      state.currentUsername = username;

      const result = await scrapeProfilePhoto(browser, username);

      // Re-read the DB fresh on every iteration (instead of once at the
      // start) so this doesn't clobber tag edits or new imports a user
      // makes elsewhere in the app while a long refresh is running.
      const db = readDB();
      const profile = db.profiles.find((p) => p.username === username);

      if (result.imagePath) {
        if (profile) profile.imagePath = result.imagePath;
        state.succeeded++;
      } else {
        console.error(`Photo refresh failed for ${username}:`, result.error);
        state.failed++;
      }

      writeDB(db);
      state.completed++;

      await delay(SCRAPE_DELAY_MS);
    }
  } finally {
    await closeBrowser(browser);
  }
}
