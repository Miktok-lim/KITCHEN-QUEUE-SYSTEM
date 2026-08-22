import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  GraduationCap,
  ChefHat,
  Shield,
  LogOut,
  UserCheck,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  login,
  logout,
  money,
  useCanteen,
  type User,
  type UserRole,
} from "../lib/canteen-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "College Kitchen — Campus Canteen Management" },
      {
        name: "description",
        content:
          "Manage the college canteen: student meal ordering, student dashboard, kitchen board, daily menu planning, and admin food quality inspection.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function SiteHeader() {
  const currentUser = useCanteen((s) => s.currentUser);
  const users = useCanteen((s) => s.users);
  const orders = useCanteen((s) => s.orders);
  const navigate = useNavigate();

  const handleSwitchUser = (user: User) => {
    login(user.id);
    if (user.role === "student") navigate({ to: "/" });
    else if (user.role === "staff") navigate({ to: "/kitchen" });
    else if (user.role === "admin") navigate({ to: "/admin" });
  };

  const handleSignOut = () => {
    logout();
    navigate({ to: "/login" });
  };

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "staff":
        return <ChefHat className="h-4 w-4 text-amber-600" />;
      case "student":
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span>College Kitchen</span>
          </Link>

          {/* Role-tailored Navigation Links */}
          <nav className="flex flex-wrap items-center gap-x-1 sm:gap-x-2 text-sm">
            {/* Student Navigation */}
            {(!currentUser || currentUser.role === "student") && (
              <>
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Order Food
                </Link>
                {currentUser && (
                  <Link
                    to="/dashboard"
                    className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                  >
                    My Dashboard & Tokens
                  </Link>
                )}
              </>
            )}

            {/* Staff Navigation */}
            {currentUser?.role === "staff" && (
              <>
                <Link
                  to="/kitchen"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Kitchen Board
                </Link>
                <Link
                  to="/planner"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Menu Planner
                </Link>
              </>
            )}

            {/* Admin Navigation */}
            {currentUser?.role === "admin" && (
              <>
                <Link
                  to="/admin"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Admin Center
                </Link>
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Order Kiosk
                </Link>
                <Link
                  to="/kitchen"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Kitchen Board
                </Link>
                <Link
                  to="/planner"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Menu Planner
                </Link>
                <Link
                  to="/wallet"
                  className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-secondary font-semibold text-foreground" }}
                >
                  Meal Plans
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User Persona & Role Switcher */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-background shadow-sm">
                  {getRoleIcon(currentUser.role)}
                  <span className="max-w-[130px] truncate font-medium sm:max-w-none">
                    {currentUser.name}
                  </span>
                  <Badge
                    variant={
                      currentUser.role === "admin"
                        ? "default"
                        : currentUser.role === "staff"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px] uppercase"
                  >
                    {currentUser.role}
                  </Badge>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {currentUser.id} · {currentUser.program || currentUser.department}
                    </p>
                    {currentUser.balance !== undefined && (
                      <p className="text-xs font-bold text-primary">Balance: {money(currentUser.balance)}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Switch Active Role Demo:
                </DropdownMenuLabel>

                {users.slice(0, 5).map((u) => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {getRoleIcon(u.role)}
                      <span>{u.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {u.role}
                    </Badge>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/login" className="flex items-center gap-2 text-xs cursor-pointer">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>View All Accounts / Portals</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-xs text-red-600 focus:text-red-700 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gap-1.5">
                <UserCheck className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
