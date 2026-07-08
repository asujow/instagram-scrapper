import React from "react";
import { useMemo, useState } from "react";

import ProfileCard from "../components/profiles/ProfileCard";

export default function ProfilesPage({
  profiles,
  tags
}) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [bulkTag, setBulkTag] = useState("");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch = profile.username
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTag =
        !selectedTag || profile.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [profiles, search, selectedTag]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">
          Profiles
        </h1>

        <p className="text-zinc-500 mt-2">
          Browse and filter profiles
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border rounded-xl px-4 py-3 flex-1"
        />

        <select
          value={selectedTag}
          onChange={(e) =>
            setSelectedTag(e.target.value)
          }
          className="border rounded-xl px-4 py-3"
        >
          <option value="">
            All Tags
          </option>

          {tags.map((tag) => (
            <option
              key={tag}
              value={tag}
            >
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex gap-3">
        <input
          value={bulkTag}
          onChange={(e) => setBulkTag(e.target.value)}
          placeholder="Tag selected profiles..."
          className="border rounded-xl px-4 py-2 flex-1"
        />

        <button
          onClick={applyBulkTag}
          className="bg-black text-white px-5 rounded-xl"
        >
          Apply
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProfiles.map((profile) => (
          <ProfileCard
            key={profile.username}
            profile={profile}
            selected={selectedProfiles.includes(
              profile.username
            )}
            onSelect={toggleProfile}
          />
        ))}
      </div>
    </div>
  );

  function toggleProfile(username) {
    setSelectedProfiles((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  }

  async function applyBulkTag() {
    await fetch(
      "/api/profiles/tags/bulk",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usernames: selectedProfiles,
          tag: bulkTag
        })
      }
    );

    setBulkTag("");
    setSelectedProfiles([]);
  }
}