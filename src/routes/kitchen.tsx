import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, CheckCircle2, Clock, ShieldAlert, Sparkles, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { money, setOrderStatus, useCanteen, type Order, type OrderStatus } from "@/lib/canteen-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Staff Orders — College Kitchen" },
      {
        name: "description",
        content: "Live incoming orders and ready-for-pickup queue for canteen staff.",
      },
      { property: "og:title", content: "Kitchen Staff Orders — College Kitchen" },
      { property: "og:description", content: "Incoming orders and ready board for canteen staff." },
    ],
  }),
  component: KitchenBoard,
});

const COLUMNS: Array<{ status: OrderStatus; title: string; next?: OrderStatus; action?: string; icon: any }> = [
  {
    status: "queued",
    title: "Incoming Orders",
    next: "ready",
    action: "Mark Ready for Pickup",
    icon: Clock,
  },
  {
    status: "ready",
    title: "Ready for Pickup",
    next: "served",
    action: "Clear / Collected",
    icon: CheckCircle2,
  },
];

function KitchenBoard() {
  const orders = useCanteen((s) => s.orders);
  const currentUser = useCanteen((s) => s.currentUser);

  // Role guard: Only Staff & Admin
  if (currentUser && currentUser.role === "student") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Kitchen Staff Access Only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Students can track their own meal tokens directly from the <strong>Student Dashboard</strong>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button>Go to My Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Switch Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const queuedOrders = orders.filter((o) => o.status === "queued" || o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const totalActive = queuedOrders.length + readyOrders.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Order Board</h1>
            <p className="text-sm text-muted-foreground">
              {queuedOrders.length} incoming orders · {readyOrders.length} ready at counter
            </p>
          </div>
        </div>

        {currentUser?.role === "admin" && (
          <Link to="/admin">
            <Badge variant="outline" className="cursor-pointer border-purple-300 text-purple-700 hover:bg-purple-50">
              🛡️ Admin View
            </Badge>
          </Link>
        )}
      </header>

      {/* 2-Column Simplified Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: Incoming Orders */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">Incoming Orders</h2>
            </div>
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 font-bold">
              {queuedOrders.length} Pending
            </Badge>
          </div>

          <div className="space-y-3">
            {queuedOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No pending orders right now.</p>
                <p className="text-xs">New orders placed by students will appear here in real-time.</p>
              </div>
            ) : (
              queuedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  next="ready"
                  action="✓ Mark Ready for Pickup"
                  actionVariant="default"
                />
              ))
            )}
          </div>
        </section>

        {/* Column 2: Ready for Pickup */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-base font-bold text-foreground">Ready for Pickup</h2>
            </div>
            <Badge className="bg-green-600 font-bold text-white">
              {readyOrders.length} Ready
            </Badge>
          </div>

          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No trays waiting at counter.</p>
                <p className="text-xs">Mark incoming orders as ready when prepared.</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  next="served"
                  action="Collected / Clear"
                  actionVariant="outline"
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  next,
  action,
  actionVariant,
}: {
  order: Order;
  next?: OrderStatus;
  action?: string;
  actionVariant?: "default" | "outline";
}) {
  return (
    <Card className="border shadow-sm transition-all hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="font-display text-3xl font-black text-primary">#{order.token}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div>
          <p className="text-sm font-bold text-foreground">
            {order.customerName ?? "Walk-in Customer"}
            {order.studentId && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">({order.studentId})</span>
            )}
          </p>
        </div>

        <ul className="space-y-1 rounded-lg bg-muted/40 p-2.5 text-sm font-medium">
          {order.lines.map((l) => (
            <li key={l.itemId} className="flex justify-between">
              <span>{l.qty} × {l.name}</span>
            </li>
          ))}
        </ul>

        {order.note ? (
          <p className="rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            ⚠️ <strong>Note:</strong> {order.note}
          </p>
        ) : null}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{money(order.total)}</span>
          <Badge variant="outline" className="text-[10px]">
            {order.payment === "wallet" ? "Meal Plan" : "Cash at Counter"}
          </Badge>
        </div>

        {next && action ? (
          <Button
            className={`w-full font-bold ${
              actionVariant === "outline"
                ? "border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40"
                : "bg-primary hover:bg-primary/90"
            }`}
            variant={actionVariant || "default"}
            size="sm"
            onClick={() => setOrderStatus(order.id, next)}
          >
            {action}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
