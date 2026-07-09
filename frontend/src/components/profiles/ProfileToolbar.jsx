import React from "react";

/**
 * Search + tag filter bar, plus the bulk-tag input for the currently
 * selected profiles.
 */
export default function ProfileToolbar({
  search,
  onSearchChange,
  selectedTag,
  onSelectedTagChange,
  tags,
  bulkTag,
  onBulkTagChange,
  onApplyBulkTag,
  selectedCount
}) {
  return (
    <>
      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border rounded-xl px-4 py-3 flex-1"
        />

        <select
          value={selectedTag}
          onChange={(e) => onSelectedTagChange(e.target.value)}
          className="border rounded-xl px-4 py-3"
        >
          <option value="">All Tags</option>

          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex gap-3 items-center">
        <input
          value={bulkTag}
          onChange={(e) => onBulkTagChange(e.target.value)}
          placeholder="Tag selected profiles..."
          className="border rounded-xl px-4 py-2 flex-1"
        />

        <button
          onClick={onApplyBulkTag}
          disabled={!selectedCount || !bulkTag.trim()}
          className="bg-black text-white px-5 py-2 rounded-xl disabled:opacity-40"
        >
          Apply{selectedCount ? ` (${selectedCount})` : ""}
        </button>
      </div>
    </>
  );
}
