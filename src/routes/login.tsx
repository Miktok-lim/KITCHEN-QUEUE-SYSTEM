import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Shield,
  Utensils,
  GraduationCap,
  ChefHat,
  ArrowRight,
  UserCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { login, loginAsRole, useCanteen, type User, type UserRole } from "@/lib/canteen-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login & Portal Access — College Kitchen" },
      {
        name: "description",
        content:
          "Sign in to access your role-based canteen dashboard: Student ordering, Kitchen staff board, or Campus Admin management.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const currentUser = useCanteen((s) => s.currentUser);
  const users = useCanteen((s) => s.users);

  const [customId, setCustomId] = useState("");
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>("student");

  const students = users.filter((u) => u.role === "student");
  const staffMembers = users.filter((u) => u.role === "staff");
  const admins = users.filter((u) => u.role === "admin");

  const handleSelectUser = (user: User) => {
    login(user.id);
    toast.success(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
    redirectByRole(user.role);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) {
      toast.error("Please enter your User ID or Roll Number.");
      return;
    }
    const res = login(customId.trim());
    if (!res.ok || !res.user) {
      toast.error(res.error || "User ID not recognized.");
      return;
    }
    toast.success(`Welcome back, ${res.user.name}!`);
    redirectByRole(res.user.role);
  };

  const redirectByRole = (role: UserRole) => {
    if (role === "student") {
      navigate({ to: "/" });
    } else if (role === "staff") {
      navigate({ to: "/kitchen" });
    } else if (role === "admin") {
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/40 to-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            Campus Canteen Portal
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome to College Kitchen
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Select your campus role or enter your credentials to access customized ordering, live
            kitchen operations, or full administrative control.
          </p>
        </div>

        {/* Current logged in status if any */}
        {currentUser && (
          <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">Currently active account:</span>
              <span className="font-semibold text-foreground">{currentUser.name}</span>
              <Badge
                variant={
                  currentUser.role === "admin"
                    ? "default"
                    : currentUser.role === "staff"
                      ? "secondary"
                      : "outline"
                }
              >
                {currentUser.role.toUpperCase()}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => redirectByRole(currentUser.role)}>
                Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Role Quick Selector Tabs */}
        <Tabs
          value={selectedRoleTab}
          onValueChange={(v) => setSelectedRoleTab(v as UserRole)}
          className="w-full"
        >
          <TabsList className="grid h-14 w-full grid-cols-3 rounded-xl p-1 shadow-sm">
            <TabsTrigger
              value="student"
              className="flex items-center gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="font-semibold">Student Portal</span>
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="flex items-center gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm"
            >
              <ChefHat className="h-4 w-4" />
              <span className="font-semibold">Kitchen Staff</span>
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="flex items-center gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4" />
              <span className="font-semibold">Campus Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Student Tab */}
          <TabsContent value="student" className="mt-6">
            <Card className="border-t-4 border-t-blue-500 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Student Sign-In</CardTitle>
                      <CardDescription>
                        Order food, track real-time meal tokens, manage wallet balance & submit
                        quality feedback.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  >
                    Role: Student
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick 1-Click Demo Logins
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {students.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectUser(st)}
                        className="group flex flex-col items-start rounded-xl border border-border p-3.5 text-left transition-all hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-sm dark:hover:bg-blue-950/20"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {st.id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Rs {st.balance ?? 0}
                          </span>
                        </div>
                        <span className="mt-1 font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {st.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{st.program}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Student Access Rights:</span>
                  </div>
                  <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <li>✓ Browse daily menu & place meal orders</li>
                    <li>✓ Pay via campus prepaid meal plan or cash</li>
                    <li>✓ Live token tracker & status in Student Dashboard</li>
                    <li>✓ Report food quality issues & track resolution</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="mt-6">
            <Card className="border-t-4 border-t-amber-500 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Kitchen Staff Sign-In</CardTitle>
                      <CardDescription>
                        Live order queue management, cooking pipeline, and daily menu portion
                        planning.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  >
                    Role: Staff
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Staff Account
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {staffMembers.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => handleSelectUser(staff)}
                        className="group flex flex-col items-start rounded-xl border border-border p-4 text-left transition-all hover:border-amber-500 hover:bg-amber-50/50 hover:shadow-sm dark:hover:bg-amber-950/20"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {staff.id}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            Active Shift
                          </Badge>
                        </div>
                        <span className="mt-1 font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                          {staff.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{staff.department}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Kitchen Staff Access Rights:</span>
                  </div>
                  <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <li>✓ Kitchen Board: Queued ➔ Preparing ➔ Ready ➔ Served</li>
                    <li>✓ Menu Planner: Adjust daily portions & prices</li>
                    <li>✓ Toggle items on/off menu based on kitchen stock</li>
                    <li>✗ User accounts & sensitive reports restricted</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="mt-6">
            <Card className="border-t-4 border-t-purple-500 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Campus Administrator Sign-In</CardTitle>
                      <CardDescription>
                        Complete authority: Add/remove users, investigate food complaints, & review
                        financial reports.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                  >
                    Role: Administrator
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Administrator Account
                  </h3>
                  <div className="grid gap-3">
                    {admins.map((adm) => (
                      <button
                        key={adm.id}
                        onClick={() => handleSelectUser(adm)}
                        className="group flex flex-col items-start rounded-xl border border-border p-4 text-left transition-all hover:border-purple-500 hover:bg-purple-50/50 hover:shadow-sm dark:hover:bg-purple-950/20"
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            {adm.id}
                          </span>
                          <Badge className="bg-purple-600 text-[10px]">Super Admin</Badge>
                        </div>
                        <span className="mt-1 font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {adm.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{adm.department}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Administrator Full Authority:</span>
                  </div>
                  <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <li>✓ User Management: Add & Remove Students, Staff & Admins</li>
                    <li>✓ Food Complaints & Reports: Review, investigate, resolve</li>
                    <li>✓ Meal Plan Wallet top-ups & balance overrides</li>
                    <li>✓ Full access to Order Kiosk, Kitchen & Menu Planner</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Manual ID Input Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Or Sign In with User ID / Roll Number</CardTitle>
            <CardDescription>
              Enter any existing ID (e.g. <code>CS2201</code>, <code>STAFF01</code>,{" "}
              <code>ADMIN01</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomLogin} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="Enter User ID (e.g. CS2201)"
                  className="uppercase"
                />
              </div>
              <Button type="submit">
                <KeyRound className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
