import express from "express";

import { readDB, writeDB } from "../utils/db.js";

const router = express.Router();

// GET /api/profiles — list all profiles
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

// POST /api/profiles/tags/bulk — apply one tag to several profiles at once
router.post("/tags/bulk", (req, res) => {
  try {
    const { usernames, tag } = req.body;

    if (!Array.isArray(usernames) || !usernames.length) {
      return res.status(400).json({ error: "No profiles selected" });
    }

    const normalizedTag =
      typeof tag === "string" ? tag.trim().toLowerCase() : "";

    if (!normalizedTag) {
      return res.status(400).json({ error: "Invalid tag" });
    }

    const db = readDB();
    const usernameSet = new Set(usernames);

    if (!db.tags.includes(normalizedTag)) {
      db.tags.push(normalizedTag);
    }

    for (const profile of db.profiles) {
      if (!usernameSet.has(profile.username)) continue;
      if (!profile.tags.includes(normalizedTag)) {
        profile.tags.push(normalizedTag);
      }
    }

    writeDB(db);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed applying tag" });
  }
});

export default router;
