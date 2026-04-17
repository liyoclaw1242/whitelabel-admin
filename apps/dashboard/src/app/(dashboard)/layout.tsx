"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import {
  Avatar,
  AvatarFallback,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useTheme,
} from "@whitelabel/ui";
import {
  BellIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";

interface NavItem {
  title: string;
  href: string;
  icon: typeof HomeIcon;
  permission?: string;
}

const navItems: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Users", href: "/users", icon: UsersIcon, permission: "users.read" },
  { title: "Theme Editor", href: "/theme-editor", icon: PaletteIcon, permission: "theme.edit" },
];

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, logout } = useAuth();
  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip="Whitelabel Admin">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboardIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Whitelabel</span>
                <span className="truncate text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" tooltip="User menu" data-testid="user-menu" />}>
                <Avatar className="size-8">
                  <AvatarFallback>{(user?.name ?? "U").slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name ?? "Guest"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "—"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem>
                  <UserIcon className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="logout-button"
                  onSelect={() => {
                    logout();
                    router.replace("/login");
                  }}
                >
                  <LogOutIcon className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const label = segment.charAt(0).toUpperCase() + segment.slice(1);
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
      onClick={toggleColorMode}
    >
      {colorMode === "light" ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
    </Button>
  );
}

function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4 ring-1 ring-border/60 ring-inset">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <DashboardBreadcrumb />
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="h-8 w-48 pl-8 lg:w-64"
          />
        </div>
        <Button variant="ghost" size="icon-sm" className="sm:hidden" aria-label="Search">
          <SearchIcon className="size-4" />
        </Button>
        <ColorModeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <BellIcon className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="User menu" />}>
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <UserIcon className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
