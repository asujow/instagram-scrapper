import express from "express";
import cors from "cors";

import profilesRoutes from "./routes/profiles.js";
import tagsRoutes from "./routes/tags.js";
import importRoutes from "./routes/import.js";
import databaseRoutes from "./routes/database.js";

import { ensureDB, IMAGES_DIR } from "./utils/db.js";

// Safety net: this is a personal single-user tool, so it's far more
// useful for it to log an unexpected error and keep serving requests
// than to crash the whole process (which otherwise silently kills every
// in-flight request — that's what an ECONNRESET in the frontend usually
// means). node --watch does NOT restart the process on a crash, only on
// a file change, so without this a crash leaves the backend down until
// someone notices and restarts it by hand.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection (server stays up):", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server stays up):", err);
});

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";

// This app has no login and holds personal data (your profile list,
// tags, downloaded photos), so it shouldn't be reachable from anywhere
// but this machine's own frontend dev server:
// - Binding to 127.0.0.1 instead of the default (all interfaces) means
//   nothing else on the same network can even open a connection to it.
// - Restricting CORS to the Vite dev server's own origin means a
//   malicious page open in another browser tab can't call this API
//   from JavaScript and read or delete your data.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_ORIGIN }));

// Default is 100kb, far too small for a custom profile photo sent as a
// base64 data URL (POST /api/profiles/:username/photo) — base64 also
// inflates the raw file size by roughly a third, so this needs more
// headroom than the 8MB photo-size cap alone would suggest.
app.use(express.json({ limit: "12mb" }));

ensureDB();

app.use("/images", express.static(IMAGES_DIR));

app.use("/api/profiles", profilesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/import", importRoutes);
app.use("/api/database", databaseRoutes);

app.listen(PORT, HOST, () => {
  console.log(`Backend running on http://${HOST}:${PORT}`);
});
