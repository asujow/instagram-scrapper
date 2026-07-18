import React from "react";
import { useState } from "react";

import TagChip from "../profiles/TagChip";
import { RESERVED_TAGS } from "../../utils/specialTags";

// The "deleted" and "alt-account" tags are managed through dedicated
// controls on a profile (see ProfileDetailPage and the bulk actions on
// ProfilesPage) rather than here, so they're left out of this
// general-purpose create/delete list entirely.
export default function TagManager({ tags, profiles, onRefresh }) {
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");

  const manageableTags = tags.filter((tag) => !RESERVED_TAGS.includes(tag));

  async function createTag() {
    if (!newTag.trim()) return;

    setError("");

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: newTag })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Could not create tag");
      return;
    }

    setNewTag("");
    await onRefresh();
  }

  async function deleteTag(tag) {
    setError("");

    const response = await fetch(`/api/tags/${encodeURIComponent(tag)}`, {
      method: "DELETE"
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Could not delete tag");
      return;
    }

    await onRefresh();
  }

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTag()}
          placeholder="New tag..."
          className="border rounded-xl px-4 py-3 flex-1"
        />

        <button
          onClick={createTag}
          className="bg-black text-white px-5 rounded-xl"
        >
          Create
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {manageableTags.map((tag) => {
          const count = profiles.filter((p) => (p.tags || []).includes(tag)).length;

          return (
            <TagChip
              key={tag}
              tag={`${tag} (${count})`}
              onRemove={() => deleteTag(tag)}
            />
          );
        })}
      </div>
    </div>
  );
}
