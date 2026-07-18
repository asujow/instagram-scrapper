import React from "react";
import { useMemo, useState } from "react";

import ProfileGrid from "../components/profiles/ProfileGrid";
import ProfileToolbar from "../components/profiles/ProfileToolbar";
import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";
import { DELETED_TAG } from "../utils/specialTags";

export default function ProfilesPage({
  profiles,
  tags,
  selectedProfiles,
  onToggleProfile,
  onClearSelection,
  onRefresh,
  onOpenProfile
}) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [deletedError, setDeletedError] = useState("");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch = profile.username
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTag =
        !selectedTag || (profile.tags || []).includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [profiles, search, selectedTag]);

  async function applyBulkTag() {
    if (!selectedProfiles.length || !bulkTag.trim()) return;

    const response = await fetch("/api/profiles/tags/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: selectedProfiles,
        tag: bulkTag
      })
    });

    if (!response.ok) {
      console.error(await response.text());
      return;
    }

    setBulkTag("");
    onClearSelection();
    await onRefresh();
  }

  async function setDeletedForSelected(deleted) {
    if (!selectedProfiles.length) return;

    setDeletedError("");

    const response = await fetch(
      `/api/profiles/tags/${deleted ? "bulk" : "bulk-remove"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: selectedProfiles,
          tag: DELETED_TAG
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDeletedError(data.error || "Could not update deleted status");
      return;
    }

    await onRefresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">Profiles</h1>
        <p className="text-zinc-500 mt-2">Browse and filter profiles</p>
      </div>

      <ProfileToolbar
        search={search}
        onSearchChange={setSearch}
        selectedTag={selectedTag}
        onSelectedTagChange={setSelectedTag}
        tags={tags}
        bulkTag={bulkTag}
        onBulkTagChange={setBulkTag}
        onApplyBulkTag={applyBulkTag}
        selectedCount={selectedProfiles.length}
      />

      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-zinc-500">
            {selectedProfiles.length
              ? `${selectedProfiles.length} profile(s) selected`
              : "Select profiles below to mark them as deleted"}
          </span>

          <button
            onClick={() => setDeletedForSelected(true)}
            disabled={!selectedProfiles.length}
            className="ml-auto bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200 disabled:opacity-40"
          >
            Mark as Deleted
          </button>

          <button
            onClick={() => setDeletedForSelected(false)}
            disabled={!selectedProfiles.length}
            className="border px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
          >
            Unmark as Deleted
          </button>
        </div>

        {deletedError && <p className="text-red-500 text-sm">{deletedError}</p>}
      </div>

      <PhotoRefreshPanel
        usernames={selectedProfiles}
        title="Selected Profiles' Photos"
        description={
          selectedProfiles.length
            ? `Re-downloads the profile photo for the ${selectedProfiles.length} selected profile(s).`
            : "Select one or more profiles below to refresh their photos."
        }
        buttonLabel="Refresh Selected Photos"
        onRefresh={onRefresh}
      />

      <ProfileGrid
        profiles={filteredProfiles}
        selectedProfiles={selectedProfiles}
        onToggleProfile={onToggleProfile}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
}
