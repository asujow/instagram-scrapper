import { useState } from "react";

export default function ImportBox({ onImport }) {
  const [text, setText] = useState("");

  async function handleImport() {
    await fetch("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    setText("");

    onImport();
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="border rounded p-4 h-48"
        placeholder="Paste Instagram URLs or usernames"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="bg-black text-white rounded p-3"
        onClick={handleImport}
      >
        Import
      </button>
    </div>
  );
}