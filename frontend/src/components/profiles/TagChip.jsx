import React from "react";

/**
 * Small reusable tag pill. `onRemove` is optional — pass it to render a
 * delete button (used by TagManager), omit it for a plain read-only chip
 * (used by ProfileCard).
 */
export default function TagChip({ tag, onRemove }) {
  return (
    <span className="bg-zinc-200 text-zinc-800 px-3 py-1 rounded-full text-sm inline-flex items-center gap-2">
      {tag}

      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="text-zinc-500 hover:text-red-500 leading-none"
          aria-label={`Remove ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
