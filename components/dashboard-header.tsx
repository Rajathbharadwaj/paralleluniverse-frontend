"use client";

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
import { Settings, LogOut, Calendar, LayoutDashboard, Workflow, Network, Clock, Megaphone, Sparkles, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboarding } from "@/hooks/useOnboarding";

export function DashboardHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const { data: subscription } = useSubscription();
  const { replayTour } = useOnboarding();

  // Plans that have access to Ads feature
  const adsPlans = ["pro_plus", "ultimate"];
  const hasAdsAccess = subscription?.plan && adsPlans.includes(subscription.plan);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/workflows", label: "Workflows", icon: Workflow },
    { href: "/content", label: "Content Calendar", icon: Calendar },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/ads", label: "Ads", icon: Megaphone, requiresAds: true },
    { href: "/competitors", label: "Competitors", icon: Network },
    { href: "/automations", label: "Automations", icon: Clock },
    { href: "/settings", label: "Settings", icon: Settings },
  ].filter(item => !item.requiresAds || hasAdsAccess);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/sign-in" });
  };

  const handleSettings = () => {
    openUserProfile();
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <svg viewBox="0 0 40 20" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20 10C20 10 15 3 9 3C4.5 3 2 6.5 2 10C2 13.5 4.5 17 9 17C15 17 20 10 20 10ZM20 10C20 10 25 17 31 17C35.5 17 38 13.5 38 10C38 6.5 35.5 3 31 3C25 3 20 10 20 10Z"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Parallel Universe</h1>
              <p className="text-sm text-muted-foreground">AI-powered X growth on autopilot</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={replayTour}>
                <Sparkles className="mr-2 h-4 w-4" />
                Replay Product Tour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

