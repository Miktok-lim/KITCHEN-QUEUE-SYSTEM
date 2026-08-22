import { createFileRoute, Link } from "@tanstack/react-router";
import { ChefHat, ShieldAlert, Sparkles, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { money, setOrderStatus, useCanteen, type Order, type OrderStatus } from "@/lib/canteen-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Board — College Kitchen" },
      {
        name: "description",
        content: "Live order queue for college kitchen staff: track student orders from queued to preparing, ready and served.",
      },
      { property: "og:title", content: "Kitchen Board — College Kitchen" },
      { property: "og:description", content: "Live student order queue for the college kitchen staff." },
    ],
  }),
  component: KitchenBoard,
});

const COLUMNS: Array<{ status: OrderStatus; title: string; next?: OrderStatus; action?: string; badgeColor?: string }> = [
  { status: "queued", title: "New orders", next: "preparing", action: "Start cooking", badgeColor: "bg-amber-100 text-amber-800" },
  { status: "preparing", title: "Preparing", next: "ready", action: "Mark ready", badgeColor: "bg-blue-100 text-blue-800" },
  { status: "ready", title: "Ready for pickup", next: "served", action: "Mark served", badgeColor: "bg-green-100 text-green-800" },
  { status: "served", title: "Served", badgeColor: "bg-gray-100 text-gray-800" },
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

  const activeCount = orders.filter((o) => o.status !== "served").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Kitchen Live Queue</h1>
              <p className="text-sm text-muted-foreground">
                {activeCount === 0 ? "No active orders in the queue right now." : `${activeCount} meals being prepared.`}
              </p>
            </div>
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

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="rounded-xl bg-secondary/60 p-3 shadow-inner">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">{col.title}</h2>
                <Badge variant="outline" className="font-mono text-xs">{list.length}</Badge>
              </div>
              <div className="space-y-3">
                {list.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-muted-foreground">Queue is clear.</p>
                ) : (
                  list.map((order) => <OrderCard key={order.id} order={order} next={col.next} action={col.action} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, next, action }: { order: Order; next?: OrderStatus | undefined; action?: string | undefined }) {
  return (
    <Card className="border-border/80 shadow-sm transition-all hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="font-display text-2xl font-black text-primary">#{order.token}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {order.customerName ?? "Walk-in Customer"}
          </p>
          {order.studentId && (
            <p className="text-xs text-muted-foreground">ID: {order.studentId}</p>
          )}
        </div>
        <ul className="space-y-1 rounded-md bg-muted/40 p-2 text-sm font-medium">
          {order.lines.map((l) => (
            <li key={l.itemId} className="flex justify-between">
              <span>{l.qty} × {l.name}</span>
            </li>
          ))}
        </ul>
        {order.note ? (
          <p className="rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            ⚠️ <strong>Special Request:</strong> {order.note}
          </p>
        ) : null}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{money(order.total)}</span>
          <Badge variant="outline" className="text-[10px]">
            {order.payment === "wallet" ? "Meal Plan" : "Cash"}
          </Badge>
        </div>
        {next && action ? (
          <Button
            className="w-full font-semibold"
            size="sm"
            onClick={() => setOrderStatus(order.id, next)}
          >
            {action} ➔
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
