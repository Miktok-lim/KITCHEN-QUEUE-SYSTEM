import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Image as ImageIcon, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  getDishImage,
  money,
  submitTomorrowRecommendation,
  useCanteen,
  type MealCategory,
} from "@/lib/canteen-store";

interface RecommendTomorrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES: MealCategory[] = ["Breakfast", "Lunch", "Snacks", "Beverages"];

const POPULAR_SUGGESTIONS = [
  { name: "Chicken Biryani", category: "Lunch" as MealCategory, price: 160, veg: false },
  { name: "Paneer Butter Masala", category: "Lunch" as MealCategory, price: 130, veg: true },
  { name: "Fried Rice", category: "Snacks" as MealCategory, price: 100, veg: true },
  { name: "Samosa Tarkari (2 pcs)", category: "Breakfast" as MealCategory, price: 50, veg: true },
  { name: "Cold Coffee with Ice Cream", category: "Beverages" as MealCategory, price: 65, veg: true },
  { name: "Rajma Chawal", category: "Lunch" as MealCategory, price: 90, veg: true },
  { name: "Chicken Momo", category: "Snacks" as MealCategory, price: 120, veg: false },
];

export function RecommendTomorrowDialog({
  open,
  onOpenChange,
  onSuccess,
}: RecommendTomorrowDialogProps) {
  const currentUser = useCanteen((s) => s.currentUser);

  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<MealCategory>("Lunch");
  const [suggestedPrice, setSuggestedPrice] = useState("100");
  const [veg, setVeg] = useState(true);
  const [reason, setReason] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    if (dishName.trim()) {
      setPreviewImage(getDishImage(dishName.trim(), category));
    } else {
      setPreviewImage(getDishImage("", category));
    }
  }, [dishName, category]);

  const handleQuickPick = (item: (typeof POPULAR_SUGGESTIONS)[number]) => {
    setDishName(item.name);
    setCategory(item.category);
    setSuggestedPrice(String(item.price));
    setVeg(item.veg);
    setPreviewImage(getDishImage(item.name, item.category));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in with a student account to submit recommendations.");
      return;
    }
    if (!dishName.trim()) {
      toast.error("Please enter the name of the dish.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please tell the chef and fellow students why you recommend this for tomorrow.");
      return;
    }

    const price = Number(suggestedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Please enter a valid estimated price.");
      return;
    }

    const res = submitTomorrowRecommendation({
      dishName: dishName.trim(),
      category,
      suggestedPrice: price,
      veg,
      reason: reason.trim(),
      image: previewImage,
    });

    if (!res.ok) {
      toast.error(res.error || "Failed to submit recommendation.");
      return;
    }

    toast.success(`Recommended "${dishName}" for tomorrow's menu! Fellow students can now vote on it.`);
    setDishName("");
    setReason("");
    setSuggestedPrice("100");
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            <DialogTitle className="text-xl">Recommend a Dish for Tomorrow's Menu</DialogTitle>
          </div>
          <DialogDescription>
            Tell the kitchen team and fellow students what meal you would like to order tomorrow.
            The kitchen staff prepares popular, high-vote dishes!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Quick suggestions */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Suggestions
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {POPULAR_SUGGESTIONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleQuickPick(item)}
                  className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/10"
                >
                  {item.name} ({money(item.price)})
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dishName">Dish Name *</Label>
              <Input
                id="dishName"
                placeholder="e.g. Chicken Biryani, Dosa, Paneer Wrap"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Meal Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MealCategory)}>
                <SelectTrigger id="category">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-center">
            <div className="space-y-2">
              <Label htmlFor="price">Suggested Target Price (Rs)</Label>
              <Input
                id="price"
                inputMode="numeric"
                placeholder="100"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-6 sm:pt-4">
              <Switch id="recVeg" checked={veg} onCheckedChange={setVeg} />
              <Label htmlFor="recVeg" className="cursor-pointer">
                {veg ? "🥦 100% Vegetarian" : "🍗 Non-Vegetarian"}
              </Label>
            </div>
          </div>

          {/* Real-time Matching Picture Preview */}
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Matching Food Picture Preview
              </span>
              <Badge variant="outline" className="text-[10px]">
                Auto-matched
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewImage}
                  alt={dishName || "Food preview"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground truncate">
                  {dishName.trim() || "Enter a dish name above"}
                </p>
                <p>
                  Estimated {category} item · {money(Number(suggestedPrice) || 0)}
                </p>
                <p className="text-[11px] text-primary">
                  {veg ? "Vegetarian option" : "Non-Veg specialty"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Why should students order this tomorrow? *</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="e.g. Great hot lunch for exam day, high protein meal, popular demand among CSIT students..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5">
              <ThumbsUp className="h-4 w-4" />
              Submit Recommendation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
