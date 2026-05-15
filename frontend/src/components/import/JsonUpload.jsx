import { useState } from "react";

export default function JsonUpload({ onImport }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleJsonUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("Please upload a JSON file");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/import-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(json)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "JSON import failed");
      }

      setSuccess("JSON database loaded");
      onImport();
    } catch (err) {
      setError(err.message || "Invalid JSON file");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-semibold mb-2">Load JSON Database</div>
      <input type="file" accept=".json" onChange={handleJsonUpload} />

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

      {loading && (
        <div className="text-zinc-500">Loading JSON...</div>
      )}
    </div>
  );
}
