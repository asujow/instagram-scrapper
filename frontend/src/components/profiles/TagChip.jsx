import React from "react";

import { getTagColorClasses } from "../../utils/specialTags";

/**
 * Small reusable tag pill. `onRemove` and `onEdit` are optional — pass
 * either to render the corresponding button (used by TagManager), omit
 * both for a plain read-only chip (used by ProfileCard). Reserved tags
 * (see utils/specialTags) render with their own fixed color instead of
 * the default neutral gray.
 */
export default function TagChip({ tag, onRemove, onEdit }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-2 ${getTagColorClasses(tag)}`}
    >
      {tag}

      {onEdit && (
        <button
          onClick={() => onEdit(tag)}
          className="opacity-60 hover:opacity-100 leading-none"
          aria-label={`Edit ${tag}`}
        >
          ✎
        </button>
      )}

      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="opacity-60 hover:opacity-100 leading-none"
          aria-label={`Remove ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
