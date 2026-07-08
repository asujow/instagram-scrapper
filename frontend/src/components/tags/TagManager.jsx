import React from "react";
import { useState } from "react";

export default function TagManager({
  tags,
  profiles,
  onRefresh
}) {
  const [newTag, setNewTag] =
    useState("");

  async function createTag() {
    if (!newTag.trim()) return;

    await fetch("/api/tags", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify({
        tag: newTag
      })
    });

    setNewTag("");

    onRefresh();
  }

  async function deleteTag(tag) {
    await fetch(`/api/tags/${tag}`, {
      method: "DELETE"
    });

    onRefresh();
  }

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex gap-3">
        <input
          value={newTag}
          onChange={(e) =>
            setNewTag(e.target.value)
          }
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

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const count =
            profiles.filter((p) =>
              p.tags.includes(tag)
            ).length;

          return (
            <div
              key={tag}
              className="border rounded-full px-4 py-2 flex items-center gap-3"
            >
              <span>
                {tag} ({count})
              </span>

              <button
                onClick={() =>
                  deleteTag(tag)
                }
                className="text-red-500"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}