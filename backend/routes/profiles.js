import express from "express";
import fs from "fs";
import path from "path";

import { readDB, writeDB, ALT_ACCOUNT_TAG, RESERVED_TAGS, IMAGES_DIR, isValidUsername, normalizeNickname } from "../utils/db.js";
import {
  startPhotoRefresh,
  getPhotoRefreshStatus
} from "../services/photoRefreshJob.js";

const router = express.Router();

// Custom photo uploads accept these formats. Keep in sync with the
// content-type check in the /photo route below.
const IMAGE_MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Deletes any downloaded photo file(s) for a username, whatever the
 * extension (there should be at most one, but this doesn't assume a
 * specific one). Best effort — a missing or unremovable file shouldn't
 * block deleting/renaming the profile itself.
 */
function deleteProfileImages(username) {
  // Defense in depth: every caller today only ever passes a username
  // that's already in the DB (so already valid), but this function
  // builds filesystem paths from it — if that ever changes (a new
  // caller, a route that forwards a raw req.params value), this stops
  // it from ever touching a path outside IMAGES_DIR.
  if (!isValidUsername(username)) return;

  let files;

  try {
    files = fs.readdirSync(IMAGES_DIR);
  } catch {
    return;
  }

  for (const file of files) {
    if (file.startsWith(`${username}.`)) {
      try {
        fs.unlinkSync(path.join(IMAGES_DIR, file));
      } catch (err) {
        console.error(`Could not delete image for ${username}:`, err.message);
      }
    }
  }
}

// GET /api/profiles — list all profiles
router.get("/", (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

// POST /api/profiles/refresh-photos — kick off a background job that
// (re-)downloads the profile photo for a set of profiles. Body may
// include { usernames: [...] } to target specific profiles (e.g. just
// one, from the profile detail page); omit it to refresh every profile
// in the DB. Returns immediately; poll GET .../refresh-photos/status
// for progress.
router.post("/refresh-photos", (req, res) => {
  const { usernames } = req.body || {};

  if (usernames !== undefined && !Array.isArray(usernames)) {
    return res.status(400).json({ error: "usernames must be an array" });
  }

  if (usernames && !usernames.every(isValidUsername)) {
    return res.status(400).json({ error: "One or more usernames are invalid" });
  }

  const started = startPhotoRefresh(usernames);

  if (!started) {
    return res.status(409).json({
      error: "A photo refresh is already running",
      status: getPhotoRefreshStatus()
    });
  }

  res.json({ success: true, status: getPhotoRefreshStatus() });
});

// GET /api/profiles/refresh-photos/status — poll progress of the job
// started above.
router.get("/refresh-photos/status", (req, res) => {
  res.json(getPhotoRefreshStatus());
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

    if (normalizedTag === ALT_ACCOUNT_TAG) {
      return res.status(400).json({
        error:
          "The alt-account tag can't be set directly — use POST /api/profiles/:username/alt-account, which also records which account is the main one."
      });
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

// POST /api/profiles/tags/bulk-remove — remove one tag from several
// profiles at once (mirrors tags/bulk). The tag itself keeps existing
// globally even if no profile uses it anymore afterwards.
router.post("/tags/bulk-remove", (req, res) => {
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

    if (normalizedTag === ALT_ACCOUNT_TAG) {
      return res.status(400).json({
        error:
          "The alt-account tag can't be removed directly — use POST /api/profiles/:username/alt-account with mainAccountUsername: null instead."
      });
    }

    const db = readDB();
    const usernameSet = new Set(usernames);

    for (const profile of db.profiles) {
      if (!usernameSet.has(profile.username)) continue;
      profile.tags = (profile.tags || []).filter((t) => t !== normalizedTag);
    }

    writeDB(db);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed removing tag" });
  }
});

// DELETE /api/profiles/:username/tags/:tag — remove one tag from one
// profile only (unlike DELETE /api/tags/:tag, which deletes the tag
// everywhere). The tag itself keeps existing globally even if no
// profile uses it anymore.
router.delete("/:username/tags/:tag", (req, res) => {
  try {
    const { username, tag } = req.params;

    if (tag === ALT_ACCOUNT_TAG) {
      return res.status(400).json({
        error:
          "The alt-account tag can't be removed directly — use POST /api/profiles/:username/alt-account with mainAccountUsername: null instead."
      });
    }

    const db = readDB();
    const profile = db.profiles.find((p) => p.username === username);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    profile.tags = (profile.tags || []).filter((t) => t !== tag);

    writeDB(db);

    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed removing tag" });
  }
});

// POST /api/profiles/:username/alt-account — mark this profile as an
// alternate account of another (mainAccountUsername), or clear that
// link by passing mainAccountUsername: null. Keeps profile.tags in
// sync with the reserved "alt-account" tag so it still shows up
// wherever tags are displayed/filtered.
router.post("/:username/alt-account", (req, res) => {
  try {
    const { username } = req.params;
    const { mainAccountUsername } = req.body || {};

    const db = readDB();
    const profile = db.profiles.find((p) => p.username === username);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Clearing the link.
    if (mainAccountUsername === null) {
      profile.mainAccountUsername = null;
      profile.tags = (profile.tags || []).filter((t) => t !== ALT_ACCOUNT_TAG);

      writeDB(db);
      return res.json({ success: true, profile });
    }

    if (typeof mainAccountUsername !== "string" || !mainAccountUsername.trim()) {
      return res.status(400).json({
        error: "mainAccountUsername must be a non-empty string or null"
      });
    }

    const normalizedMain = mainAccountUsername.trim().toLowerCase();

    if (normalizedMain === username) {
      return res.status(400).json({ error: "A profile can't be its own main account" });
    }

    const mainProfile = db.profiles.find((p) => p.username === normalizedMain);

    if (!mainProfile) {
      return res.status(404).json({ error: "Main account profile not found" });
    }

    // Keep the model to two flat levels (main + alts) instead of chains:
    // don't allow linking to a profile that is itself an alt.
    if (mainProfile.mainAccountUsername) {
      return res.status(400).json({
        error: `@${normalizedMain} is itself an alternate account of @${mainProfile.mainAccountUsername} — link to that account instead.`
      });
    }

    // Don't allow a profile that already has its own alts pointing to it
    // to also become someone else's alt.
    const hasIncomingAlts = db.profiles.some(
      (p) => p.mainAccountUsername === username
    );

    if (hasIncomingAlts) {
      return res.status(400).json({
        error:
          "This profile already has alternate accounts linked to it, so it can't also be marked as an alt of another account."
      });
    }

    profile.mainAccountUsername = normalizedMain;

    if (!profile.tags.includes(ALT_ACCOUNT_TAG)) {
      profile.tags.push(ALT_ACCOUNT_TAG);
    }

    if (!db.tags.includes(ALT_ACCOUNT_TAG)) {
      db.tags.push(ALT_ACCOUNT_TAG);
    }

    writeDB(db);

    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed updating alt-account link" });
  }
});

// POST /api/profiles/delete — permanently delete one or more profiles
// (and their downloaded photos). Body: { usernames: [...] }. Used for
// both a single deletion (from the profile detail page) and a bulk one
// (from the Profiles page selection) — same shape either way.
router.post("/delete", (req, res) => {
  try {
    const { usernames } = req.body || {};

    if (!Array.isArray(usernames) || !usernames.length) {
      return res.status(400).json({ error: "No profiles selected" });
    }

    const db = readDB();
    const usernameSet = new Set(usernames);

    const toDelete = db.profiles.filter((p) => usernameSet.has(p.username));

    if (!toDelete.length) {
      return res.status(404).json({ error: "None of those profiles exist" });
    }

    db.profiles = db.profiles.filter((p) => !usernameSet.has(p.username));

    // A profile that had alts pointing to it as their main account is
    // gone now — clear those dangling links instead of leaving them
    // pointing at a username that no longer exists.
    for (const profile of db.profiles) {
      if (profile.mainAccountUsername && usernameSet.has(profile.mainAccountUsername)) {
        profile.mainAccountUsername = null;
        profile.tags = (profile.tags || []).filter((t) => t !== ALT_ACCOUNT_TAG);
      }
    }

    for (const profile of toDelete) {
      deleteProfileImages(profile.username);
    }

    // Drop any tag that no profile uses anymore now that these are
    // gone — except the reserved tags, which stay in the system even
    // with zero profiles using them (they're not "just a label", they
    // have dedicated management UI that assumes they always exist).
    const usedTags = new Set(db.profiles.flatMap((p) => p.tags || []));
    db.tags = db.tags.filter((t) => RESERVED_TAGS.includes(t) || usedTags.has(t));

    writeDB(db);

    res.json({ success: true, deleted: toDelete.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed deleting profiles" });
  }
});

// PUT /api/profiles/:username/nickname — set or clear a free-text
// nickname. Purely cosmetic/searchable — doesn't replace the username
// and isn't required to be unique (multiple profiles can share one).
router.put("/:username/nickname", (req, res) => {
  try {
    const { username } = req.params;
    const { nickname } = req.body || {};

    const db = readDB();
    const profile = db.profiles.find((p) => p.username === username);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (nickname !== null && typeof nickname !== "string") {
      return res.status(400).json({ error: "nickname must be a string or null" });
    }

    profile.nickname = normalizeNickname(nickname);

    writeDB(db);

    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed updating nickname" });
  }
});

// PUT /api/profiles/:username/username — rename a profile's username.
// This is the one field everything else keys off, so renaming cascades:
// any profile that has this one as its main account gets repointed to
// the new name, and the downloaded photo file (if any) is renamed to
// match instead of becoming orphaned under the old name.
router.put("/:username/username", (req, res) => {
  try {
    const { username } = req.params;
    const { newUsername } = req.body || {};

    // Both ends of the rename get used in filesystem paths below
    // (oldPath/newPath) — validate the current username too, not just
    // the new one, even though in practice it always came from a
    // profile already in the DB (so already valid).
    if (!isValidUsername(username) || !isValidUsername(newUsername)) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const normalized = newUsername.trim().toLowerCase();

    const db = readDB();
    const profile = db.profiles.find((p) => p.username === username);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (normalized === username) {
      return res.json({ success: true, profile }); // no-op
    }

    const conflict = db.profiles.some((p) => p.username === normalized);

    if (conflict) {
      return res.status(400).json({
        error: `A profile named @${normalized} already exists`
      });
    }

    // Rename the photo file on disk (if any) so it isn't orphaned under
    // the old username. Best effort: if this fails for some reason,
    // fall back to no photo rather than blocking the rename.
    if (profile.imagePath) {
      const ext = profile.imagePath.split(".").pop();
      const oldPath = path.join(IMAGES_DIR, `${username}.${ext}`);
      const newPath = path.join(IMAGES_DIR, `${normalized}.${ext}`);

      try {
        fs.renameSync(oldPath, newPath);
        profile.imagePath = `images/${normalized}.${ext}`;
      } catch (err) {
        console.error(`Could not rename image for ${username}:`, err.message);
        profile.imagePath = null;
      }
    }

    profile.username = normalized;

    // Anyone whose main account was this profile needs to point at the
    // new username instead — otherwise that link silently breaks.
    for (const other of db.profiles) {
      if (other.mainAccountUsername === username) {
        other.mainAccountUsername = normalized;
      }
    }

    writeDB(db);

    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed renaming profile" });
  }
});

// POST /api/profiles/:username/photo — replace a profile's photo with
// a custom upload. Body: { dataUrl: "data:image/jpeg;base64,..." } —
// sent as JSON (not multipart) to avoid adding a file-upload dependency
// for what's a pretty small feature; the frontend reads the chosen
// file as a data URL before sending it.
router.post("/:username/photo", (req, res) => {
  try {
    const { username } = req.params;
    const { dataUrl } = req.body || {};

    // username ends up directly in a filesystem write path below —
    // validate the shape before it ever gets there, the same way the
    // import routes already do (see utils/db.js for why).
    if (!isValidUsername(username)) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const db = readDB();
    const profile = db.profiles.find((p) => p.username === username);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (typeof dataUrl !== "string") {
      return res.status(400).json({ error: "dataUrl is required" });
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({ error: "dataUrl must be a base64 image data URL" });
    }

    const [, mimeType, base64Data] = match;
    const ext = IMAGE_MIME_TO_EXT[mimeType];

    if (!ext) {
      return res.status(400).json({
        error: `Unsupported image type "${mimeType}" — use JPEG, PNG, or WEBP`
      });
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({
        error: `Image too large — max ${MAX_PHOTO_BYTES / 1024 / 1024}MB`
      });
    }

    // Clear out any existing photo for this profile first (it might
    // have a different extension than the new upload).
    deleteProfileImages(username);

    fs.writeFileSync(path.join(IMAGES_DIR, `${username}.${ext}`), buffer);

    profile.imagePath = `images/${username}.${ext}`;

    writeDB(db);

    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed uploading photo" });
  }
});

export default router;
