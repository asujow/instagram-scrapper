import React from "react";

import TagChip from "./TagChip";

export default function ProfileCard({ profile, selected, onSelect, onOpen }) {
  return (
    <div
      className={`bg-white border rounded-2xl p-5 flex gap-4 items-center hover:shadow-md transition ${
        selected ? "border-black ring-2 ring-black" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(profile.username)}
        onClick={(e) => e.stopPropagation()}
      />

      <button
        onClick={() => onOpen(profile.username)}
        className="flex gap-4 items-center flex-1 text-left"
      >
        <img
          src={profile.imagePath ? `/${profile.imagePath}` : "https://placehold.co/100x100"}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover border"
        />

        <div className="flex-1">
          <div className="text-xl font-bold">@{profile.username}</div>

          <div className="flex flex-wrap gap-2 mt-3">
            {(profile.tags || []).map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}
