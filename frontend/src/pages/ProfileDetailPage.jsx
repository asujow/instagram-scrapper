import React from "react";
import { useState } from "react";

import TagChip from "../components/profiles/TagChip";
import PhotoRefreshPanel from "../components/dashboard/PhotoRefreshPanel";
import { DELETED_TAG, RESERVED_TAGS } from "../utils/specialTags";

export default function ProfileDetailPage({ profile, profiles, tags, onBack, onRefresh, onOpenProfile }) {
  const [newTag, setNewTag] = useState("");
  const [tagError, setTagError] = useState("");
  const [altAccountChoice, setAltAccountChoice] = useState("");
  const [altError, setAltError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <button onClick={onBack} className="text-zinc-500 hover:text-black w-fit">
          ← Back to Profiles
        </button>

        <div className="bg-white border rounded-2xl p-12 text-center text-zinc-500">
          Profile not found — it may have been removed.
        </div>
      </div>
    );
  }

  const isDeleted = (profile.tags || []).includes(DELETED_TAG);

  // Accounts that list THIS profile as their main account.
  const incomingAlts = profiles.filter(
    (p) => p.mainAccountUsername === profile.username
  );

  const mainProfile = profile.mainAccountUsername
    ? profiles.find((p) => p.username === profile.mainAccountUsername)
    : null;

  // Candidates for "link as an alt of...": exclude self, and exclude
  // anyone who is already an alt or already has alts pointing to them —
  // the backend would reject those anyway (no chains), so this keeps
  // the dropdown limited to choices that will actually work.
  const linkCandidates = profiles.filter((p) => {
    if (p.username === profile.username) return false;
    if (p.mainAccountUsername) return false;
    if (profiles.some((other) => other.mainAccountUsername === p.username)) return false;
    return true;
  });

  async function applyTag(tag, usernames = [profile.username]) {
    const response = await fetch("/api/profiles/tags/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames, tag })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Could not add tag");
    }
  }

  async function addTag() {
    if (!newTag.trim()) return;

    setTagError("");

    try {
      await applyTag(newTag);
      setNewTag("");
      await onRefresh();
    } catch (err) {
      setTagError(err.message);
    }
  }

  async function removeTag(tag) {
    setTagError("");

    const response = await fetch(
      `/api/profiles/${encodeURIComponent(profile.username)}/tags/${encodeURIComponent(tag)}`,
      { method: "DELETE" }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setTagError(data.error || "Could not remove tag");
      return;
    }

    await onRefresh();
  }

  async function toggleDeleted() {
    setTagError("");

    try {
      if (isDeleted) {
        await removeTag(DELETED_TAG);
      } else {
        await applyTag(DELETED_TAG);
        await onRefresh();
      }
    } catch (err) {
      setTagError(err.message);
    }
  }

  async function linkAltAccount() {
    if (!altAccountChoice) return;

    setAltError("");

    const response = await fetch(
      `/api/profiles/${encodeURIComponent(profile.username)}/alt-account`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainAccountUsername: altAccountChoice })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setAltError(data.error || "Could not link accounts");
      return;
    }

    setAltAccountChoice("");
    await onRefresh();
  }

  async function unlinkAltAccount() {
    setAltError("");

    const response = await fetch(
      `/api/profiles/${encodeURIComponent(profile.username)}/alt-account`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mainAccountUsername: null })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setAltError(data.error || "Could not unlink account");
      return;
    }

    await onRefresh();
  }

  async function deleteProfile() {
    const confirmed = window.confirm(
      `Delete @${profile.username}? This permanently removes the profile and its downloaded photo. This can't be undone.`
    );

    if (!confirmed) return;

    setDeleteError("");

    const response = await fetch("/api/profiles/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [profile.username] })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDeleteError(data.error || "Could not delete profile");
      return;
    }

    await onRefresh();
    onBack();
  }

  const createdDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : null;

  const availableTags = tags.filter(
    (tag) => !(profile.tags || []).includes(tag) && !RESERVED_TAGS.includes(tag)
  );

  return (
    <div className="flex flex-col gap-8">
      <button onClick={onBack} className="text-zinc-500 hover:text-black w-fit">
        ← Back to Profiles
      </button>

      {isDeleted && (
        <div className="bg-red-100 text-red-700 rounded-2xl px-4 py-3 font-medium">
          This profile has been marked as deleted from Instagram.
        </div>
      )}

      <div className="bg-white border rounded-2xl p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-8 items-start">
        <img
          src={
            profile.imagePath
              ? `/${profile.imagePath}`
              : "https://placehold.co/200x200"
          }
          alt={profile.username}
          className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border shrink-0"
        />

        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">@{profile.username}</h1>

              <a
                href={`https://www.instagram.com/${profile.username}/`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-black text-sm"
              >
                View on Instagram ↗
              </a>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={toggleDeleted}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                  isDeleted
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "border hover:bg-zinc-50"
                }`}
              >
                {isDeleted ? "Unmark as Deleted" : "Mark as Deleted"}
              </button>

              <button
                onClick={deleteProfile}
                className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border border-red-200 text-red-700 hover:bg-red-50"
              >
                Delete Profile
              </button>
            </div>
          </div>

          {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}

          <div>
            <div className="text-sm text-zinc-500 mb-2">Tags</div>

            {(profile.tags || []).length ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} onRemove={removeTag} />
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm mb-4">No tags yet.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add a tag..."
                list="existing-tags"
                className="border rounded-xl px-4 py-2 flex-1 min-w-0"
              />

              <datalist id="existing-tags">
                {availableTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>

              <button
                onClick={addTag}
                className="bg-black text-white px-5 py-2 sm:py-0 rounded-xl shrink-0"
              >
                Add
              </button>
            </div>

            {tagError && <p className="text-red-500 text-sm mt-2">{tagError}</p>}
          </div>

          {createdDate && (
            <div className="text-sm text-zinc-400">
              Added on {createdDate}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <div className="font-bold text-lg">Alternate Account</div>
          <p className="text-zinc-500 text-sm mt-1">
            Link this profile to another as its main account, or see which
            accounts are linked to this one.
          </p>
        </div>

        {mainProfile && (
          <div className="flex items-center justify-between gap-4 flex-wrap bg-sky-50 rounded-xl px-4 py-3">
            <span className="text-sm min-w-0">
              This is an alternate account of{" "}
              <button
                onClick={() => onOpenProfile(mainProfile.username)}
                className="font-semibold hover:underline"
              >
                @{mainProfile.username}
              </button>
            </span>

            <button
              onClick={unlinkAltAccount}
              className="text-sm text-zinc-500 hover:text-red-500 whitespace-nowrap"
            >
              Unlink
            </button>
          </div>
        )}

        {incomingAlts.length > 0 && (
          <div className="bg-sky-50 rounded-xl px-4 py-3">
            <div className="text-sm mb-2">
              This is the main account. Alternate account
              {incomingAlts.length > 1 ? "s" : ""}:
            </div>

            <div className="flex flex-wrap gap-2">
              {incomingAlts.map((alt) => (
                <button
                  key={alt.username}
                  onClick={() => onOpenProfile(alt.username)}
                  className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm hover:bg-sky-200"
                >
                  @{alt.username}
                </button>
              ))}
            </div>
          </div>
        )}

        {!mainProfile && incomingAlts.length === 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={altAccountChoice}
              onChange={(e) => setAltAccountChoice(e.target.value)}
              className="border rounded-xl px-4 py-2 flex-1 min-w-0"
            >
              <option value="">Select the main account...</option>

              {linkCandidates.map((p) => (
                <option key={p.username} value={p.username}>
                  @{p.username}
                </option>
              ))}
            </select>

            <button
              onClick={linkAltAccount}
              disabled={!altAccountChoice}
              className="bg-black text-white px-5 py-2 sm:py-0 rounded-xl disabled:opacity-40 shrink-0"
            >
              Link
            </button>
          </div>
        )}

        {altError && <p className="text-red-500 text-sm">{altError}</p>}
      </div>

      <PhotoRefreshPanel
        usernames={[profile.username]}
        title="Profile Photo"
        description="Tries to re-download this profile's photo from Instagram."
        buttonLabel="Refresh Photo"
        onRefresh={onRefresh}
      />
    </div>
  );
}
