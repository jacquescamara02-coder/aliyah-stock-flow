import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MarginTracker } from "@/components/MarginTracker";
import { CommandSearch } from "@/components/CommandSearch";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-2 border-b border-border">
          <MarginTracker />
          <CommandSearch />
        </div>
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
