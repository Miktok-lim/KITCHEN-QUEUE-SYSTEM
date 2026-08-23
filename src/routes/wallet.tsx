import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GraduationCap, Shield, ShieldAlert, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { money, topUp, useCanteen } from "@/lib/canteen-store";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Student Meal Plan — College Kitchen" },
      {
        name: "description",
        content:
          "Check a student's prepaid meal plan balance, top it up at the college office and review canteen spending.",
      },
      { property: "og:title", content: "Student Meal Plan — College Kitchen" },
      {
        property: "og:description",
        content: "Check and top up prepaid student meal plan balances.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const students = useCanteen((s) => s.students);
  const transactions = useCanteen((s) => s.transactions);
  const currentUser = useCanteen((s) => s.currentUser);

  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  // If a student is accessing this page, redirect/show their personal student balance view
  if (currentUser && currentUser.role === "student") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Wallet className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Meal Plan Top-Up Counter</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Top-ups are performed by the campus administration office. You can track your balance and
          spending history in your <strong>Student Dashboard</strong>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button>Go to My Dashboard</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Order Food</Button>
          </Link>
        </div>
      </div>
    );
  }

  const student = students.find((s) => s.id === selected);
  const history = transactions.filter((t) => t.studentId === selected);

  const doTopUp = () => {
    if (!student) return;
    const result = topUp(student.id, Number(amount));
    if (!result.ok) {
      toast.error(result.error ?? "Top-up failed.");
      return;
    }
    setAmount("");
    toast.success(`Added ${money(Number(amount))} to ${student.name}'s meal plan.`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Campus Meal Plan Top-Up</h1>
              <p className="text-sm text-muted-foreground">
                Recharge student canteen cards and review individual transaction ledgers.
              </p>
            </div>
          </div>
        </div>

        {currentUser?.role === "admin" && (
          <Link to="/admin">
            <Badge
              variant="outline"
              className="cursor-pointer border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              🛡️ Admin Control Center
            </Badge>
          </Link>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Registered Students ({students.length})
          </h2>
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                selected === s.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "hover:bg-secondary/60"
              }`}
            >
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.id} · {s.program}
              </p>
              <p className="mt-1 text-sm font-bold text-primary">{money(s.balance)}</p>
            </button>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {!student ? (
              <div className="py-16 text-center text-muted-foreground">
                <GraduationCap className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm">
                  Select a student from the list to view their meal plan and top-up credit.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Student ID: <span className="font-semibold text-foreground">{student.id}</span>{" "}
                    · {student.program}
                  </p>
                  <div className="mt-4 rounded-xl bg-primary/5 p-4 border border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Current Meal Plan Balance
                    </p>
                    <p className="font-display text-4xl font-extrabold text-primary">
                      {money(student.balance)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount">Recharge Amount (Rs)</Label>
                    <Input
                      id="amount"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-40"
                    />
                  </div>
                  <Button onClick={doTopUp} className="bg-primary">
                    Confirm Top-Up
                  </Button>
                  {[200, 500, 1000].map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(String(v))}
                    >
                      +{money(v)}
                    </Button>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Spending & Recharge Ledger
                  </h3>
                  {history.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      No meal plan activity on this card yet.
                    </p>
                  ) : (
                    <div className="rounded-lg border divide-y">
                      {history.slice(0, 12).map((t) => (
                        <div key={t.id} className="flex justify-between p-3 text-sm">
                          <div>
                            <p className="font-medium text-foreground">{t.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.at).toLocaleString([], {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span
                            className={
                              t.amount < 0
                                ? "text-muted-foreground font-medium"
                                : "font-bold text-green-600"
                            }
                          >
                            {t.amount < 0 ? "−" : "+"}
                            {money(Math.abs(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
