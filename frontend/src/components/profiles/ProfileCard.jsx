import React from "react";

import TagChip from "./TagChip";

export default function ProfileCard({ profile, selected, onSelect, onOpen }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-center hover:shadow-md transition ${
        selected ? "border-black ring-2 ring-black" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(profile.username)}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />

      <button
        onClick={() => onOpen(profile.username)}
        className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0 text-left"
      >
        <img
          src={profile.imagePath ? `/${profile.imagePath}` : "https://placehold.co/100x100"}
          alt={profile.username}
          className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="text-lg sm:text-xl font-bold truncate">@{profile.username}</div>

          <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
            {(profile.tags || []).map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}
