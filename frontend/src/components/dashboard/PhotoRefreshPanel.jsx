import React from "react";
import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 1000;

/**
 * Button + progress bar for the photo-download background job. Polls
 * the status endpoint while the job is running, and pulls the latest
 * profiles (via onRefresh) on every poll tick so photos show up as
 * they get downloaded, not just at the end.
 *
 * By default targets every profile in the DB (used on Dashboard/Import).
 * Pass `usernames` to target specific profiles instead (used on the
 * profile detail page for a single one).
 *
 * Note: the job is a single global job shared across the whole app —
 * if two different scopes are triggered close together, the second
 * one just gets a 409 ("already running") until the first finishes.
 * For a single-user personal tool this is an acceptable simplification
 * over building out a multi-job queue.
 */
export default function PhotoRefreshPanel({
  onRefresh,
  usernames,
  title = "Profile Photos",
  description = "Re-downloads the profile photo for every profile in your database. This can take a while for a large list — roughly 2-4 seconds per profile.",
  buttonLabel = "Refresh All Photos"
}) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    // If a refresh was already running (e.g. the user left this page and
    // came back), pick up polling instead of showing a blank button.
    checkStatus();

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkStatus() {
    const res = await fetch("/api/profiles/refresh-photos/status");
    const data = await res.json();

    setStatus(data);

    if (data.running) startPolling();
  }

  function startPolling() {
    clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/profiles/refresh-photos/status");
      const data = await res.json();

      setStatus(data);
      await onRefresh();

      if (!data.running) {
        clearInterval(pollRef.current);
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleClick() {
    setError("");

    const res = await fetch("/api/profiles/refresh-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usernames ? { usernames } : {})
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not start photo refresh");
      if (data.status) setStatus(data.status);
      return;
    }

    setStatus(data.status);
    startPolling();
  }

  const running = Boolean(status?.running);
  const total = status?.total || 0;
  const completed = status?.completed || 0;
  const progressPct = total ? Math.round((completed / total) * 100) : 0;
  const showProgress = status && (running || status.completed > 0);
  const hasNoTargets = Array.isArray(usernames) && usernames.length === 0;

  const label = Array.isArray(usernames) && usernames.length
    ? `${buttonLabel} (${usernames.length})`
    : buttonLabel;

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-bold text-lg">{title}</div>
          <p className="text-zinc-500 text-sm mt-1">{description}</p>
        </div>

        <button
          onClick={handleClick}
          disabled={running || hasNoTargets}
          className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-40 whitespace-nowrap"
        >
          {running ? "Refreshing..." : label}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {status?.error && (
        <p className="text-red-500 text-sm">{status.error}</p>
      )}

      {showProgress && (
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="text-sm text-zinc-500 flex justify-between flex-wrap gap-2">
            <span>
              {completed} / {total} processed
              {running && status.currentUsername
                ? ` — @${status.currentUsername}`
                : ""}
            </span>

            <span>
              {status.succeeded} ok · {status.failed} failed
            </span>
          </div>

          {!running && status.finishedAt && (
            <div className="text-sm text-zinc-500">Done.</div>
          )}
        </div>
      )}
    </div>
  );
}
