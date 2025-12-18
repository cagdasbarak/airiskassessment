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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className={cn("bg-secondary/10 min-h-screen", className)}>
        {container ? (
          <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full", contentClassName)}>
            {children}
          </div>
        ) : (
          children
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}