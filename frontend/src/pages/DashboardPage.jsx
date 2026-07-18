import React from "react";

import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";

export default function DashboardPage({
  profiles,
  tags,
  onRefresh
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <p className="text-zinc-500 mt-2">
          Overview of your Instagram database
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Profiles"
          value={profiles.length}
        />

        <StatCard
          title="Tags"
          value={tags.length}
        />

        <StatCard
          title="Tagged Profiles"
          value={
            profiles.filter(
              (p) => (p.tags || []).length > 0
            ).length
          }
        />
      </div>

      <PhotoRefreshPanel onRefresh={onRefresh} />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="text-zinc-500 text-sm">
        {title}
      </div>

      <div className="text-4xl font-bold mt-2">
        {value}
      </div>
    </div>
  );
}