import express from "express";

import {
  readDB,
  writeDB,
  validateDBStructure
} from "../utils/db.js";

import { extractUsernames } from "../utils/extractUsernames.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (
      !text ||
      typeof text !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid text input"
      });
    }

    const usernames =
      extractUsernames(text);

    if (!usernames.length) {
      return res.status(400).json({
        error:
          "No valid usernames found"
      });
    }

    const db = readDB();

    let added = 0;

    for (const username of usernames) {
      const exists =
        db.profiles.find(
          (p) =>
            p.username === username
        );

      if (exists) continue;

      db.profiles.push({
        username,
        tags: [],
        imageUrl: null,
        createdAt:
          new Date().toISOString()
      });

      added++;
    }

    writeDB(db);

    res.json({
      success: true,
      added,
      total: db.profiles.length
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Import failed"
    });
  }
});

router.post(
  "/json",
  (req, res) => {
    try {
      const data = req.body;

      const valid =
        validateDBStructure(data);

      if (!valid) {
        return res.status(400).json({
          error:
            "Invalid DB format"
        });
      }

      writeDB(data);

      res.json({
        success: true
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error:
          "JSON import failed"
      });
    }
  }
);


export default router;