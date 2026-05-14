export function extractUsernames(text) {
  const regex = /instagram\.com\/([^?\/\s]+)/g;

  const usernames = [];

  let match;

  while ((match = regex.exec(text)) !== null) {
    usernames.push(match[1]);
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!line.includes("instagram.com")) {
      usernames.push(line);
    }
  }

  return [...new Set(usernames)];
}