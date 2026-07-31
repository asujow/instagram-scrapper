import React from "react";

const items = [
  { id: "dashboard", label: "Dashboard" },
  { id: "import", label: "Import" },
  { id: "profiles", label: "Profiles" },
  { id: "tags", label: "Tags" }
];

// Mobile only — replaces the sidebar below the md breakpoint. Fixed to
// the bottom of the viewport, which is the natural thumb-reach zone on
// a phone (unlike a top bar, which pushes navigation to the hardest
// spot to reach one-handed).
export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-black text-white flex justify-around items-stretch pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex-1 py-3 text-xs font-medium transition ${
            currentPage === item.id ? "text-white" : "text-zinc-400"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
