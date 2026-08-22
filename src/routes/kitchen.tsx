import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  PackageX,
  ShieldAlert,
  Sparkles,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  money,
  remaining,
  setOrderStatus,
  updateMenuItem,
  useCanteen,
  type MenuItem,
  type Order,
  type OrderStatus,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Staff Orders & Availability — College Kitchen" },
      {
        name: "description",
        content: "Live incoming orders, ready queue, and raw material availability control for canteen staff.",
      },
      { property: "og:title", content: "Kitchen Staff Orders & Availability — College Kitchen" },
      { property: "og:description", content: "Incoming orders, ready board, and sold-out controls for canteen staff." },
    ],
  }),
  component: KitchenBoard,
});

function KitchenBoard() {
  const orders = useCanteen((s) => s.orders);
  const menu = useCanteen((s) => s.menu);
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

  const handleToggleSoldOut = (item: MenuItem, isAvailable: boolean) => {
    updateMenuItem(item.id, { available: isAvailable });
    if (isAvailable) {
      toast.success(`"${item.name}" marked as AVAILABLE (Serving).`);
    } else {
      toast.error(`"${item.name}" marked as SOLD OUT (Raw materials finished).`);
    }
  };

  const soldOutCount = menu.filter((m) => !m.available || remaining(m) === 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Order & Stock Board</h1>
            <p className="text-sm text-muted-foreground">
              {queuedOrders.length} incoming orders · {readyOrders.length} ready for pickup · {soldOutCount} items sold out
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/planner">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Utensils className="h-4 w-4" /> Full Menu Planner
            </Button>
          </Link>
          {currentUser?.role === "admin" && (
            <Link to="/admin">
              <Badge variant="outline" className="cursor-pointer border-purple-300 text-purple-700 hover:bg-purple-50">
                🛡️ Admin View
              </Badge>
            </Link>
          )}
        </div>
      </header>

      {/* Raw Material & Sold Out Fast Controls Section */}
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-foreground">Raw Material & Item Availability</h2>
              {soldOutCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {soldOutCount} Sold Out
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              If raw materials/ingredients run out, mark dishes as <strong>Sold Out</strong> below. Students will not be able to order them.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {menu.map((item) => {
            const left = remaining(item);
            const isSoldOut = !item.available || left === 0;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isSoldOut
                    ? "border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/40"
                    : "border-border bg-card shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-foreground text-sm leading-tight">{item.name}</span>
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`}
                      title={item.veg ? "Vegetarian" : "Non-vegetarian"}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{money(item.price)} · {item.category}</span>
                    <span>{left} left</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <span className={`text-xs font-semibold ${isSoldOut ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                    {isSoldOut ? "🔴 SOLD OUT" : "🟢 Available"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available && left > 0}
                      onCheckedChange={(checked) => handleToggleSoldOut(item, checked)}
                      aria-label={`Toggle availability for ${item.name}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2-Column Kitchen Order Queue */}
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
