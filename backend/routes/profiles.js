import express from "express";
import { readDB } from "../utils/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

router.post(
  "/profiles/tags/bulk",
  (req, res) => {
    const { usernames, tag } =
      req.body;

    const db = readDB();

    if (!db.tags.includes(tag)) {
      db.tags.push(tag);
    }

    for (const profile of db.profiles) {
      if (
        usernames.includes(
          profile.username
        )
      ) {
        if (
          !profile.tags.includes(tag)
        ) {
          profile.tags.push(tag);
        }
      }
    }

    writeDB(db);

    res.json({
      success: true
    });
  }
);

export default router;