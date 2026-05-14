import express from "express";
import cors from "cors";
import fs from "fs";

import { extractUsernames } from "./utils/extractUsernames.js";
import { scrapeProfilePhoto } from "./services/instagramScraper.js";

const app = express();
const PORT = 3001;

const DB_PATH = "./data/db.json";

console.log("SERVER STARTING...");

app.use(cors());
app.use(express.json());

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.get("/profiles", (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

app.post("/import", async (req, res) => {
  const { text } = req.body;

  const usernames = extractUsernames(text);

  const db = readDB();

  for (const username of usernames) {
    const exists = db.profiles.find((p) => p.username === username);

    if (exists) continue;

    const scraped = await scrapeProfilePhoto(username);

    db.profiles.push({
      username,
      tags: [],
      imageUrl: scraped.imageUrl
    });
  }

  writeDB(db);

  res.json({
    success: true,
    imported: usernames.length
  });
});

app.post("/profiles/:username/tags", (req, res) => {
  const { username } = req.params;
  const { tags } = req.body;

  const db = readDB();

  const profile = db.profiles.find((p) => p.username === username);

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  profile.tags = [...new Set(tags)];

  db.tags = [...new Set([...db.tags, ...tags])];

  writeDB(db);

  res.json(profile);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});