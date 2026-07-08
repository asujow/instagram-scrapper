import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({
  children,
  currentPage,
  onNavigate
}) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}