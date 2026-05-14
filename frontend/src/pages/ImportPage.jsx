import ImportBox from "../components/import/ImportBox";

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

      <ImportBox onImport={onImport} />
    </div>
  );
}