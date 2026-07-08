import express from "express";

import {
  readDB,
  writeDB
} from "../utils/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const db = readDB();

  res.json(db.tags);
});

router.post("/", (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag?.trim()) {
      return res.status(400).json({
        error: "Invalid tag"
      });
    }

    const normalized =
      tag.trim().toLowerCase();

    const db = readDB();

    if (!db.tags.includes(normalized)) {
      db.tags.push(normalized);
    }

    writeDB(db);

    res.json({
      success: true,
      tags: db.tags
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed creating tag"
    });
  }
});

router.delete("/:tag", (req, res) => {
  try {
    const tag =
      req.params.tag.toLowerCase();

    const db = readDB();

    db.tags = db.tags.filter(
      (t) => t !== tag
    );

    db.profiles = db.profiles.map(
      (profile) => ({
        ...profile,
        tags: profile.tags.filter(
          (t) => t !== tag
        )
      })
    );

    writeDB(db);

    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed deleting tag"
    });
  }
});

router.post("/tags", (req, res) => {
  const { tag } = req.body;

  if (!tag) {
    return res.status(400).json({
      error: "Missing tag"
    });
  }

  const db = readDB();

  if (!db.tags.includes(tag)) {
    db.tags.push(tag);
  }

  writeDB(db);

  res.json({
    success: true
  });
});

router.delete("/tags/:tag", (req, res) => {
  const { tag } = req.params;

  const db = readDB();

  db.tags = db.tags.filter(
    (t) => t !== tag
  );

  db.profiles = db.profiles.map(
    (profile) => ({
      ...profile,
      tags: profile.tags.filter(
        (t) => t !== tag
      )
    })
  );

  writeDB(db);

  res.json({
    success: true
  });
});

export default router;