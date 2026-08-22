import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Filter,
  GraduationCap,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  addUser,
  deleteFoodReport,
  money,
  removeUser,
  resolveFoodReport,
  topUp,
  updateUser,
  useCanteen,
  type FoodReport,
  type FoodReportCategory,
  type FoodReportStatus,
  type User,
  type UserRole,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Management & Food Reports — College Kitchen" },
      {
        name: "description",
        content: "Campus Administrator control panel: Add and remove users, view and resolve student food quality reports, and oversee canteen operations.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const currentUser = useCanteen((s) => s.currentUser);
  const users = useCanteen((s) => s.users);
  const reports = useCanteen((s) => s.reports);
  const menu = useCanteen((s) => s.menu);
  const orders = useCanteen((s) => s.orders);

  // User Management State
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("student");
  const [newUserProgram, setNewUserProgram] = useState("BSc CSIT");
  const [newUserDepartment, setNewUserDepartment] = useState("Kitchen Staff");
  const [newUserBalance, setNewUserBalance] = useState("500");

  // Food Reports Filter & Resolution State
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<FoodReport | null>(null);
  const [actionStatus, setActionStatus] = useState<FoodReportStatus>("resolved");
  const [adminResponseText, setAdminResponseText] = useState("");

  // Check access: Admin only
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only authorized <strong>Campus Administrators</strong> can access user management and food inspection reports.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login">
            <Button>Sign In as Admin</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.program && u.program.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesStatus = reportStatusFilter === "all" || r.status === reportStatusFilter;
    const matchesCategory = reportCategoryFilter === "all" || r.category === reportCategoryFilter;
    return matchesStatus && matchesCategory;
  });

  // Handle Add User
  const handleAddUser = () => {
    if (!newUserName.trim()) {
      toast.error("Please enter the user's full name.");
      return;
    }

    const res = addUser({
      id: newUserId.trim() || undefined,
      name: newUserName.trim(),
      role: newUserRole,
      program: newUserRole === "student" ? newUserProgram : undefined,
      department: newUserRole !== "student" ? newUserDepartment : undefined,
      balance: newUserRole === "student" ? Number(newUserBalance) || 0 : undefined,
    });

    if (!res.ok) {
      toast.error(res.error || "Failed to add user.");
      return;
    }

    toast.success(`User "${newUserName}" added successfully with ID ${res.user?.id}!`);
    setAddUserOpen(false);
    setNewUserName("");
    setNewUserId("");
    setNewUserBalance("500");
  };

  // Handle Remove User
  const handleRemoveUser = (u: User) => {
    if (u.id === currentUser.id) {
      toast.error("You cannot delete your own active admin account.");
      return;
    }
    if (confirm(`Are you sure you want to permanently remove user "${u.name}" (${u.id})?`)) {
      removeUser(u.id);
      toast.success(`User ${u.name} has been removed from the system.`);
    }
  };

  // Handle Open Resolve Modal
  const handleOpenResolve = (report: FoodReport) => {
    setSelectedReport(report);
    setActionStatus(report.status === "pending" ? "resolved" : report.status);
    setAdminResponseText(report.adminResponse || "");
  };

  // Handle Submit Resolution
  const handleSaveResolution = () => {
    if (!selectedReport) return;
    resolveFoodReport(selectedReport.id, actionStatus, adminResponseText);
    toast.success(`Report #${selectedReport.id} updated to ${actionStatus.toUpperCase()}.`);
    setSelectedReport(null);
  };

  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;
  const avgFoodRating = reports.length
    ? (reports.reduce((sum, r) => sum + r.rating, 0) / reports.length).toFixed(1)
    : "5.0";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Administrator Control Center
            </h1>
            <Badge className="bg-purple-600">Full Authority</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user authorization, review food quality reports, and oversee canteen logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/kitchen">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ChefHat className="h-4 w-4" /> Kitchen Board
            </Button>
          </Link>
          <Link to="/planner">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Utensils className="h-4 w-4" /> Menu Planner
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Users</p>
                <p className="font-display mt-1 text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500/50" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {users.filter((u) => u.role === "student").length} Students · {users.filter((u) => u.role === "staff").length} Staff
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Complaints</p>
                <p className="font-display mt-1 text-3xl font-bold text-red-600">{pendingReportsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{reports.length} Total food feedback logged</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Food Rating</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <p className="font-display text-3xl font-bold">{avgFoodRating}</p>
                  <span className="text-sm text-muted-foreground">/ 5.0</span>
                </div>
              </div>
              <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Based on student reports</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Sales</p>
                <p className="font-display mt-1 text-3xl font-bold text-green-600">{money(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{orders.length} total orders processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl p-1">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span>User Management ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="food-reports" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Food Reports & Complaints ({reports.length})</span>
          </TabsTrigger>
          <TabsTrigger value="canteen-analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Canteen Sales & Portions</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: User Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Campus User Authorization</CardTitle>
                <CardDescription>
                  Full administrative authority to add, remove, and manage Student, Staff, and Admin privileges.
                </CardDescription>
              </div>

              <Button onClick={() => setAddUserOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4" /> Add New User
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID (e.g. CS2201), program, or department..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles ({users.length})</SelectItem>
                    <SelectItem value="student">Students ({users.filter((u) => u.role === "student").length})</SelectItem>
                    <SelectItem value="staff">Staff ({users.filter((u) => u.role === "staff").length})</SelectItem>
                    <SelectItem value="admin">Admins ({users.filter((u) => u.role === "admin").length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">User ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Program / Department</th>
                      <th className="px-4 py-3">Meal Plan Balance</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-semibold text-foreground">{u.id}</td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {u.name}
                            {u.id === currentUser.id && (
                              <Badge variant="outline" className="ml-2 text-[10px]">
                                You
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === "admin" && (
                              <Badge className="bg-purple-600 text-white">Admin</Badge>
                            )}
                            {u.role === "staff" && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Staff (Kitchen)
                              </Badge>
                            )}
                            {u.role === "student" && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700 dark:text-blue-300">
                                Student
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {u.program || u.department || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === "student" && u.balance !== undefined ? (
                              <span className="font-semibold text-foreground">{money(u.balance)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={u.id === currentUser.id}
                              onClick={() => handleRemoveUser(u)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Food Reports & Complaints */}
        <TabsContent value="food-reports" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Student Food Reports & Complaints</CardTitle>
                <CardDescription>
                  Review food temperature, taste, portion, or hygiene issues reported by students and record official resolutions.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending ({reports.filter((r) => r.status === "pending").length})</SelectItem>
                    <SelectItem value="investigating">Investigating ({reports.filter((r) => r.status === "investigating").length})</SelectItem>
                    <SelectItem value="resolved">Resolved ({reports.filter((r) => r.status === "resolved").length})</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={reportCategoryFilter} onValueChange={setReportCategoryFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Quality / Taste">Quality / Taste</SelectItem>
                    <SelectItem value="Cold / Temperature">Cold / Temperature</SelectItem>
                    <SelectItem value="Portion Size">Portion Size</SelectItem>
                    <SelectItem value="Hygiene">Hygiene</SelectItem>
                    <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {filteredReports.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500/60" />
                  <p className="font-semibold text-foreground">No reports match the criteria</p>
                  <p className="text-xs">All student food feedback has been filtered or cleared.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className={`rounded-xl border p-5 transition-all ${
                        report.status === "pending"
                          ? "border-amber-400/60 bg-amber-50/20"
                          : report.status === "investigating"
                          ? "border-blue-400/60 bg-blue-50/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground">{report.foodItemName}</h3>
                          {report.token && <Badge variant="outline">Order Token #{report.token}</Badge>}
                          <Badge variant="secondary">{report.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            by <strong>{report.studentName}</strong> ({report.studentId})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {report.status === "pending" && (
                            <Badge className="border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              ⚠️ Pending Admin Review
                            </Badge>
                          )}
                          {report.status === "investigating" && (
                            <Badge className="border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              🔍 Investigating with Kitchen
                            </Badge>
                          )}
                          {report.status === "resolved" && (
                            <Badge className="bg-green-600 text-white">
                              ✓ Resolved
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stars & Date */}
                      <div className="mt-2 flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < report.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          Logged: {new Date(report.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Complaint Description */}
                      <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                        "{report.description}"
                      </p>

                      {/* Admin Response if available */}
                      {report.adminResponse && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-green-50/70 p-3 text-xs dark:border-green-900 dark:bg-green-950/40">
                          <p className="font-semibold text-green-800 dark:text-green-300">
                            🛡️ Official Resolution Note:
                          </p>
                          <p className="mt-1 text-green-900 dark:text-green-200">{report.adminResponse}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResolve(report)}
                          className="gap-1.5"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {report.status === "resolved" ? "Edit Resolution" : "Resolve / Respond"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this food report?")) {
                              deleteFoodReport(report.id);
                              toast.success("Report deleted.");
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Canteen Analytics */}
        <TabsContent value="canteen-analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Menu Portions & Sales</CardTitle>
                <CardDescription>Portions prepared vs sold today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {menu.map((item) => {
                  const percent = Math.min(100, Math.round((item.sold / (item.quantity || 1)) * 100));
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.sold} / {item.quantity} sold ({percent}%) · {money(item.sold * item.price)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full ${percent > 80 ? "bg-red-500" : percent > 50 ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Administrative Shortcuts</CardTitle>
                <CardDescription>Access all canteen operational portals.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link to="/kitchen" className="block">
                  <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/60">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-6 w-6 text-amber-500" />
                      <div>
                        <h4 className="font-semibold">Live Kitchen Queue</h4>
                        <p className="text-xs text-muted-foreground">Track and update cooking tickets</p>
                      </div>
                    </div>
                    <Badge variant="outline">{orders.filter((o) => o.status !== "served").length} in queue</Badge>
                  </div>
                </Link>

                <Link to="/planner" className="block">
                  <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/60">
                    <div className="flex items-center gap-3">
                      <Utensils className="h-6 w-6 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">Daily Menu Planner</h4>
                        <p className="text-xs text-muted-foreground">Configure dishes, quantities and prices</p>
                      </div>
                    </div>
                    <Badge variant="outline">{menu.length} items</Badge>
                  </div>
                </Link>

                <Link to="/wallet" className="block">
                  <div className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/60">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-6 w-6 text-green-500" />
                      <div>
                        <h4 className="font-semibold">Meal Plan Top-Up Counter</h4>
                        <p className="text-xs text-muted-foreground">Recharge student cards and review ledgers</p>
                      </div>
                    </div>
                    <Badge variant="outline">{users.filter((u) => u.role === "student").length} accounts</Badge>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Modal Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" /> Add New Campus User
            </DialogTitle>
            <DialogDescription>
              Create a new account with customized permissions (Student, Staff, or Admin).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="uName">Full Name *</Label>
              <Input
                id="uName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Ramesh KC, Priya Thapa"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="uId">User ID / Roll No (Optional)</Label>
                <Input
                  id="uId"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Account Role</Label>
                <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student (Order & Dashboard)</SelectItem>
                    <SelectItem value="staff">Staff (Kitchen & Planner)</SelectItem>
                    <SelectItem value="admin">Admin (Full Authority)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newUserRole === "student" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prog">Academic Program</Label>
                  <Input
                    id="prog"
                    value={newUserProgram}
                    onChange={(e) => setNewUserProgram(e.target.value)}
                    placeholder="e.g. BSc CSIT, BE Civil, BBA"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bal">Initial Meal Plan Balance (Rs)</Label>
                  <Input
                    id="bal"
                    inputMode="numeric"
                    value={newUserBalance}
                    onChange={(e) => setNewUserBalance(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="dept">Department / Role Description</Label>
                <Input
                  id="dept"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  placeholder="e.g. Kitchen Head, Counter Operator, Canteen Supervisor"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="bg-purple-600 hover:bg-purple-700">
              Create User Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Food Report Modal Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" /> Resolve Food Quality Complaint
            </DialogTitle>
            <DialogDescription>
              Review student complaint and post an official action / refund note.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-sm">
                <p>
                  <strong>Item:</strong> {selectedReport.foodItemName} {selectedReport.token && `(Token #${selectedReport.token})`}
                </p>
                <p>
                  <strong>Student:</strong> {selectedReport.studentName} ({selectedReport.studentId})
                </p>
                <p>
                  <strong>Category:</strong> {selectedReport.category} · Rating: {selectedReport.rating}/5
                </p>
                <p className="mt-1 text-xs text-muted-foreground italic">"{selectedReport.description}"</p>
              </div>

              <div className="space-y-1.5">
                <Label>Update Status</Label>
                <Select value={actionStatus} onValueChange={(v) => setActionStatus(v as FoodReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="investigating">Investigating with Kitchen Staff</SelectItem>
                    <SelectItem value="resolved">Resolved (Action Taken)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminResp">Admin Official Response / Resolution Note</Label>
                <Textarea
                  id="adminResp"
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="e.g. Kitchen team was notified to inspect cooking temperature; Rs 50 credit refunded to student wallet."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveResolution} className="bg-purple-600 hover:bg-purple-700">
              Save Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
