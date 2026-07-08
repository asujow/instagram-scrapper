import ManualImport from "../components/import/ManualImport";
import TxtUpload from "../components/import/TxtUpload";
import JsonUpload from "../components/import/JsonUpload";
import React from "react";

export default function ImportPage({
  onImport
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">
          Import Profiles
        </h1>

        <p className="text-zinc-500 mt-2">
          Paste Instagram URLs, usernames or upload files
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 flex flex-col gap-6">
        <ManualImport onImport={onImport} />

        <div className="border-t pt-4 flex flex-col gap-4">
          <TxtUpload onImport={onImport} />
          <JsonUpload onImport={onImport} />
        </div>
      </div>
    </div>
  );
}