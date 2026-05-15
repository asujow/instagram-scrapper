import { useState } from "react";

export default function TxtUpload({ onImport }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleTxtUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setError("Please upload a TXT file");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const text = await file.text();

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "TXT import failed");
      }

      setSuccess(`Imported ${data.added} profiles`);
      onImport();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-semibold mb-2">Upload TXT</div>
      <input type="file" accept=".txt" onChange={handleTxtUpload} />

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
        <div className="text-zinc-500">Importing TXT...</div>
      )}
    </div>
  );
}
