import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  ChefHat,
  Clock,
  GraduationCap,
  Sparkles,
  Utensils,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelOrder,
  findStudent,
  money,
  placeOrder,
  remaining,
  useCanteen,
  type MealCategory,
  type MenuItem,
  type Order,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Canteen Ordering — College Kitchen" },
      {
        name: "description",
        content:
          "Order today's canteen meals from the college kitchen, pay with your student meal plan, and collect your food by token number.",
      },
      { property: "og:title", content: "Campus Canteen Ordering — College Kitchen" },
      {
        property: "og:description",
        content: "Browse today's college canteen menu, order in seconds and pay with your meal plan.",
      },
    ],
  }),
  component: OrderKiosk,
});

const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Snacks", "Beverages"];

function OrderKiosk() {
  const menu = useCanteen((s) => s.menu);
  const currentUser = useCanteen((s) => s.currentUser);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState(currentUser?.name ?? "");
  const [studentId, setStudentId] = useState(currentUser?.role === "student" ? currentUser.id : "");
  const [note, setNote] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      if (currentUser.role === "student") {
        setStudentId(currentUser.id);
      }
    }
  }, [currentUser]);

  const student = studentId.trim() ? findStudent(studentId) : undefined;

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([itemId, qty]) => {
          const item = menu.find((m) => m.id === itemId);
          return item ? { itemId, name: item.name, price: item.price, qty } : null;
        })
        .filter((l): l is { itemId: string; name: string; price: number; qty: number } => !!l && l.qty > 0),
    [cart, menu],
  );

  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const change = (item: MenuItem, delta: number) => {
    setCart((c) => {
      const next = Math.max(0, (c[item.id] ?? 0) + delta);
      if (next > remaining(item)) {
        toast.error(`Only ${remaining(item)} portions left today.`);
        return c;
      }
      return { ...c, [item.id]: next };
    });
  };

  const submit = (payment: "wallet" | "cash") => {
    const result = placeOrder({ studentId, customerName, lines, payment, note });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPlaced(result.order);
    setCart({});
    setNote("");
    toast.success(`Order placed — token #${result.order.token}`);
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Your order token</p>
        <p className="font-display mt-2 text-8xl font-bold text-primary animate-in zoom-in-50">
          #{placed.token}
        </p>
        <h1 className="mt-6 text-2xl font-semibold">
          Order received{placed.customerName ? `, ${placed.customerName.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          The kitchen is now processing your tray. Track live status on your student dashboard or watch the pickup board.
        </p>
        <Card className="mt-8 text-left shadow-sm">
          <CardContent className="space-y-2 pt-6">
            {placed.lines.map((l) => (
              <div key={l.itemId} className="flex justify-between text-sm">
                <span>
                  {l.qty} × {l.name}
                </span>
                <span>{money(l.price * l.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total ({placed.payment === "wallet" ? "Meal plan" : "Cash at counter"})</span>
              <span>{money(placed.total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => setPlaced(null)} variant="outline">
            Place another order
          </Button>
          <Link to="/dashboard">
            <Button size="lg" className="w-full gap-2">
              <Clock className="h-4 w-4" /> Track in My Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
            onClick={() => {
              const refundNote =
                placed.payment === "wallet" ? ` ${money(placed.total)} will be refunded to your meal plan.` : "";
              if (confirm(`Discard / cancel this order (Token #${placed.token})?${refundNote}`)) {
                cancelOrder(placed.id);
                toast.success(`Order #${placed.token} cancelled.${refundNote ? ` Refunded ${money(placed.total)}.` : ""}`);
                setPlaced(null);
              }
            }}
          >
            Discard / Cancel this order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Staff banner if staff is viewing */}
      {currentUser?.role === "staff" && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ChefHat className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium">
              You are signed in as <strong>Kitchen Staff</strong>. Visit the Kitchen Board to process incoming orders.
            </p>
          </div>
          <Link to="/kitchen">
            <Button size="sm" variant="outline" className="border-amber-400 bg-amber-100 hover:bg-amber-200 text-amber-900">
              Go to Kitchen Board
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-3">
              Serving today · {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">Today&apos;s canteen menu</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Select dishes below, add them to your tray, and collect your tray using your token number.
            </p>
          </div>

          {currentUser?.role === "student" && (
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <span>My Dashboard & Tokens</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Menu Items */}
        <div className="space-y-10">
          {CATEGORIES.map((category) => {
            const items = menu.filter((m) => m.category === category);
            if (items.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-3 text-lg font-semibold">{category}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => {
                    const left = remaining(item);
                    const soldOut = !item.available || left === 0;
                    return (
                      <Card key={item.id} className={`transition-shadow hover:shadow-sm ${soldOut ? "opacity-60" : ""}`}>
                        <CardContent className="flex h-full flex-col gap-3 pt-6">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <span
                              className={`mt-1 size-3 shrink-0 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`}
                              aria-label={item.veg ? "Vegetarian" : "Non-vegetarian"}
                              title={item.veg ? "Vegetarian" : "Non-vegetarian"}
                            />
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{money(item.price)}</p>
                              <p className="text-xs text-muted-foreground">
                                {soldOut ? "Sold out" : `${left} portions left`}
                              </p>
                            </div>
                            {soldOut ? null : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => change(item, -1)}
                                  disabled={!cart[item.id]}
                                  aria-label={`Remove one ${item.name}`}
                                >
                                  −
                                </Button>
                                <span className="w-6 text-center tabular-nums font-semibold">{cart[item.id] ?? 0}</span>
                                <Button size="icon" onClick={() => change(item, 1)} aria-label={`Add one ${item.name}`}>
                                  +
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Tray & Checkout Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="shadow-md">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Tray</h2>
                <Badge variant="outline">{lines.reduce((s, l) => s + l.qty, 0)} items</Badge>
              </div>

              {lines.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Utensils className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Your tray is empty. Add food items from the menu.
                </div>
              ) : (
                <div className="space-y-2 border-y py-3">
                  {lines.map((l) => (
                    <div key={l.itemId} className="flex justify-between text-sm">
                      <span>
                        {l.qty} × <span className="font-medium">{l.name}</span>
                      </span>
                      <span>{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-base font-bold">
                <span>Total Amount</span>
                <span className="text-primary">{money(total)}</span>
              </div>

              {/* Student Info */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="studentId">Meal Plan / Student ID</Label>
                  {student && (
                    <span className="text-xs font-semibold text-green-600">
                      Balance: {money(student.balance)}
                    </span>
                  )}
                </div>
                <Input
                  id="studentId"
                  placeholder="e.g. CS2201"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                />
                {student ? (
                  <p className="text-xs text-muted-foreground">
                    ✓ Verified: {student.name} ({student.program})
                  </p>
                ) : studentId.trim() ? (
                  <p className="text-xs text-destructive">No active student meal plan found for this ID.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Special Instructions / Note (Optional)</Label>
                <Textarea
                  id="note"
                  rows={2}
                  placeholder="e.g. Less spicy, pack to-go…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="grid gap-2 pt-2">
                <Button
                  size="lg"
                  disabled={!lines.length || (student && student.balance < total)}
                  onClick={() => submit("wallet")}
                  className="bg-primary"
                >
                  Pay with Meal Plan ({money(total)})
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={!lines.length}
                  onClick={() => submit("cash")}
                >
                  Pay Cash at Counter
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
