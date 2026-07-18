import express from "express";

import { readDB, writeDB, normalizeImportedDB } from "../utils/db.js";
import { extractUsernames } from "../utils/extractUsernames.js";

const router = express.Router();

// POST /api/import — bulk import from pasted text or a .txt file.
// Just saves the profiles and responds — it does NOT download photos.
// Returns `newUsernames` so the frontend can ask the user whether to
// kick off a photo download for them (via
// POST /api/profiles/refresh-photos) as a separate, explicit step.
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid text input" });
    }

    const usernames = extractUsernames(text);

    if (!usernames.length) {
      return res.status(400).json({ error: "No valid usernames found" });
    }

    const db = readDB();
    const existing = new Set(db.profiles.map((p) => p.username));

    const newUsernames = [];

    for (const username of usernames) {
      if (existing.has(username)) continue;

      db.profiles.push({
        username,
        tags: [],
        imagePath: null,
        createdAt: new Date().toISOString()
      });

      existing.add(username);
      newUsernames.push(username);
    }

    writeDB(db);

    res.json({
      success: true,
      added: newUsernames.length,
      newUsernames,
      total: db.profiles.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Import failed" });
  }
});

// POST /api/import/json — replace the whole DB with an uploaded db.json
router.post("/json", (req, res) => {
  try {
    const normalized = normalizeImportedDB(req.body);

    if (!normalized) {
      return res.status(400).json({ error: "Invalid DB format" });
    }

    writeDB(normalized);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "JSON import failed" });
  }
});

export default router;
