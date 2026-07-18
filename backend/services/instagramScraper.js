import fs from "fs";
import path from "path";

import { chromium } from "playwright";

import { IMAGES_DIR } from "../utils/db.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Delay between scraping consecutive profiles. Shared by any caller that
// loops over multiple usernames (bulk import, the "refresh all photos"
// job) so there's a single place to tune it.
export const SCRAPE_DELAY_MS = 1500;

// How long a single profile's whole scrape+download is allowed to take
// before we give up on it and move on. Without this, a single hung
// request (network stall, a page that never finishes loading, an
// unresponsive popup) can silently freeze the entire batch — which is
// exactly what caused the frontend's ECONNRESET when the previous
// scraper attempt got stuck.
const PER_PROFILE_TIMEOUT_MS = 45000;
const FETCH_TIMEOUT_MS = 20000;

// Instagram actually serves user-uploaded photos (profile pics, posts,
// etc.) from these CDN domains. Any image we find that ISN'T hosted on
// one of these is not a real profile photo — it's almost certainly a
// decorative image from a cookie-consent wall or login wall that we
// grabbed by mistake.
const VALID_IMAGE_HOST_PATTERN = /cdninstagram\.com|fbcdn\.net/i;

/**
 * Launches a single browser instance meant to be reused across every
 * profile in an import batch. Call closeBrowser() when done.
 */
export async function launchBrowser() {
  return chromium.launch({ headless: true });
}

export async function closeBrowser(browser) {
  if (browser) await browser.close();
}

/**
 * Best-effort dismissal of the EU/GDPR cookie consent dialog Meta shows
 * to logged-out visitors browsing from the EU. Without this, the
 * consent overlay sits on top of the page — and since it contains its
 * own decorative image, grabbing "whatever image is on the page" ends
 * up downloading THAT instead of the profile photo. Silently does
 * nothing if the dialog isn't there or uses different wording.
 */
async function dismissCookieBanner(page) {
  const buttonTexts = [
    "Allow all cookies",
    "Accept all",
    "Permitir todas las cookies",
    "Aceptar todas",
    "Aceptar todo"
  ];

  for (const text of buttonTexts) {
    try {
      await page
        .getByRole("button", { name: text, exact: false })
        .click({ timeout: 1500 });
      return true;
    } catch {
      // Not present with this wording — try the next one.
    }
  }

  return false;
}

/**
 * Finds the public profile photo URL for a username using an
 * already-open browser instance.
 */
async function findProfilePhotoUrl(browser, username) {
  const page = await browser.newPage({ userAgent: USER_AGENT });

  // The consent flow (and some interstitials) can open in a second
  // popup window instead of an in-page modal. Auto-close those so they
  // can't leave the scrape silently stuck waiting on something we never
  // interact with.
  page.context().on("page", (popup) => {
    popup.close().catch(() => {});
  });

  // A native confirm()/alert() would otherwise hang the page forever
  // waiting for a response nothing will ever give it.
  page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));

  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    if (page.url().includes("/accounts/login")) {
      throw new Error("Instagram redirected to a login wall");
    }

    await dismissCookieBanner(page);
    await page.waitForTimeout(2000);

    if (page.url().includes("/accounts/login")) {
      throw new Error("Instagram redirected to a login wall");
    }

    // og:image is server-rendered specifically for this profile, unlike
    // "the first <img> on the page" which can match a cookie-banner or
    // login-wall graphic instead of the actual profile photo.
    return await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      return meta?.content || null;
    });
  } finally {
    await page.close();
  }
}

/**
 * Downloads image bytes from `url` and saves them to
 * data/images/<username>.<ext>. Returns the relative path (e.g.
 * "images/someuser.jpg") to store in the DB, or throws if the URL
 * doesn't look like a real profile photo, the download stalls past
 * FETCH_TIMEOUT_MS, or the download fails outright.
 */
async function downloadImage(url, username) {
  if (!VALID_IMAGE_HOST_PATTERN.test(url)) {
    throw new Error(
      `Rejected image from unexpected host (likely a consent/login wall graphic, not a profile photo): ${url}`
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Image download timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const filename = `${username}.${ext}`;
  const filePath = path.join(IMAGES_DIR, filename);

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return `images/${filename}`;
}

function withTimeout(promise, ms, message) {
  // If `promise` loses the race below (the timeout fires first) but
  // later rejects anyway, that rejection would otherwise have no
  // handler attached to it — an "unhandled promise rejection", which
  // crashes the whole Node process by default. Attaching a no-op catch
  // directly to the original promise marks it as handled regardless of
  // what happens to the race.
  promise.catch(() => {});

  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

/**
 * Scrapes and downloads the profile photo for a single username using
 * an already-open browser. Returns { username, imagePath, error? }.
 * Never throws — failures are reported on the result so a batch import
 * can continue with the remaining usernames. The whole operation is
 * capped at PER_PROFILE_TIMEOUT_MS so one stuck profile can never
 * freeze the rest of a batch.
 */
export async function scrapeProfilePhoto(browser, username) {
  try {
    const task = (async () => {
      const photoUrl = await findProfilePhotoUrl(browser, username);

      if (!photoUrl) {
        return { username, imagePath: null, error: "No photo found" };
      }

      const imagePath = await downloadImage(photoUrl, username);
      return { username, imagePath };
    })();

    return await withTimeout(
      task,
      PER_PROFILE_TIMEOUT_MS,
      `Scraping ${username} timed out after ${PER_PROFILE_TIMEOUT_MS}ms`
    );
  } catch (err) {
    return { username, imagePath: null, error: err.message };
  }
}
