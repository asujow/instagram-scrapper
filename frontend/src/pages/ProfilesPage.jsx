import React from "react";
import { useMemo, useState } from "react";

import ProfileGrid from "../components/profiles/ProfileGrid";
import ProfileToolbar from "../components/profiles/ProfileToolbar";
import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";
import { DELETED_TAG } from "../utils/specialTags";
import { apiFetch, jsonBody } from "../utils/api";

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
  const [selectedTags, setSelectedTags] = useState([]);
  const [bulkTag, setBulkTag] = useState("");
  const [bulkTagError, setBulkTagError] = useState("");
  const [deletedError, setDeletedError] = useState("");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const query = search.toLowerCase();

      const matchesSearch =
        profile.username.toLowerCase().includes(query) ||
        (profile.nickname || "").toLowerCase().includes(query);

      // A profile must have EVERY selected tag, not just any one of
      // them — narrows the list down as you add more filters.
      const matchesTags = selectedTags.every((tag) =>
        (profile.tags || []).includes(tag)
      );

      return matchesSearch && matchesTags;
    });
  }, [profiles, search, selectedTags]);

  function toggleTagFilter(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function applyBulkTag() {
    if (!selectedProfiles.length || !bulkTag.trim()) return;

    setBulkTagError("");

    try {
      await apiFetch(
        "/api/profiles/tags/bulk",
        { method: "POST", ...jsonBody({ usernames: selectedProfiles, tag: bulkTag }) }
      );
      setBulkTag("");
      onClearSelection();
      await onRefresh();
    } catch (err) {
      setBulkTagError(err.message);
    }
  }

  async function setDeletedForSelected(deleted) {
    if (!selectedProfiles.length) return;

    setDeletedError("");

    try {
      await apiFetch(
        `/api/profiles/tags/${deleted ? "bulk" : "bulk-remove"}`,
        { method: "POST", ...jsonBody({ usernames: selectedProfiles, tag: DELETED_TAG }) }
      );
      await onRefresh();
    } catch (err) {
      setDeletedError(err.message);
    }
  }

  async function deleteSelected() {
    if (!selectedProfiles.length) return;

    const list = selectedProfiles.map((u) => `@${u}`).join(", ");

    const confirmed = window.confirm(
      `Delete ${selectedProfiles.length} profile(s)? This permanently removes them and their downloaded photos. This can't be undone.\n\n${list}`
    );

    if (!confirmed) return;

    setDeletedError("");

    try {
      await apiFetch("/api/profiles/delete", {
        method: "POST",
        ...jsonBody({ usernames: selectedProfiles })
      });
      onClearSelection();
      await onRefresh();
    } catch (err) {
      setDeletedError(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">Profiles</h1>
        <p className="text-zinc-500 mt-2">Browse and filter profiles</p>
      </div>

      <ProfileToolbar
        search={search}
        onSearchChange={setSearch}
        selectedTags={selectedTags}
        onToggleTagFilter={toggleTagFilter}
        onClearTagFilters={() => setSelectedTags([])}
        tags={tags}
        bulkTag={bulkTag}
        onBulkTagChange={setBulkTag}
        onApplyBulkTag={applyBulkTag}
        selectedCount={selectedProfiles.length}
      />

      {bulkTagError && <p className="text-red-500 text-sm">{bulkTagError}</p>}

      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-3">
        <span className="text-sm text-zinc-500">
          {selectedProfiles.length
            ? `${selectedProfiles.length} profile(s) selected`
            : "Select profiles below to mark or delete them"}
        </span>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDeletedForSelected(true)}
            disabled={!selectedProfiles.length}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200 disabled:opacity-40"
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

          <button
            onClick={deleteSelected}
            disabled={!selectedProfiles.length}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40"
          >
            Delete Selected
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
