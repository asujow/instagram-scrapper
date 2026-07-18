import React from "react";
import { useState } from "react";

import Layout from "./components/layout/Layout";
import { useAppData } from "./hooks/useAppData";

import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import ProfilesPage from "./pages/ProfilesPage";
import TagsPage from "./pages/TagsPage";
import ProfileDetailPage from "./pages/ProfileDetailPage";

export default function App() {
  const [page, setPage] = useState("profiles");

  // Viewing a single profile is layered on top of the normal page
  // navigation rather than being one of its cases: it can be reached
  // from a click on Profiles, and "Back" should return to wherever the
  // user was, without the sidebar losing track of the underlying page.
  const [viewingUsername, setViewingUsername] = useState(null);

  const {
    profiles,
    tags,
    refresh,
    selectedProfiles,
    toggleProfile,
    clearSelection
  } = useAppData();

  function handleNavigate(nextPage) {
    setViewingUsername(null);
    setPage(nextPage);
  }

  function renderPage() {
    if (viewingUsername) {
      const profile = profiles.find((p) => p.username === viewingUsername);

      return (
        <ProfileDetailPage
          profile={profile}
          profiles={profiles}
          tags={tags}
          onBack={() => setViewingUsername(null)}
          onRefresh={refresh}
        />
      );
    }

    switch (page) {
      case "dashboard":
        return (
          <DashboardPage profiles={profiles} tags={tags} onRefresh={refresh} />
        );

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
            onOpenProfile={setViewingUsername}
          />
        );
    }
  }

  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}
