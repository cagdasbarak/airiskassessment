import React from "react";
import { Home, FileText, History, Settings, ShieldAlert, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
export function AppSidebar(): JSX.Element {
  const logout = useAppStore.getState().logout;
  const username = useAppStore.getState().username ?? 'Guest';
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };
  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/" },
    { title: "Reports", icon: FileText, path: "/reports" },
    { title: "Audit Logs", icon: History, path: "/logs" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];
  return (
    <Sidebar collapsible="none" className="border-r border-border/50">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F38020] shadow-lg">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground">RiskGuard AI</span>
            <span className="text-xs text-muted-foreground">Cloudflare ZTNA</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {(() => {
              const path = window.location.pathname;
              return menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={path === item.path}
                    className="py-6"
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ));
            })()}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{username}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Session</span>
          </div>
        </div>
        <SidebarMenuButton
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}