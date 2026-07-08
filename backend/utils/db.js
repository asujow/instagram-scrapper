import fs from "fs";

import path from "path";

export const DB_PATH = path.resolve(
  process.cwd(),
  "data/db.json"
);

export function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
      profiles: [],
      tags: [],
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(initialDB, null, 2)
    );
  }
}

export function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf8");
  console.log("RAW DB:", JSON.stringify(raw.slice(0, 50)));
  return JSON.parse(raw);
  try {
    ensureDB();

    const raw = fs.readFileSync(DB_PATH, "utf8").trim();

    if (!raw) throw new Error("DB empty");

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

export function writeDB(data) {
  try {
    data.meta.updatedAt =
      new Date().toISOString();

    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (err) {
    console.error("DB WRITE ERROR:", err);
  }
}

export function validateDBStructure(
  data
) {
  if (!data) return false;

  if (!Array.isArray(data.profiles))
    return false;

  if (!Array.isArray(data.tags))
    return false;

  return true;
}