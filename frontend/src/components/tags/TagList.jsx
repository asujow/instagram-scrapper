import React from "react";

import { getTagColorClasses } from "../../utils/specialTags";

/**
 * Read-only grid of tags with how many profiles use each one.
 */
export default function TagList({ tags, profiles }) {
  if (!tags.length) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center text-zinc-500">
        No tags yet — create one below.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tags.map((tag) => {
        const count = profiles.filter((p) => (p.tags || []).includes(tag)).length;

        return (
          <div key={tag} className="bg-white border rounded-2xl p-4">
            <div
              className={`font-bold w-fit px-2 py-0.5 rounded-lg ${getTagColorClasses(tag)}`}
            >
              {tag}
            </div>
            <div className="text-zinc-500 text-sm mt-1">{count} profiles</div>
          </div>
        );
      })}
    </div>
  );
}
