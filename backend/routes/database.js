import express from "express";
import fs from "fs";
import path from "path";

import { writeDB, IMAGES_DIR } from "../utils/db.js";

const router = express.Router();

function clearImagesDir() {
  let files;

  try {
    files = fs.readdirSync(IMAGES_DIR);
  } catch {
    return;
  }

  for (const file of files) {
    if (file === ".gitkeep") continue;

    try {
      fs.unlinkSync(path.join(IMAGES_DIR, file));
    } catch (err) {
      console.error(`Could not delete ${file}:`, err.message);
    }
  }
}

// POST /api/database/reset — wipes every profile and tag, and deletes
// all downloaded photos. Irreversible. The frontend is expected to get
// explicit, unambiguous confirmation from the user before calling this
// — this route itself does not ask for any further confirmation.
router.post("/reset", (req, res) => {
  try {
    clearImagesDir();

    writeDB({
      profiles: [],
      tags: [],
      meta: { createdAt: new Date().toISOString() }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed resetting database" });
  }
});

export default router;
