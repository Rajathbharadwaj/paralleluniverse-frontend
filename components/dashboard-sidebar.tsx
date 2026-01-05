"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Settings,
  LogOut,
  Calendar,
  LayoutDashboard,
  Workflow,
  Network,
  Clock,
  Megaphone,
  Sparkles,
  BarChart3,
  Plug,
  Brain,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAds?: boolean;
  section?: string;
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { data: subscription } = useSubscription();
  const { replayTour } = useOnboarding();

  const adsPlans = ["pro_plus", "ultimate"];
  const hasAdsAccess = subscription?.plan && adsPlans.includes(subscription.plan);

  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "main" },
    { href: "/engage", label: "Engage", icon: Brain, section: "growth" },
    { href: "/workflows", label: "Workflows", icon: Workflow, section: "growth" },
    { href: "/automations", label: "Automations", icon: Clock, section: "growth" },
    { href: "/content", label: "Content", icon: Calendar, section: "content" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, section: "insights" },
    { href: "/competitors", label: "Competitors", icon: Network, section: "insights" },
    { href: "/ads", label: "Ads", icon: Megaphone, requiresAds: true, section: "insights" },
    { href: "/integrations", label: "Integrations", icon: Plug, section: "settings" },
    { href: "/settings", label: "Settings", icon: Settings, section: "settings" },
  ].filter(item => !item.requiresAds || hasAdsAccess);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  const sections = {
    main: { label: null, items: navItems.filter(i => i.section === "main") },
    growth: { label: "Growth", items: navItems.filter(i => i.section === "growth") },
    content: { label: "Content", items: navItems.filter(i => i.section === "content") },
    insights: { label: "Insights", items: navItems.filter(i => i.section === "insights") },
    settings: { label: "Settings", items: navItems.filter(i => i.section === "settings") },
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    const linkContent = (
      <Link href={item.href} className="w-full">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-10",
            collapsed && "justify-center px-2"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Button>
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col h-screen bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 40 20" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 10C20 10 15 3 9 3C4.5 3 2 6.5 2 10C2 13.5 4.5 17 9 17C15 17 20 10 20 10ZM20 10C20 10 25 17 31 17C35.5 17 38 13.5 38 10C38 6.5 35.5 3 31 3C25 3 20 10 20 10Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold truncate">Parallel Universe</h1>
              <p className="text-xs text-muted-foreground truncate">AI X Growth</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {Object.entries(sections).map(([key, section]) => (
            <div key={key}>
              {section.label && !collapsed && (
                <p className="text-xs font-medium text-muted-foreground px-3 mb-2 uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && section.items.length > 0 && (
                <div className="h-px bg-border mx-2 mb-2" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start gap-2")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-12",
                  collapsed ? "justify-center px-2" : "justify-start gap-3"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback className="text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {subscription?.plan || "Free"}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={replayTour}>
                <Sparkles className="mr-2 h-4 w-4" />
                Replay Product Tour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openUserProfile()}>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
