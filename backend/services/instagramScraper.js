import { chromium } from "playwright";

export async function scrapeProfilePhoto(username) {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector("img");
      return img?.src || null;
    });

    return {
      username,
      imageUrl
    };
  } catch (err) {
    return {
      username,
      imageUrl: null,
      error: err.message
    };
  } finally {
    await browser.close();
  }
}