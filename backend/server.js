import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import fs from "fs";

import { extractUsernames } from "./utils/extractUsernames.js";
import { scrapeProfilePhoto } from "./services/instagramScraper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const DB_PATH = path.join(__dirname, "./data/db.json");

console.log("SERVER STARTING...");

app.use(cors());
app.use(express.json());

app.get("/profiles", (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

app.post("/import", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Invalid text input"
      });
    }

    const usernames =
      extractUsernames(text);

    if (!usernames.length) {
      return res.status(400).json({
        error: "No valid usernames found"
      });
    }

    const db = readDB();

    let added = 0;

    for (const username of usernames) {
      const exists = db.profiles.find(
        (p) => p.username === username
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

app.post("/import-json", (req, res) => {
  try {
    const data = req.body;

    const valid =
      validateDBStructure(data);

    if (!valid) {
      return res.status(400).json({
        error: "Invalid DB format"
      });
    }

    writeDB(data);

    res.json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      error: "JSON import failed"
    });
  }
});

ensureDB();
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

function ensureDB() {
  const dataDir = path.join(
    __dirname,
    "data"
  );

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
      recursive: true
    });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
      profiles: [],
      tags: [],
      meta: {
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString()
      }
    };

    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(
        initialDB,
        null,
        2
      )
    );
  }
}

function readDB() {
  try {
    ensureDB();

    const raw = fs.readFileSync(
      DB_PATH,
      "utf8"
    );

    return JSON.parse(raw);
  } catch (err) {
    console.error("DB READ ERROR:", err);

    return {
      profiles: [],
      tags: [],
      meta: {}
    };
  }
}

function writeDB(data) {
  try {
    if (!data.meta) {
      data.meta = {};
    }

    data.meta.updatedAt =
      new Date().toISOString();

    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(data, null, 2)
    );
  } catch (err) {
    console.error("DB WRITE ERROR:", err);
  }
}

function validateDBStructure(data) {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.profiles) &&
    Array.isArray(data.tags)
  );
}