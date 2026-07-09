import React from "react";
import { useMemo, useState } from "react";

import ProfileGrid from "../components/profiles/ProfileGrid";
import ProfileToolbar from "../components/profiles/ProfileToolbar";

export default function ProfilesPage({
  profiles,
  tags,
  selectedProfiles,
  onToggleProfile,
  onClearSelection,
  onRefresh
}) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [bulkTag, setBulkTag] = useState("");

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

      <ProfileGrid
        profiles={filteredProfiles}
        selectedProfiles={selectedProfiles}
        onToggleProfile={onToggleProfile}
      />
    </div>
  );
}
