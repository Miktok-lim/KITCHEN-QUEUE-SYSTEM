import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  Plus,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  Utensils,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  getDishImage,
  money,
  removeMenuItem,
  setRecommendationStatus,
  updateMenuItem,
  useCanteen,
  type MealCategory,
  type TomorrowRecommendation,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Daily Menu Planner & Student Demand — College Kitchen" },
      {
        name: "description",
        content:
          "Plan the college canteen menu, review tomorrow's student dish recommendations, set dishes, prices, and portion sizes.",
      },
      { property: "og:title", content: "Daily Menu Planner — College Kitchen" },
      {
        property: "og:description",
        content: "Set today's canteen dishes, prices, and review student recommendations for tomorrow.",
      },
    ],
  }),
  component: Planner,
});

const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Snacks", "Beverages"];

function Planner() {
  const menu = useCanteen((s) => s.menu);
  const recommendations = useCanteen((s) => s.recommendations);
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
      image: getDishImage(name.trim(), category),
    });
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    toast.success("Added to today's menu.");
  };

  const handleAcceptRecommendation = (rec: TomorrowRecommendation) => {
    // Check if dish already in menu
    const existing = menu.find((m) => m.name.toLowerCase() === rec.dishName.toLowerCase());
    if (existing) {
      setRecommendationStatus(rec.id, "accepted");
      toast.info(`"${rec.dishName}" is already in the menu. Marked recommendation as Accepted!`);
      return;
    }

    addMenuItem({
      name: rec.dishName,
      description: `Student Recommended (${rec.votes} votes) · Prepared fresh`,
      price: rec.suggestedPrice,
      quantity: 50,
      category: rec.category,
      available: true,
      veg: rec.veg,
      image: rec.image || getDishImage(rec.dishName, rec.category),
    });

    setRecommendationStatus(rec.id, "accepted");
    toast.success(`Accepted "${rec.dishName}"! Added to active canteen menu with 50 portions.`);
  };

  const sortedRecs = [...recommendations].sort((a, b) => b.votes - a.votes);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Daily Menu Planner & Demand</h1>
              <p className="text-sm text-muted-foreground">
                Set dishes, price points, and review student recommendations for tomorrow.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/kitchen">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ChefHat className="h-4 w-4" /> Kitchen Board
            </Button>
          </Link>
          {currentUser?.role === "admin" && (
            <Link to="/admin">
              <Badge
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 cursor-pointer"
              >
                🛡️ Admin Center
              </Badge>
            </Link>
          )}
        </div>
      </header>

      {/* Tomorrow's Student Demand & Recommendations Panel */}
      <Card className="mb-8 border-2 border-primary/30 bg-primary/5 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  Tomorrow's Student Recommendations & Demand
                </CardTitle>
                <Badge className="bg-primary text-primary-foreground">Chef Insights</Badge>
              </div>
              <CardDescription>
                Dishes requested and voted on by students for tomorrow's order. Click "Accept & Add
                to Menu" to automatically create it.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {recommendations.length} items suggested
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedRecs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No student recommendations logged yet for tomorrow.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sortedRecs.map((rec) => {
                const isAccepted = rec.status === "accepted";
                return (
                  <div
                    key={rec.id}
                    className="flex gap-3 rounded-xl border bg-card p-3 shadow-xs items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted border">
                        <img
                          src={rec.image || getDishImage(rec.dishName, rec.category)}
                          alt={rec.dishName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80";
                          }}
                        />
                        <span
                          className={`absolute top-1 right-1 size-2 rounded-full border border-white ${rec.veg ? "bg-green-600" : "bg-red-600"}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm truncate">{rec.dishName}</h4>
                          <span className="text-xs font-semibold text-primary shrink-0">
                            {money(rec.suggestedPrice)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {rec.category} · by {rec.studentName}
                        </p>
                        <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
                          🔥 {rec.votes} student votes
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {isAccepted ? (
                        <Badge className="bg-green-600 text-white text-[10px]">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Accepted
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRecommendation(rec)}
                          className="h-7 text-xs gap-1 bg-primary"
                        >
                          <Plus className="h-3 w-3" /> Accept & Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Dish Addition Form */}
      <Card className="mb-8 border-primary/20 shadow-sm">
        <CardContent className="pt-6">
          <h2 className="mb-4 text-lg font-semibold">Add a Custom Dish to Today's Menu</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Dish name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajma Chawal, Masala Dosa"
              />
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
              <Input
                id="price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Portions prepared</Label>
              <Input
                id="qty"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="50"
              />
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

      {/* Active Today's Menu Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Active Menu Items ({menu.length})
        </h3>
        {menu.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-wrap items-center gap-4 pt-6">
              {/* Picture Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                <img
                  src={item.image || getDishImage(item.name, item.category)}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80";
                  }}
                />
                <span
                  className={`absolute top-1 right-1 size-2 rounded-full border border-white ${item.veg ? "bg-green-600" : "bg-red-600"}`}
                />
              </div>

              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
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
                  onChange={(e) =>
                    updateMenuItem(item.id, { quantity: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Sold: <strong>{item.sold}</strong>
                </p>
                <p>Sales: {money(item.sold * item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={(v) => updateMenuItem(item.id, { available: v })}
                  aria-label={`Serving ${item.name}`}
                />
                <span className="text-xs font-medium">
                  {item.available ? "Serving" : "Off Menu"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeMenuItem(item.id)}
                className="text-destructive"
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

