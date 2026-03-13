"use client";
import Topbar from "@/components/shell/Topbar";
import LeftNav from "@/components/shell/LeftNav";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navCollapsed, setNavCollapsed] = useState(false);
  return (
    <div>
      <Topbar onToggleNav={() => setNavCollapsed((c) => !c)} />
      <div className="pt-14 grid grid-cols-[72px,1fr] h-[calc(100vh-56px)]">
        <LeftNav collapsed={navCollapsed} />
        <main className="overflow-auto">
          <div className="max-w-[1320px] pl-6 pr-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
