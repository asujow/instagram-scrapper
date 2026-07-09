import React from "react";
import { useState } from "react";

import Layout from "./components/layout/Layout";
import { useAppData } from "./hooks/useAppData";

import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import ProfilesPage from "./pages/ProfilesPage";
import TagsPage from "./pages/TagsPage";

export default function App() {
  const [page, setPage] = useState("profiles");

  const {
    profiles,
    tags,
    refresh,
    selectedProfiles,
    toggleProfile,
    clearSelection
  } = useAppData();

  function renderPage() {
    switch (page) {
      case "dashboard":
        return <DashboardPage profiles={profiles} tags={tags} />;

      case "import":
        return <ImportPage onImport={refresh} />;

      case "tags":
        return (
          <TagsPage tags={tags} profiles={profiles} onRefresh={refresh} />
        );

      case "profiles":
      default:
        return (
          <ProfilesPage
            profiles={profiles}
            tags={tags}
            selectedProfiles={selectedProfiles}
            onToggleProfile={toggleProfile}
            onClearSelection={clearSelection}
            onRefresh={refresh}
          />
        );
    }
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}
