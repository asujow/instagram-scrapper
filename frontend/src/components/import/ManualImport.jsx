import React from "react";
import { useState } from "react";

export default function ManualImport({ onImport }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleImport() {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setSuccess(`Imported ${data.added} profiles`);
      setText("");
      await onImport(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <textarea
        className="border rounded-xl p-4 h-64 resize-none"
        placeholder="Paste Instagram URLs or usernames..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? "Importing..." : "Import Profiles"}
      </button>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-xl">
          {success}
        </div>
      )}
    </div>
  );
}
