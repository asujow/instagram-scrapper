import React from "react";
import { useState } from "react";

import TagChip from "../profiles/TagChip";
import { RESERVED_TAGS } from "../../utils/specialTags";
import { apiFetch, jsonBody } from "../../utils/api";

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

    try {
      await apiFetch("/api/tags", { method: "POST", ...jsonBody({ tag: newTag }) });
      setNewTag("");
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTag(tag) {
    setError("");

    try {
      await apiFetch(`/api/tags/${encodeURIComponent(tag)}`, { method: "DELETE" });
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function renameTag(tag) {
    const newName = window.prompt(`Rename "${tag}" to:`, tag);

    if (newName === null) return; // cancelled
    if (!newName.trim() || newName.trim().toLowerCase() === tag) return;

    setError("");

    try {
      await apiFetch(`/api/tags/${encodeURIComponent(tag)}`, {
        method: "PUT",
        ...jsonBody({ newName })
      });
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTag()}
          placeholder="New tag..."
          className="border rounded-xl px-4 py-3 flex-1 min-w-0"
        />

        <button
          onClick={createTag}
          className="bg-black text-white px-5 py-3 sm:py-0 rounded-xl shrink-0"
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
              onEdit={() => renameTag(tag)}
              onRemove={() => deleteTag(tag)}
            />
          );
        })}
      </div>
    </div>
  );
}
