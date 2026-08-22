import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChefHat, ShieldAlert, Sparkles, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addMenuItem,
  money,
  removeMenuItem,
  updateMenuItem,
  useCanteen,
  type MealCategory,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Daily Menu Planner — College Kitchen" },
      {
        name: "description",
        content: "Plan the college canteen menu for the day: set dishes, prices and how many portions the kitchen prepares.",
      },
      { property: "og:title", content: "Daily Menu Planner — College Kitchen" },
      { property: "og:description", content: "Set today's canteen dishes, prices and portion counts." },
    ],
  }),
  component: Planner,
});

const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Snacks", "Beverages"];

function Planner() {
  const menu = useCanteen((s) => s.menu);
  const currentUser = useCanteen((s) => s.currentUser);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<MealCategory>("Lunch");
  const [veg, setVeg] = useState(true);

  // Role guard: Only Staff & Admin
  if (currentUser && currentUser.role === "student") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Staff & Admin Access Only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Menu planning and stock adjustment are managed by canteen staff and administrators.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/">
            <Button>Order Food as Student</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Switch Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const add = () => {
    if (!name.trim()) {
      toast.error("Give the dish a name.");
      return;
    }
    const p = Number(price);
    const q = Number(quantity);
    if (!Number.isFinite(p) || p <= 0) {
      toast.error("Enter a valid price.");
      return;
    }
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Enter how many portions you'll prepare.");
      return;
    }
    addMenuItem({
      name: name.trim(),
      description: description.trim() || "Prepared fresh today",
      price: p,
      quantity: q,
      category,
      available: true,
      veg,
    });
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    toast.success("Added to today's menu.");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Daily Menu Planner</h1>
              <p className="text-sm text-muted-foreground">
                Set dishes, price points, and prepared portions for today.
              </p>
            </div>
          </div>
        </div>

        {currentUser?.role === "admin" && (
          <Link to="/admin">
            <Badge variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 cursor-pointer">
              🛡️ Admin Center
            </Badge>
          </Link>
        )}
      </header>

      <Card className="mb-8 border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">Add a New Dish to Menu</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Dish name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajma Chawal, Masala Dosa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief ingredients or preparation description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (Rs)</Label>
              <Input id="price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="120" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Portions prepared</Label>
              <Input id="qty" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-2">
              <Label>Meal time category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MealCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Switch id="veg" checked={veg} onCheckedChange={setVeg} />
                <Label htmlFor="veg">Vegetarian</Label>
              </div>
              <Button className="ml-auto" onClick={add}>
                Add to Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's Menu Items</h3>
        {menu.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center gap-4 pt-6">
              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  <span
                    className={`size-2.5 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`}
                    title={item.veg ? "Vegetarian" : "Non-vegetarian"}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="w-24">
                <Label className="text-xs text-muted-foreground">Price (Rs)</Label>
                <Input
                  value={item.price}
                  inputMode="numeric"
                  onChange={(e) => updateMenuItem(item.id, { price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="w-28">
                <Label className="text-xs text-muted-foreground">Portions</Label>
                <Input
                  value={item.quantity}
                  inputMode="numeric"
                  onChange={(e) => updateMenuItem(item.id, { quantity: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Sold: <strong>{item.sold}</strong></p>
                <p>Sales: {money(item.sold * item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={(v) => updateMenuItem(item.id, { available: v })}
                  aria-label={`Serving ${item.name}`}
                />
                <span className="text-xs font-medium">{item.available ? "Serving" : "Off Menu"}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeMenuItem(item.id)} className="text-destructive">
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
