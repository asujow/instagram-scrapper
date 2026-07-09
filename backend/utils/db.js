import fs from "fs";
import path from "path";

export const DB_PATH = path.resolve(process.cwd(), "data/db.json");

function emptyDB() {
  const now = new Date().toISOString();

  return {
    profiles: [],
    tags: [],
    meta: {
      createdAt: now,
      updatedAt: now
    }
  };
}

/**
 * Creates the db.json file with an empty structure if it doesn't exist yet.
 * Safe to call multiple times.
 */
export function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB(), null, 2));
  }
}

/**
 * Reads the database from disk. Self-heals from a missing or corrupted
 * file instead of crashing every route that depends on it.
 */
export function readDB() {
  try {
    ensureDB();

    const raw = fs.readFileSync(DB_PATH, "utf8").trim();

    if (!raw) throw new Error("db.json is empty");

    const data = JSON.parse(raw);

    // Guard against partial/older files missing a field.
    if (!Array.isArray(data.profiles)) data.profiles = [];
    if (!Array.isArray(data.tags)) data.tags = [];
    if (!data.meta || typeof data.meta !== "object") data.meta = {};

    return data;
  } catch (err) {
    console.error("DB read error, falling back to empty DB:", err.message);
    return emptyDB();
  }
}

/**
 * Persists the database to disk, updating the meta.updatedAt timestamp.
 */
export function writeDB(data) {
  if (!data.meta || typeof data.meta !== "object") {
    data.meta = {};
  }

  data.meta.updatedAt = new Date().toISOString();

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Validates and normalizes a DB payload coming from an untrusted source
 * (the JSON upload endpoint). Returns null if the shape is unrecoverable.
 */
export function normalizeImportedDB(data) {
  if (!data || typeof data !== "object") return null;
  if (!Array.isArray(data.profiles)) return null;
  if (!Array.isArray(data.tags)) return null;

  const profiles = data.profiles
    .filter((p) => p && typeof p.username === "string" && p.username.trim())
    .map((p) => ({
      username: p.username.trim().toLowerCase(),
      tags: Array.isArray(p.tags) ? p.tags : [],
      imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : null,
      createdAt: p.createdAt || new Date().toISOString()
    }));

  const tags = data.tags.filter((t) => typeof t === "string" && t.trim());

  return {
    profiles,
    tags,
    meta: data.meta && typeof data.meta === "object" ? data.meta : {}
  };
}
