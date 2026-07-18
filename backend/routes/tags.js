import express from "express";

import { readDB, writeDB, RESERVED_TAGS } from "../utils/db.js";

const router = express.Router();

function normalizeTag(tag) {
  return typeof tag === "string" ? tag.trim().toLowerCase() : "";
}

// GET /api/tags — list all tags
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.tags);
});

// POST /api/tags — create a tag
router.post("/", (req, res) => {
  try {
    const normalized = normalizeTag(req.body.tag);

    if (!normalized) {
      return res.status(400).json({ error: "Invalid tag" });
    }

    if (RESERVED_TAGS.includes(normalized)) {
      return res.status(400).json({
        error: `"${normalized}" is a reserved tag managed automatically — use the dedicated controls on a profile instead of creating it here.`
      });
    }

    const db = readDB();

    if (!db.tags.includes(normalized)) {
      db.tags.push(normalized);
      writeDB(db);
    }

    res.json({ success: true, tags: db.tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed creating tag" });
  }
});

// DELETE /api/tags/:tag — delete a tag and remove it from every profile
router.delete("/:tag", (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);

    if (RESERVED_TAGS.includes(tag)) {
      return res.status(400).json({
        error: `"${tag}" is a reserved tag and can't be deleted globally — remove it from each profile individually instead.`
      });
    }

    const db = readDB();

    db.tags = db.tags.filter((t) => t !== tag);
    db.profiles = db.profiles.map((profile) => ({
      ...profile,
      tags: profile.tags.filter((t) => t !== tag)
    }));

    writeDB(db);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed deleting tag" });
  }
});

export default router;
