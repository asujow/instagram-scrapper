import { spawn } from "child_process";
import fs from "fs";

import { IMAGES_DIR } from "../utils/db.js";

// Delay between scraping consecutive profiles, so requests to Instagram
// aren't sent back-to-back. Shared by any caller that loops over
// multiple usernames (bulk import, the "refresh all photos" job).
export const SCRAPE_DELAY_MS = 1500;

// Instaloader (https://github.com/instaloader/instaloader) is an
// external, actively-maintained, open-source tool — used here instead
// of a hand-rolled browser scraper. It's a Python package, invoked as a
// module so this only depends on Python being on PATH, not on
// Instaloader's own console-script wrapper (which pip doesn't always
// put on PATH, especially on Windows).
const PYTHON_CANDIDATES = ["python", "python3"];

function buildArgs(username) {
  return [
    "-m",
    "instaloader",
    "--no-posts",
    "--no-metadata-json",
    "--no-compress-json",
    "--quiet",
    `--dirname-pattern=${IMAGES_DIR}`,
    "--title-pattern={profile}",
    "--",
    username
  ];
}

function runOnce(pythonCmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonCmd, args);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(err); // err.code === "ENOENT" means pythonCmd itself wasn't found
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const message = stderr.trim();

        if (message.includes("No module named")) {
          reject(
            new Error(
              "Instaloader isn't installed for this Python. Install it with: pip install instaloader"
            )
          );
        } else {
          reject(new Error(message || `instaloader exited with code ${code}`));
        }

        return;
      }

      resolve();
    });
  });
}

async function runInstaloader(username) {
  const args = buildArgs(username);
  let lastEnoent;

  for (const pythonCmd of PYTHON_CANDIDATES) {
    try {
      await runOnce(pythonCmd, args);
      return;
    } catch (err) {
      if (err.code === "ENOENT") {
        lastEnoent = err;
        continue; // try the next python candidate
      }

      throw err; // python was found but instaloader itself failed — surface as-is
    }
  }

  throw new Error(
    `Could not find Python ("python" or "python3") on PATH. Install Python, then run: pip install instaloader. (${lastEnoent?.message})`
  );
}

function findDownloadedFile(username) {
  const match = fs
    .readdirSync(IMAGES_DIR)
    .find((name) => name.startsWith(`${username}.`));

  return match ? `images/${match}` : null;
}

/**
 * Downloads the profile photo for a single username via Instaloader.
 * Returns { username, imagePath, error? }. Never throws — failures are
 * reported on the result so a batch can continue with the remaining
 * usernames.
 */
export async function scrapeProfilePhoto(username) {
  try {
    await runInstaloader(username);

    const imagePath = findDownloadedFile(username);

    if (!imagePath) {
      return {
        username,
        imagePath: null,
        error: "Instaloader ran but no profile picture file was found"
      };
    }

    return { username, imagePath };
  } catch (err) {
    return { username, imagePath: null, error: err.message };
  }
}
