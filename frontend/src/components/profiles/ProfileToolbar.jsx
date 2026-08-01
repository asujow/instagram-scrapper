import React from "react";

import { getTagColorClasses, RESERVED_TAGS } from "../../utils/specialTags";

/**
 * Search + multi-tag filter bar, plus the bulk-tag input for the
 * currently selected profiles.
 */
export default function ProfileToolbar({
  search,
  onSearchChange,
  selectedTags,
  onToggleTagFilter,
  onClearTagFilters,
  tags,
  bulkTag,
  onBulkTagChange,
  onApplyBulkTag,
  selectedCount
}) {
  // Reserved tags have their own dedicated controls (the deleted-marking
  // buttons, the alt-account section on a profile) — leave them out of
  // the free-text "type an existing tag" suggestions to avoid pointing
  // people at a path that's either redundant or gets rejected.
  const suggestableTags = tags.filter((tag) => !RESERVED_TAGS.includes(tag));
  return (
    <>
      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search username or nickname..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded-xl px-4 py-3 flex-1"
        />

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500 mr-1">Filter by tag:</span>

            {tags.map((tag) => {
              const active = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  onClick={() => onToggleTagFilter(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition ${getTagColorClasses(tag)} ${
                    active ? "ring-2 ring-black" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}

            {selectedTags.length > 0 && (
              <button
                onClick={onClearTagFilters}
                className="text-sm text-zinc-500 hover:text-black underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          value={bulkTag}
          onChange={(e) => onBulkTagChange(e.target.value)}
          placeholder="Tag selected profiles..."
          list="existing-profile-tags"
          className="border rounded-xl px-4 py-2 flex-1 min-w-0"
        />

        <datalist id="existing-profile-tags">
          {suggestableTags.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>

        <button
          onClick={onApplyBulkTag}
          disabled={!selectedCount || !bulkTag.trim()}
          className="bg-black text-white px-5 py-2 rounded-xl disabled:opacity-40 shrink-0"
        >
          Apply{selectedCount ? ` (${selectedCount})` : ""}
        </button>
      </div>
    </>
  );
}
