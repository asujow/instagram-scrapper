/**
 * Fetches `url`, parses the JSON response, and throws a plain Error
 * with the server's message if the response wasn't ok. Centralizes the
 * "fetch, parse, check response.ok, fall back to a generic message"
 * pattern that used to be hand-copied with small variations across
 * every component that talks to the backend — callers just wrap this
 * in their own try/catch (or .catch) to set their own error state.
 */
export async function apiFetch(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    // Some endpoints return extra fields alongside `error` on failure
    // (e.g. refresh-photos' 409 also includes the current job status) —
    // attach the whole body so a caller that needs it doesn't have to
    // bypass this helper just to get at it.
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Convenience wrapper for a JSON request body — sets the header and
 * stringifies the body for you.
 *
 * Usage: apiFetch(url, { method: "POST", ...jsonBody({ tag: "x" }) })
 */
export function jsonBody(body) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
