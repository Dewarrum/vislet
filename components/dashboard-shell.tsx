"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Building2Icon, LayoutDashboardIcon, TagsIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    label: "Overview",
  },
  {
    href: "/dashboard/bank-accounts",
    icon: Building2Icon,
    label: "Bank accounts",
  },
  {
    href: "/dashboard/categories",
    icon: TagsIcon,
    label: "Categories",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <DashboardShellContent pathname={pathname}>
        {children}
      </DashboardShellContent>
    </SidebarProvider>
  );
}

type DashboardShellContentProps = {
  children: React.ReactNode;
  pathname: string;
};

function DashboardShellContent({
  children,
  pathname,
}: DashboardShellContentProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/70">
            Vislet
          </p>
          <p className="font-semibold text-sidebar-foreground">Dashboard</p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActivePath(pathname, item.href)}
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        render={<Link href={item.href} />}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <p className="font-semibold text-slate-900">Dashboard</p>
            </div>
            <UserButton />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </>
  );
}
