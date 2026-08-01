import fs from "fs";
import path from "path";

export const DB_PATH = path.resolve(process.cwd(), "data/db.json");
export const IMAGES_DIR = path.resolve(process.cwd(), "data/images");

// Reserved tag names with special meaning and styling. Unlike regular
// tags, these are managed by dedicated flows (not the generic
// create/delete-tag UI) because they carry extra logic:
// - DELETED_TAG just needs to be add/removable like any tag.
// - ALT_ACCOUNT_TAG is kept in sync with profile.mainAccountUsername by
//   the /alt-account route — it should never be added/removed on its
//   own, or the tag and the relationship it represents fall out of sync.
export const DELETED_TAG = "deleted";
export const ALT_ACCOUNT_TAG = "alt-account";
export const RESERVED_TAGS = [DELETED_TAG, ALT_ACCOUNT_TAG];

// Same pattern enforced by utils/extractUsernames.js for the text-import
// path. Usernames end up in filesystem paths (downloaded photo
// filenames) and browser URLs (the scraper navigates to
// instagram.com/<username>), so every OTHER path that can introduce a
// username — right now just JSON import — needs to enforce this same
// shape too, or a crafted/corrupted db.json could smuggle in something
// like "../../etc/passwd" and have it used in a file write later.
const VALID_USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function isValidUsername(username) {
  return typeof username === "string" && VALID_USERNAME_PATTERN.test(username);
}

// Nicknames are free text (not used in any file path or URL, unlike
// username), so no character restriction — just a sane length cap.
export const MAX_NICKNAME_LENGTH = 100;

export function normalizeNickname(nickname) {
  if (typeof nickname !== "string") return null;
  const trimmed = nickname.trim().slice(0, MAX_NICKNAME_LENGTH);
  return trimmed || null;
}

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

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

/**
 * Normalizes a single profile record in place, filling in fields that
 * might be missing from an older db.json (self-healing, same idea as
 * the top-level guards in readDB below).
 */
function normalizeProfileShape(profile) {
  if (!Array.isArray(profile.tags)) profile.tags = [];

  if (typeof profile.mainAccountUsername !== "string") {
    profile.mainAccountUsername = null;
  }

  profile.nickname = normalizeNickname(profile.nickname);

  return profile;
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

    data.profiles = data.profiles.map(normalizeProfileShape);

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
    .filter(
      (p) =>
        p &&
        typeof p.username === "string" &&
        isValidUsername(p.username.trim().toLowerCase())
    )
    .map((p) => {
      // imagePath is the current field (a local path served from /images).
      // Older exported DBs used imageUrl with a remote Instagram URL —
      // that's not a local file we have, so it can't be carried over as
      // imagePath. It gets dropped to null; re-import or re-scrape to
      // populate it again.
      const imagePath =
        typeof p.imagePath === "string" ? p.imagePath : null;

      const mainAccountUsername =
        typeof p.mainAccountUsername === "string"
          ? p.mainAccountUsername.trim().toLowerCase()
          : null;

      return {
        username: p.username.trim().toLowerCase(),
        nickname: normalizeNickname(p.nickname),
        tags: Array.isArray(p.tags) ? p.tags : [],
        imagePath,
        mainAccountUsername,
        createdAt: p.createdAt || new Date().toISOString()
      };
    });

  // A mainAccountUsername that doesn't match any profile in this same
  // import is a dangling reference (e.g. the main account got filtered
  // out above for having no valid username) — drop it rather than keep
  // a link to something that doesn't exist.
  const usernames = new Set(profiles.map((p) => p.username));

  for (const profile of profiles) {
    if (
      profile.mainAccountUsername &&
      !usernames.has(profile.mainAccountUsername)
    ) {
      profile.mainAccountUsername = null;
    }
  }

  const tags = data.tags.filter((t) => typeof t === "string" && t.trim());

  return {
    profiles,
    tags,
    meta: data.meta && typeof data.meta === "object" ? data.meta : {}
  };
}
