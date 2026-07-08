import React from "react";

import { useEffect, useState } from "react";

import Layout from "./components/layout/Layout";

import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import ProfilesPage from "./pages/ProfilesPage";
import TagsPage from "./pages/TagsPage";

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [page, setPage] = useState("profiles");

  async function loadProfiles() {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const allTags = [
    ...new Set(
      profiles.flatMap((p) => p.tags || [])
    )
  ];

  function toggleProfile(username) {
    setSelectedProfiles((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  }

  function clearSelection() {
    setSelectedProfiles([]);
  }

  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            profiles={profiles}
            tags={allTags}
          />
        );

      case "import":
        return (
          <ImportPage onImport={loadProfiles} />
        );

      case "tags":
        return (
          <TagsPage
            tags={allTags}
            profiles={profiles}
            onRefresh={loadProfiles}
          />
        );

      case "profiles":
      default:
        return (
          <ProfilesPage
            profiles={profiles}
            tags={allTags}
            selectedProfiles={selectedProfiles}
            onToggleProfile={toggleProfile}
            onClearSelection={clearSelection}
          />
        );
    }
  }

  return (
    <Layout
      currentPage={page}
      onNavigate={setPage}
    >
      {renderPage()}
    </Layout>
  );
}