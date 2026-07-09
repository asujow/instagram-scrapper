import { chromium } from "playwright";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * Scrapes the public profile photo for a single Instagram username.
 *
 * NOTE: this is not currently wired into any route (import stays fast
 * and doesn't hit Instagram). It launches its own browser per call, which
 * is fine for occasional manual use, but if this gets wired into bulk
 * import later, reuse a single browser instance across usernames and add
 * a delay between requests instead of calling this in a tight loop —
 * Instagram will start blocking a fresh headless browser per request.
 */
export async function scrapeProfilePhoto(username) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });

    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector("img");
      return img?.src || null;
    });

    return { username, imageUrl };
  } catch (err) {
    return { username, imageUrl: null, error: err.message };
  } finally {
    await browser.close();
  }
}
