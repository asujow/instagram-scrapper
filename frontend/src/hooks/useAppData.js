import { useCallback, useEffect, useState } from "react";

/**
 * Single source of truth for profiles, tags, and the current profile
 * selection. Centralizing this here (instead of duplicating selection
 * state in both App.jsx and ProfilesPage.jsx) is what fixes the
 * bulk-tagging bug: previously each component tracked its own
 * `selectedProfiles`, so toggling a checkbox in one place never matched
 * what the "Apply tag" button read from the other.
 */
export function useAppData() {
  const [profiles, setProfiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const [profilesRes, tagsRes] = await Promise.all([
        fetch("/api/profiles"),
        fetch("/api/tags")
      ]);

      setProfiles(await profilesRes.json());
      setTags(await tagsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleProfile = useCallback((username) => {
    setSelectedProfiles((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProfiles([]);
  }, []);

  return {
    profiles,
    tags,
    loading,
    refresh,
    selectedProfiles,
    toggleProfile,
    clearSelection
  };
}
