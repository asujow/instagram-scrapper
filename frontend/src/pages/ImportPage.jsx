import ManualImport from "../components/import/ManualImport";
import TxtUpload from "../components/import/TxtUpload";
import JsonUpload from "../components/import/JsonUpload";
import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";
import React, { useState } from "react";

import { apiFetch, jsonBody } from "../utils/api";

export default function ImportPage({
  onImport
}) {
  // Bumped on every successful import so PhotoRefreshPanel remounts and
  // re-checks whether a photo-download job just got queued by that
  // import — it only checks on mount, so without this it wouldn't
  // notice a second import triggered without leaving this page.
  const [importCount, setImportCount] = useState(0);

  async function handleImport(data) {
    await onImport();

    if (data?.newUsernames?.length) {
      const wantsPhotos = window.confirm(
        `Download profile photos for the ${data.newUsernames.length} newly imported profile(s) now? This can take a few seconds per profile.`
      );

      if (wantsPhotos) {
        try {
          await apiFetch("/api/profiles/refresh-photos", {
            method: "POST",
            ...jsonBody({ usernames: data.newUsernames })
          });
        } catch (err) {
          // Not fatal — the import itself already succeeded, and the
          // panel below will show whatever the job status actually is
          // once it remounts. Just don't let this go unnoticed.
          console.error("Could not start photo download:", err.message);
        }
      }
    }

    // Remount PhotoRefreshPanel so it re-checks job status — whether we
    // just started one above, or the import didn't add anyone new.
    setImportCount((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          Import Profiles
        </h1>

        <p className="text-zinc-500 mt-2">
          Paste Instagram URLs, usernames or upload files
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 flex flex-col gap-6">
        <ManualImport onImport={handleImport} />

        <div className="border-t pt-4 flex flex-col gap-4">
          <TxtUpload onImport={handleImport} />
          <JsonUpload onImport={handleImport} />
        </div>
      </div>

      <PhotoRefreshPanel key={importCount} onRefresh={onImport} />
    </div>
  );
}
