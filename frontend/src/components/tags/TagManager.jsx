import React from "react";
import { useState } from "react";

import TagChip from "../profiles/TagChip";

export default function TagManager({ tags, profiles, onRefresh }) {
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");

  async function createTag() {
    if (!newTag.trim()) return;

    setError("");

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: newTag })
    });

    if (!response.ok) {
      setError("Could not create tag");
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

    if (!response.ok) {
      setError("Could not delete tag");
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
        {tags.map((tag) => {
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
