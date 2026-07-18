import express from "express";
import cors from "cors";

import profilesRoutes from "./routes/profiles.js";
import tagsRoutes from "./routes/tags.js";
import importRoutes from "./routes/import.js";

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

app.use(cors());
app.use(express.json());

ensureDB();

app.use("/images", express.static(IMAGES_DIR));

app.use("/api/profiles", profilesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/import", importRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
