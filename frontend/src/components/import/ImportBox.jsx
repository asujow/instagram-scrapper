import { useState } from "react";

export default function ImportBox({
  onImport
}) {
  const [text, setText] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleImport() {
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        "/api/import",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            text
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Import failed"
        );
      }

      setSuccess(
        `Imported ${data.added} profiles`
      );

      setText("");

      onImport();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function handleTxtUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setError(
        "Please upload a TXT file"
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const text = await file.text();

      const res = await fetch(
        "/api/import",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            text
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "TXT import failed"
        );
      }

      setSuccess(
        `Imported ${data.added} profiles`
      );

      onImport();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function handleJsonUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError(
        "Please upload a JSON file"
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const text = await file.text();

      const json = JSON.parse(text);

      const res = await fetch(
        "/api/import-json",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify(json)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "JSON import failed"
        );
      }

      setSuccess(
        "JSON database loaded"
      );

      onImport();
    } catch (err) {
      setError(
        err.message ||
          "Invalid JSON file"
      );
    }

    setLoading(false);
  }

  return (
    <div className="bg-white border rounded-2xl p-6 flex flex-col gap-6">
      <textarea
        className="border rounded-xl p-4 h-64 resize-none"
        placeholder="Paste Instagram URLs or usernames..."
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
      />

      <button
        className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
        onClick={handleImport}
        disabled={loading}
      >
        {loading
          ? "Importing..."
          : "Import Profiles"}
      </button>

      <div className="border-t pt-4 flex flex-col gap-4">
        <div>
          <div className="font-semibold mb-2">
            Upload TXT
          </div>

          <input
            type="file"
            accept=".txt"
            onChange={handleTxtUpload}
          />
        </div>

        <div>
          <div className="font-semibold mb-2">
            Load JSON Database
          </div>

          <input
            type="file"
            accept=".json"
            onChange={handleJsonUpload}
          />
        </div>
      </div>

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