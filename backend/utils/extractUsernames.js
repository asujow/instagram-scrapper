export function extractUsernames(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const usernames = new Set();

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    let username = line;

    // Instagram URL
    if (line.includes("instagram.com")) {
      try {
        const url = new URL(
          line.startsWith("http")
            ? line
            : `https://${line}`
        );

        const parts = url.pathname
          .split("/")
          .filter(Boolean);

        if (!parts.length) continue;

        const candidate = parts[0];

        // Skip invalid Instagram routes
        const blockedRoutes = [
          "p",
          "reel",
          "stories",
          "explore",
          "accounts"
        ];

        if (
          blockedRoutes.includes(
            candidate.toLowerCase()
          )
        ) {
          continue;
        }

        username = candidate;
      } catch {
        continue;
      }
    }

    // Clean username
    username = username
      .replace(/^@/, "")
      .trim()
      .toLowerCase();

    // Instagram username validation
    const valid =
      /^[a-zA-Z0-9._]{1,30}$/.test(
        username
      );

    if (!valid) continue;

    usernames.add(username);
  }

  return [...usernames];
}