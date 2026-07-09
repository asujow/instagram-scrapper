const BLOCKED_ROUTES = new Set([
  "p",
  "reel",
  "reels",
  "tv",
  "stories",
  "explore",
  "accounts"
]);

function tryAdd(usernames, candidate) {
  const cleaned = candidate.replace(/^@/, "").trim().toLowerCase();

  if (!cleaned || BLOCKED_ROUTES.has(cleaned)) return;

  // Instagram username validation
  if (/^[a-zA-Z0-9._]{1,30}$/.test(cleaned)) {
    usernames.add(cleaned);
  }
}

/**
 * Extracts Instagram usernames from free-form pasted text: full profile
 * URLs (with or without query strings like ?igsh=...), @handles, or bare
 * usernames, one per line.
 *
 * Handles a common real-world case: several "share profile" links pasted
 * back-to-back with no line breaks between them (this happens when
 * copying multiple share links from the Instagram app on mobile). A
 * naive line-by-line URL parse would only catch the first link in that
 * blob and silently drop the rest, so URLs are matched globally across
 * the whole text first.
 */
export function extractUsernames(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const usernames = new Set();

  // Pass 1: pull every instagram.com/<username> occurrence out of the
  // whole text, regardless of separators.
  const urlPattern = /instagram\.com\/([^/?#\s]+)/gi;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    tryAdd(usernames, match[1]);
  }

  // Pass 2: any line that wasn't part of an Instagram URL is treated as
  // a bare username (or @handle), one per line.
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.includes("instagram.com")) continue; // already handled above
    tryAdd(usernames, line);
  }

  return [...usernames];
}
