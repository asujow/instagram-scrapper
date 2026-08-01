import React from "react";
import { useState } from "react";

import { apiFetch, jsonBody } from "../../utils/api";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Editing controls for a profile: nickname (free text, searchable,
 * doesn't have to be unique), username (renaming cascades on the
 * backend — updates any alt-account links pointing here, renames the
 * downloaded photo file), and a custom photo upload.
 */
export default function ProfileEditPanel({ profile, onRefresh, onUsernameChanged }) {
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [nicknameError, setNicknameError] = useState("");

  const [username, setUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState("");

  const [photoError, setPhotoError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  async function saveNickname() {
    setNicknameError("");

    try {
      await apiFetch(`/api/profiles/${encodeURIComponent(profile.username)}/nickname`, {
        method: "PUT",
        ...jsonBody({ nickname: nickname.trim() || null })
      });
      await onRefresh();
    } catch (err) {
      setNicknameError(err.message);
    }
  }

  async function saveUsername() {
    const trimmed = username.trim().toLowerCase();

    if (!trimmed || trimmed === profile.username) return;

    setUsernameError("");

    try {
      await apiFetch(`/api/profiles/${encodeURIComponent(profile.username)}/username`, {
        method: "PUT",
        ...jsonBody({ newUsername: trimmed })
      });
      await onRefresh();
      // The profile now lives under the new username — follow it,
      // otherwise the detail page would show "not found" (it's still
      // looking for the old one).
      onUsernameChanged(trimmed);
    } catch (err) {
      setUsernameError(err.message);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again later

    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(`Image too large — max ${MAX_PHOTO_BYTES / 1024 / 1024}MB`);
      return;
    }

    setPhotoError("");
    setPhotoUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);

      await apiFetch(`/api/profiles/${encodeURIComponent(profile.username)}/photo`, {
        method: "POST",
        ...jsonBody({ dataUrl })
      });

      await onRefresh();
    } catch (err) {
      setPhotoError(err.message);
    }

    setPhotoUploading(false);
  }

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-5">
      <div className="font-bold text-lg">Edit Profile</div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-500">Nickname</label>
        <p className="text-xs text-zinc-400 -mt-1">
          A separate, searchable name. Doesn't replace the username, and
          can repeat across profiles.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveNickname()}
            placeholder="No nickname set"
            className="border rounded-xl px-4 py-2 flex-1 min-w-0"
          />

          <button
            onClick={saveNickname}
            className="bg-black text-white px-5 py-2 sm:py-0 rounded-xl shrink-0"
          >
            Save
          </button>
        </div>

        {nicknameError && <p className="text-red-500 text-sm">{nicknameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-500">Username</label>
        <p className="text-xs text-zinc-400 -mt-1">
          Renaming updates any alt-account links pointing here and keeps
          the downloaded photo attached to the new name.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveUsername()}
            className="border rounded-xl px-4 py-2 flex-1 min-w-0"
          />

          <button
            onClick={saveUsername}
            disabled={!username.trim() || username.trim().toLowerCase() === profile.username}
            className="bg-black text-white px-5 py-2 sm:py-0 rounded-xl disabled:opacity-40 shrink-0"
          >
            Save
          </button>
        </div>

        {usernameError && <p className="text-red-500 text-sm">{usernameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-500">Profile photo</label>
        <p className="text-xs text-zinc-400 -mt-1">
          Upload a custom photo (JPEG, PNG, or WEBP, max 8MB) — replaces
          the current one, whether it was scraped or uploaded before.
        </p>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          disabled={photoUploading}
          className="max-w-full"
        />

        {photoUploading && <p className="text-zinc-500 text-sm">Uploading...</p>}
        {photoError && <p className="text-red-500 text-sm">{photoError}</p>}
      </div>
    </div>
  );
}
