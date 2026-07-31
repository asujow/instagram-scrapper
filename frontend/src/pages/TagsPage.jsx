import React from "react";

import TagList from "../components/tags/TagList";
import TagManager from "../components/tags/TagManager";

export default function TagsPage({ tags, profiles, onRefresh }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold">Tags</h1>
        <p className="text-zinc-500 mt-2">Manage your profile tags</p>
      </div>

      <TagList tags={tags} profiles={profiles} />

      <TagManager tags={tags} profiles={profiles} onRefresh={onRefresh} />
    </div>
  );
}
