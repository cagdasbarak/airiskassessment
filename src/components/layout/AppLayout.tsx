import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true} className="no-print">
      <AppSidebar />
      <SidebarInset className={cn(
        "relative min-h-screen transition-colors duration-500",
        "bg-background",
        "before:fixed before:inset-0 before:z-0 before:bg-gradient-mesh before:opacity-40 before:pointer-events-none before:no-print",
        className
      )}>
        <div className="relative z-10 w-full h-full flex flex-col">
          {container ? (
            <main className={cn(
              "flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full print:p-0 print:max-w-none",
              contentClassName
            )}>
              {children}
            </main>
          ) : (
            <main className="flex-1 w-full print:p-0">{children}</main>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}