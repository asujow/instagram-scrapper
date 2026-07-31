import React from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function Layout({
  children,
  currentPage,
  onNavigate
}) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col md:flex-row">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      <header className="md:hidden bg-black text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold">IG Tagger</span>
      </header>

      {/* Extra bottom padding on mobile so content never sits under the
          fixed bottom nav bar. */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto min-w-0">
        {children}
      </main>

      <BottomNav
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
    </div>
  );
}
