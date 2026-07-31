import React from "react";
import { useState } from "react";

import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";

export default function DashboardPage({
  profiles,
  tags,
  onRefresh
}) {
  const [resetError, setResetError] = useState("");

  async function handleResetDatabase() {
    const confirmed = window.confirm(
      `⚠️ This deletes EVERYTHING — all ${profiles.length} profile(s), all ${tags.length} tag(s), and every downloaded photo. This is not the same as deleting a few profiles — it wipes the ENTIRE database. This cannot be undone.\n\nAre you absolutely sure?`
    );

    if (!confirmed) return;

    setResetError("");

    const response = await fetch("/api/database/reset", { method: "POST" });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setResetError(data.error || "Could not reset the database");
      return;
    }

    await onRefresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          Dashboard
        </h1>

        <p className="text-zinc-500 mt-2">
          Overview of your Instagram database
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Profiles"
          value={profiles.length}
        />

        <StatCard
          title="Tags"
          value={tags.length}
        />

        <StatCard
          title="Tagged Profiles"
          value={
            profiles.filter(
              (p) => (p.tags || []).length > 0
            ).length
          }
        />
      </div>

      <PhotoRefreshPanel onRefresh={onRefresh} />

      <div className="bg-white border border-red-200 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="font-bold text-lg text-red-700">Danger Zone</div>
          <p className="text-zinc-500 text-sm mt-1">
            Permanently deletes every profile, tag, and downloaded photo.
          </p>
          {resetError && (
            <p className="text-red-500 text-sm mt-1">{resetError}</p>
          )}
        </div>

        <button
          onClick={handleResetDatabase}
          className="bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 whitespace-nowrap"
        >
          Delete Entire Database
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="text-zinc-500 text-sm">
        {title}
      </div>

      <div className="text-3xl sm:text-4xl font-bold mt-2">
        {value}
      </div>
    </div>
  );
}
