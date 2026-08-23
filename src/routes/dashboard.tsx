import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  MessageSquarePlus,
  Package,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Utensils,
  Wallet,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecommendTomorrowDialog } from "@/components/recommend-tomorrow-dialog";
import {
  cancelOrder,
  deleteTomorrowRecommendation,
  getDishImage,
  money,
  submitFoodReport,
  useCanteen,
  voteTomorrowRecommendation,
  type FoodReportCategory,
  type Order,
  type OrderStatus,
  type TomorrowRecommendation,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard & Order Tracker — College Kitchen" },
      {
        name: "description",
        content:
          "Track live meal tokens, view your canteen order history, recommend dishes for tomorrow's menu, check prepaid meal plan balance, and submit food quality reports.",
      },
    ],
  }),
  component: StudentDashboard,
});

const ISSUE_CATEGORIES: FoodReportCategory[] = [
  "Quality / Taste",
  "Cold / Temperature",
  "Portion Size",
  "Hygiene",
  "Wrong Item",
  "Other",
];

function StudentDashboard() {
  const currentUser = useCanteen((s) => s.currentUser);
  const orders = useCanteen((s) => s.orders);
  const transactions = useCanteen((s) => s.transactions);
  const reports = useCanteen((s) => s.reports);
  const recommendations = useCanteen((s) => s.recommendations);
  const menu = useCanteen((s) => s.menu);

  // Modal state for submitting food report
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [reportCategory, setReportCategory] = useState<FoodReportCategory>("Quality / Taste");
  const [reportRating, setReportRating] = useState(3);
  const [reportDescription, setReportDescription] = useState("");
  const [relatedToken, setRelatedToken] = useState<number | undefined>(undefined);
  const [recommendDialogOpen, setRecommendDialogOpen] = useState(false);
  const [recFilter, setRecFilter] = useState<"all" | "mine" | "accepted">("all");

  // If not logged in, prompt sign in
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign In to View Your Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You must be signed in with your student account to view live tokens, past orders, and meal
          plan credit.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button>Sign In to Portal</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter orders for the current user
  const myOrders = orders.filter(
    (o) =>
      (o.studentId && o.studentId.toLowerCase() === currentUser.id.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase() === currentUser.name.toLowerCase()),
  );

  const activeOrders = myOrders.filter((o) => o.status !== "served" && o.status !== "cancelled");
  const pastOrders = myOrders.filter((o) => o.status === "served" || o.status === "cancelled");
  const myReports = reports.filter(
    (r) => r.studentId.toLowerCase() === currentUser.id.toLowerCase(),
  );
  const myTransactions = transactions.filter(
    (t) => t.studentId.toLowerCase() === currentUser.id.toLowerCase(),
  );

  const handleOpenReportModal = (foodName?: string, tokenNum?: number) => {
    if (foodName) setSelectedItemName(foodName);
    if (tokenNum) setRelatedToken(tokenNum);
    setReportOpen(true);
  };

  const handleSubmitReport = () => {
    if (!selectedItemName.trim()) {
      toast.error("Please specify which dish or food item you are reporting.");
      return;
    }
    if (!reportDescription.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }

    const res = submitFoodReport({
      token: relatedToken,
      foodItemName: selectedItemName.trim(),
      category: reportCategory,
      rating: reportRating,
      description: reportDescription.trim(),
    });

    if (!res.ok) {
      toast.error(res.error || "Could not submit report.");
      return;
    }

    toast.success("Food issue report submitted to Admin & Kitchen!");
    setReportOpen(false);
    setSelectedItemName("");
    setReportDescription("");
    setRelatedToken(undefined);
  };

  const handleDiscardOrder = (order: Order) => {
    const refundNote =
      order.payment === "wallet"
        ? ` ${money(order.total)} will be refunded to your meal plan balance.`
        : "";
    if (confirm(`Are you sure you want to discard / cancel Order #${order.token}?${refundNote}`)) {
      const res = cancelOrder(order.id);
      if (res.ok) {
        toast.success(
          `Order #${order.token} has been discarded.${refundNote ? ` Refunded ${money(order.total)} to your wallet.` : ""}`,
        );
      } else {
        toast.error(res.error || "Could not discard order.");
      }
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "queued":
      case "preparing":
        return (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          >
            🟡 In Kitchen
          </Badge>
        );
      case "ready":
        return (
          <Badge className="animate-pulse bg-green-600 text-white">🟢 Ready for Pickup!</Badge>
        );
      case "served":
        return <Badge variant="secondary">⚪ Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">🔴 Discarded</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header Profile Banner */}
      <div className="mb-8 rounded-2xl bg-card border p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{currentUser.name}</h1>
                <Badge variant={currentUser.role === "admin" ? "default" : "secondary"}>
                  {currentUser.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                ID: <span className="font-semibold text-foreground">{currentUser.id}</span> ·{" "}
                {currentUser.program || currentUser.department}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser.balance !== undefined && (
              <div className="rounded-xl border bg-secondary/50 px-4 py-2">
                <p className="text-xs text-muted-foreground">Meal Plan Balance</p>
                <p className="font-display text-xl font-bold text-primary">
                  {money(currentUser.balance)}
                </p>
              </div>
            )}
            <Link to="/">
              <Button className="gap-2">
                <Utensils className="h-4 w-4" /> Order Food
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/50"
              onClick={() => handleOpenReportModal()}
            >
              <AlertTriangle className="h-4 w-4" /> Report Food Issue
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="live-orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 sm:grid-cols-5">
          <TabsTrigger value="live-orders" className="gap-2">
            <Clock className="h-4 w-4" />
            <span>Active ({activeOrders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tomorrow-menu" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Tomorrow ({recommendations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="order-history" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span>History ({pastOrders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="my-reports" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Reports ({myReports.length})</span>
          </TabsTrigger>
          <TabsTrigger value="meal-plan" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tomorrow's Recommendations */}
        <TabsContent value="tomorrow-menu" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Tomorrow's Menu Recommendations</CardTitle>
                  <Badge className="bg-primary text-primary-foreground">Student Poll</Badge>
                </div>
                <CardDescription>
                  Recommend dishes you want to order tomorrow and vote on meals proposed by peers.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={recFilter} onValueChange={(v: any) => setRecFilter(v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({recommendations.length})</SelectItem>
                    <SelectItem value="mine">
                      My Dishes (
                      {recommendations.filter((r) => r.studentId === currentUser.id).length})
                    </SelectItem>
                    <SelectItem value="accepted">
                      Accepted ({recommendations.filter((r) => r.status === "accepted").length})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => setRecommendDialogOpen(true)}
                  className="gap-1.5 bg-primary text-primary-foreground shrink-0 shadow-sm"
                >
                  <Sparkles className="h-4 w-4" /> Recommend a Dish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredRecs = recommendations.filter((r) => {
                  if (recFilter === "mine") return r.studentId === currentUser.id;
                  if (recFilter === "accepted") return r.status === "accepted";
                  return true;
                });

                if (filteredRecs.length === 0) {
                  return (
                    <div className="py-12 text-center text-muted-foreground">
                      <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No dish recommendations in this filter.</p>
                      <p className="text-xs">
                        Be the first to suggest what dishes should be prepared for tomorrow's order!
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRecommendDialogOpen(true)}
                        className="mt-3 gap-1.5"
                      >
                        <Sparkles className="h-4 w-4" /> Recommend a Dish for Tomorrow
                      </Button>
                    </div>
                  );
                }

                return (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredRecs.map((rec) => {
                      const hasVoted = rec.votedBy.includes(currentUser.id);
                      const isAuthor = rec.studentId === currentUser.id;
                      const canDelete = isAuthor || currentUser.role === "admin";

                      return (
                        <div
                          key={rec.id}
                          className="rounded-xl border bg-card overflow-hidden transition-all hover:shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            {/* Matching Food Picture */}
                            <div className="relative h-40 w-full overflow-hidden bg-muted">
                              <img
                                src={rec.image || getDishImage(rec.dishName, rec.category)}
                                alt={rec.dishName}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80";
                                }}
                              />
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                <span
                                  className={`size-3 shrink-0 rounded-full border-2 border-white shadow-sm ${rec.veg ? "bg-green-600" : "bg-red-600"}`}
                                  title={rec.veg ? "Vegetarian" : "Non-vegetarian"}
                                />
                              </div>
                              <div className="absolute bottom-2.5 left-2.5">
                                {rec.status === "accepted" ? (
                                  <Badge className="bg-green-600 text-white text-[10px] font-bold">
                                    ✅ Chef Accepted for Tomorrow
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-background/90 backdrop-blur-sm text-[10px]"
                                  >
                                    🗳️ {rec.votes} Votes
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-bold text-base text-foreground">
                                    {rec.dishName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Badge variant="outline" className="text-[10px]">
                                      {rec.category}
                                    </Badge>
                                    <span>by {rec.studentName}</span>
                                    {isAuthor && (
                                      <Badge variant="secondary" className="text-[9px]">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span className="font-bold text-primary text-sm">
                                  {money(rec.suggestedPrice)}
                                </span>
                              </div>

                              <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg italic">
                                &ldquo;{rec.reason}&rdquo;
                              </p>
                            </div>
                          </div>

                          <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t gap-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              🔥 {rec.votes} student votes
                            </span>
                            <div className="flex items-center gap-2">
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Remove recommendation for "${rec.dishName}"?`)) {
                                      deleteTomorrowRecommendation(rec.id);
                                      toast.success("Recommendation removed.");
                                    }
                                  }}
                                  className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={hasVoted ? "default" : "outline"}
                                onClick={() => {
                                  const res = voteTomorrowRecommendation(rec.id);
                                  if (res.ok) {
                                    toast.success(
                                      res.hasVoted ? "Vote added for tomorrow!" : "Vote removed.",
                                    );
                                  }
                                }}
                                className={`gap-1.5 text-xs h-8 ${hasVoted ? "bg-primary text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10"}`}
                              >
                                <ThumbsUp
                                  className={`h-3.5 w-3.5 ${hasVoted ? "fill-current" : ""}`}
                                />
                                {hasVoted ? "Voted to Order" : "Vote to Order"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 1: Active Tokens */}
        <TabsContent value="live-orders" className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <CardContent className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">No Active Orders</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any meals in the kitchen queue right now.
                </p>
                <Link to="/">
                  <Button variant="outline" size="sm" className="mt-2">
                    Browse Today's Menu
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeOrders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden border-2 border-primary/30 shadow-md"
                >
                  <div className="bg-primary/5 px-6 py-4 border-b flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your Pickup Token
                      </span>
                      <p className="font-display text-4xl font-extrabold text-primary">
                        #{order.token}
                      </p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                        Items Ordered
                      </h4>
                      <ul className="mt-2 divide-y text-sm">
                        {order.lines.map((l) => (
                          <li key={l.itemId} className="flex justify-between py-1.5">
                            <span>
                              {l.qty} × <span className="font-medium">{l.name}</span>
                            </span>
                            <span className="text-muted-foreground">{money(l.price * l.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.note && (
                      <div className="rounded-md bg-accent/40 p-2.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Special instructions:</span>{" "}
                        {order.note}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>
                        Total: <strong className="text-foreground">{money(order.total)}</strong> (
                        {order.payment})
                      </span>
                      <span>
                        Placed:{" "}
                        {new Date(order.placedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-secondary/20 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {order.status === "ready"
                        ? "🔔 Food is ready! Please collect your tray at counter."
                        : "⏳ Cooking in kitchen..."}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        onClick={() => handleDiscardOrder(order)}
                      >
                        Discard Order
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-amber-600 hover:text-amber-700"
                        onClick={() => handleOpenReportModal(order.lines[0]?.name, order.token)}
                      >
                        Report Issue
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Order History */}
        <TabsContent value="order-history">
          <Card>
            <CardHeader>
              <CardTitle>Your Past Orders</CardTitle>
              <CardDescription>
                Records of all previously completed and discarded meals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No past orders yet.
                </p>
              ) : (
                <div className="divide-y">
                  {pastOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-primary">
                            Token #{order.token}
                          </span>
                          {order.status === "cancelled" ? (
                            <Badge
                              variant="outline"
                              className="border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs"
                            >
                              Discarded / Cancelled {order.payment === "wallet" && "(Refunded)"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Completed
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.placedAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-foreground">
                          {order.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{money(order.total)}</span>
                        {order.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleOpenReportModal(order.lines[0]?.name, order.token)}
                          >
                            Feedback / Report
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Food Reports */}
        <TabsContent value="my-reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Food Reports & Complaints</CardTitle>
                <CardDescription>
                  Track status and admin actions on your reported issues.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenReportModal()} className="gap-1.5">
                <MessageSquarePlus className="h-4 w-4" /> New Report
              </Button>
            </CardHeader>
            <CardContent>
              {myReports.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No reports submitted yet.</p>
                  <p className="text-xs">
                    If you ever receive cold, improper, or incorrect food, report it here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReports.map((report) => (
                    <div key={report.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{report.foodItemName}</h4>
                          {report.token && <Badge variant="outline">Token #{report.token}</Badge>}
                          <Badge variant="secondary">{report.category}</Badge>
                        </div>
                        <div>
                          {report.status === "pending" && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 bg-amber-50 text-amber-700"
                            >
                              Pending Review
                            </Badge>
                          )}
                          {report.status === "investigating" && (
                            <Badge
                              variant="outline"
                              className="border-blue-500 bg-blue-50 text-blue-700"
                            >
                              Investigating with Kitchen
                            </Badge>
                          )}
                          {report.status === "resolved" && (
                            <Badge className="bg-green-600 text-white">✓ Resolved by Admin</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < report.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          Reported on{" "}
                          {new Date(report.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">
                        "{report.description}"
                      </p>

                      {/* Admin response block */}
                      {report.adminResponse && (
                        <div className="rounded-lg border border-green-200 bg-green-50/70 p-3 text-xs dark:border-green-900 dark:bg-green-950/40">
                          <p className="font-semibold text-green-800 dark:text-green-300">
                            🛡️ Official Admin Response / Action Taken:
                          </p>
                          <p className="mt-1 text-green-900 dark:text-green-200">
                            {report.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Wallet & Transactions */}
        <TabsContent value="meal-plan">
          <Card>
            <CardHeader>
              <CardTitle>Meal Plan & Wallet Transactions</CardTitle>
              <CardDescription>Real-time ledger of campus prepaid meals.</CardDescription>
            </CardHeader>
            <CardContent>
              {myTransactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No meal plan transactions found.
                </p>
              ) : (
                <div className="divide-y">
                  {myTransactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{tx.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span
                        className={
                          tx.amount < 0
                            ? "font-medium text-muted-foreground"
                            : "font-bold text-green-600"
                        }
                      >
                        {tx.amount < 0 ? "−" : "+"}
                        {money(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Food Issue Modal Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Report a Food Issue / Feedback
            </DialogTitle>
            <DialogDescription>
              Submit your complaint directly to the Canteen Administrator and Head Chef.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dishName">Food Item / Dish Name</Label>
              <Input
                id="dishName"
                value={selectedItemName}
                onChange={(e) => setSelectedItemName(e.target.value)}
                placeholder="e.g. Veg Momo, Chicken Thali, Milk Tea"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Issue Category</Label>
                <Select
                  value={reportCategory}
                  onValueChange={(v) => setReportCategory(v as FoodReportCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Rating (1 to 5)</Label>
                <div className="flex h-10 items-center gap-1.5 px-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReportRating(star)}
                      className="text-amber-400 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= reportRating ? "fill-amber-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="details">What went wrong? (Detailed Comments)</Label>
              <Textarea
                id="details"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe what was wrong (e.g. cold food, foreign object, incorrect ingredients, portion size)..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReport} className="bg-red-600 hover:bg-red-700 text-white">
              Submit Report to Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recommend for Tomorrow Dialog */}
      <RecommendTomorrowDialog
        open={recommendDialogOpen}
        onOpenChange={setRecommendDialogOpen}
      />
    </div>
  );
}
