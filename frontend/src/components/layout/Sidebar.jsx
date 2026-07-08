import React from "react";
const items = [
  {
    id: "dashboard",
    label: "Dashboard"
  },
  {
    id: "import",
    label: "Import"
  },
  {
    id: "profiles",
    label: "Profiles"
  },
  {
    id: "tags",
    label: "Tags"
  }
];

export default function Sidebar({
  currentPage,
  onNavigate
}) {
  return (
    <aside className="w-64 bg-black text-white p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">
          IG Tagger
        </h1>

        <p className="text-zinc-400 text-sm mt-1">
          Instagram Profile Manager
        </p>
      </div>

      <nav className="flex flex-col gap-2 mt-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`text-left px-4 py-3 rounded-xl transition ${
              currentPage === item.id
                ? "bg-white text-black"
                : "hover:bg-zinc-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}