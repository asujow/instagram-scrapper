import express from "express";
import cors from "cors";

import profilesRoutes from "./routes/profiles.js";
import tagsRoutes from "./routes/tags.js";
import importRoutes from "./routes/import.js";

import { ensureDB } from "./utils/db.js";

const app = express();

const PORT = 3001;

app.use(cors());
app.use(express.json());

ensureDB();

app.use("/api/profiles", profilesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/import", importRoutes);

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});