"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ResponsiveContainer, PieChart, Pie, Sector, Tooltip } from "recharts";
interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: "monthly" | "yearly";
  renewal_date: string;
  category:
    | "Other"
    | "Entertainment"
    | "Productivity"
    | "Utilities"
    | "Health"
    | "Education";
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [renewalDate, setRenewalDate] = useState("");
  const [category, setCategory] = useState<
    | "Other"
    | "Entertainment"
    | "Productivity"
    | "Utilities"
    | "Health"
    | "Education"
  >("Other");
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const router = useRouter();
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data, error: supabaseError } = await supabase
          .from("subscriptions")
          .select("*");

        if (supabaseError) {
          throw supabaseError;
        }
        setSubscriptions(data || []);
      } catch (error: any) {
        setError(error.message || "Error fetching subscriptions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [router]);
  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      if (sub.billing_cycle === "yearly") {
        return total + sub.cost / 12;
      }
      return total + sub.cost;
    }, 0);
  }, [subscriptions]);

  const totalDailyCost = useMemo(
    () => totalMonthlyCost / 30,
    [totalMonthlyCost],
  );

  const totalWeeklyCost = useMemo(
    () => totalMonthlyCost / 4.345,
    [totalMonthlyCost],
  );
  const totalYearlyCost = useMemo(
    () => totalMonthlyCost * 12,
    [totalMonthlyCost],
  );
  const categoryColors: Record<string, string[]> = {
    Other: ["gray", "text-gray-700 bg-gray-100"],
    Entertainment: ["green", "text-green-700 bg-green-100"],
    Productivity: ["yellow", "text-yellow-700 bg-yellow-100"],
    Utilities: ["orange", "text-orange-700 bg-orange-100"],
    Health: ["blue", "text-blue-700 bg-blue-100"],
    Education: ["teal", "text-teal-700 bg-teal-100"],
  };

  const singleChartData = useMemo(() => {
    return subscriptions.map((sub) => ({
      name: sub.name,
      value: sub.billing_cycle === "yearly" ? sub.cost / 12 : sub.cost,
      fill: categoryColors[sub.category][0],
    }));
  }, [subscriptions, categoryColors]);

  const chartData = useMemo(() => {
    return [
      {
        name: "Monthly Cost",
        value: subscriptions
          .filter((sub) => sub.billing_cycle === "monthly")
          .reduce((total, sub) => total + sub.cost, 0),
        fill: "blue",
      },
      {
        name: "Yearly Cost (Per Month Equivalent)",
        value: subscriptions
          .filter((sub) => sub.billing_cycle === "yearly")
          .reduce((total, sub) => total + sub.cost / 12, 0),
        fill: "green",
      },
    ];
  }, [subscriptions]);

  const calculateCategoryTotals = () => {
    return Object.entries(
      subscriptions.reduce(
        (totals, sub) => {
          totals[sub.category] = (totals[sub.category] || 0) + sub.cost;
          return totals;
        },
        {} as Record<string, number>,
      ),
    );
  };

  const categoryChartData = useMemo(() => {
    return calculateCategoryTotals().map(([category, value]) => ({
      name: category,
      value,
      fill: categoryColors[category][0],
    }));
  }, [subscriptions, categoryColors]);

  const renderChartLegend = (items: Array<{ name: string; fill?: string }>) => {
    return (
      <div className="max-h-20 overflow-y-auto pt-2">
        <ul className="flex w-full flex-wrap justify-center gap-3 text-sm">
          {items.map((entry) => (
            <li key={entry.name} className="flex items-center gap-2 text-black">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.fill ?? "#000" }}
              />
              <span className="text-black">{entry.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const monthlySubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => sub.billing_cycle === "monthly")
      .length;
  }, [subscriptions]);

  const yearlySubscriptions = useMemo(() => {
    return subscriptions.length - monthlySubscriptions;
  }, [subscriptions, monthlySubscriptions]);

  const nextRenewal = useMemo(() => {
    return subscriptions.length
      ? subscriptions.reduce((earliest, sub) => {
          const renewalDateValue = new Date(sub.renewal_date).getTime();
          return renewalDateValue < earliest ? renewalDateValue : earliest;
        }, new Date(subscriptions[0].renewal_date).getTime())
      : null;
  }, [subscriptions]);

  const [sortBy, setSortBy] = useState<string>("renewal-asc");

  const sortedSubscriptions = useMemo(() => {
    const list = [...subscriptions];
    list.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "cost-desc":
          return b.cost - a.cost;
        case "cost-asc":
          return a.cost - b.cost;
        case "renewal-asc":
          return (
            new Date(a.renewal_date).getTime() -
            new Date(b.renewal_date).getTime()
          );
        case "renewal-desc":
          return (
            new Date(b.renewal_date).getTime() -
            new Date(a.renewal_date).getTime()
          );
        case "category-asc":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return list;
  }, [subscriptions, sortBy]);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleCreateSubscription = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      if (parseFloat(cost) <= 0) {
        throw new Error("Cost must be a positive number");
      }
      const duplicate = subscriptions.find(
        (sub) => sub.name.trim().toLowerCase() === name.trim().toLowerCase(),
      );
      if (duplicate) {
        throw new Error("A subscription with this name already exists.");
      }
      const { data: newSubscription, error: insertError } = await supabase
        .from("subscriptions")
        .insert([
          {
            name,
            cost: parseFloat(cost),
            billing_cycle: billingCycle,
            renewal_date: renewalDate,
            category,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSubscriptions((prev) => [...prev, newSubscription]);
      setName("");
      setCost("");
      setBillingCycle("monthly");
      setRenewalDate("");
      setCategory("Other");
      setIsDialogOpen(false);
    } catch (error: any) {
      alert(error.message || "Error creating subscription.");
    }
  };

  const handleUpdateSubscription = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!editingSubscription) return;

    try {
      const duplicate = subscriptions.find(
        (sub) =>
          sub.id !== editingSubscription.id &&
          sub.name.trim().toLowerCase() ===
            editingSubscription.name.trim().toLowerCase(),
      );
      if (duplicate) {
        throw new Error("A subscription with this name already exists.");
      }
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          name: editingSubscription.name,
          cost: parseFloat(editingSubscription.cost.toString()),
          billing_cycle: editingSubscription.billing_cycle,
          renewal_date: editingSubscription.renewal_date,
          category: editingSubscription.category,
        })
        .eq("id", editingSubscription.id);

      if (updateError) {
        throw updateError;
      }

      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === editingSubscription.id ? editingSubscription : sub,
        ),
      );

      setEditingSubscription(null);
    } catch (error: any) {
      alert(error.message || "Error updating subscription.");
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this subscription?",
    );
    if (!confirmDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (error: any) {
      alert(error.message || "Error deleting subscription.");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      router.push("/login");
    } catch (error: any) {
      alert(error.message || "Error logging out.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Too Many Subscriptions
          </h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                  + Add
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Subscription</DialogTitle>
                    <DialogDescription>
                      Fill in the details for your new subscription.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubscription}>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Cost</label>
                      <Input
                        type="number"
                        min={0.01}
                        max={1000000}
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">
                        Billing Cycle
                      </label>
                      <select
                        className="w-full border rounded p-2"
                        value={billingCycle}
                        onChange={(e) =>
                          setBillingCycle(
                            e.target.value as "monthly" | "yearly",
                          )
                        }
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">
                        Renewal Date
                      </label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        className="w-full border rounded p-2"
                        value={category}
                        onChange={(e) =>
                          setCategory(
                            e.target.value as
                              | "Other"
                              | "Entertainment"
                              | "Productivity"
                              | "Utilities"
                              | "Health"
                              | "Education",
                          )
                        }
                      >
                        <option value="Other">Other</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Health">Health</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button type="submit">Create Subscription</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="px-6 py-8 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Your subscriptions
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  Overview
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  A quick look at your recurring costs and upcoming renewals.
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {subscriptions.length} active items
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Total subscriptions</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {subscriptions.length}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Daily estimate</p>

                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalDailyCost)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Weekly estimate</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalWeeklyCost)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Monthly estimate</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalMonthlyCost)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Yearly estimate</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalYearlyCost)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Next renewal</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {nextRenewal
                    ? new Date(nextRenewal).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {monthlySubscriptions} monthly / {yearlySubscriptions} yearly
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No subscriptions yet.</p>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">
                <div className="flex h-88 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex-none">Chart by Billing Cycle</div>
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.filter((entry) => entry.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        />
                        <Tooltip
                          formatter={(value) => {
                            if (typeof value === "number") {
                              return `$${value.toFixed(2)}`;
                            }
                            return String(value ?? "");
                          }}
                          contentStyle={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            color: "#000000",
                          }}
                          itemStyle={{ color: "#000000" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderChartLegend(
                    chartData.filter((entry) => entry.value > 0),
                  )}
                </div>
                <div className="flex h-88 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex-none">Chart by Subscription</div>
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={singleChartData.filter(
                            (entry) => entry.value > 0,
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        />
                        <Tooltip
                          formatter={(value) => {
                            if (typeof value === "number") {
                              return `$${value.toFixed(2)}`;
                            }
                            return String(value ?? "");
                          }}
                          contentStyle={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            color: "#000000",
                          }}
                          itemStyle={{ color: "#000000" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderChartLegend(
                    singleChartData.filter((entry) => entry.value > 0),
                  )}
                </div>
                <div className="flex h-88 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex-none">Chart by Category</div>
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData.filter(
                            (entry) => entry.value > 0,
                          )}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        />
                        <Tooltip
                          formatter={(value) => {
                            if (typeof value === "number") {
                              return `$${value.toFixed(2)}`;
                            }
                            return String(value ?? "");
                          }}
                          contentStyle={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            color: "#000000",
                          }}
                          itemStyle={{ color: "#000000" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {renderChartLegend(
                    categoryChartData.filter((entry) => entry.value > 0),
                  )}
                </div>
              </div>
            )}
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No subscriptions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
                  <div className="text-sm font-medium text-gray-700">
                    Showing {sortedSubscriptions.length} subscriptions
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="sort-select"
                      className="text-sm font-medium text-gray-600"
                    >
                      Sort by:
                    </label>
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm outline-none transition cursor-pointer hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="renewal-asc">
                        Renewal Date (Earliest first)
                      </option>
                      <option value="renewal-desc">
                        Renewal Date (Latest first)
                      </option>
                      <option value="name-asc">Name (A – Z)</option>
                      <option value="name-desc">Name (Z – A)</option>
                      <option value="cost-desc">Cost (High to Low)</option>
                      <option value="cost-asc">Cost (Low to High)</option>
                      <option value="category-asc">Category (A – Z)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700 text-sm">
                          Name
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">
                          Cost
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">
                          Billing
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">
                          Renewal
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">
                          Category
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 text-sm">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSubscriptions.map((subscription) => (
                        <TableRow
                          key={subscription.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition"
                        >
                          <TableCell className="text-sm text-gray-900">
                            {subscription.name}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900 font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(subscription.cost)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${subscription.billing_cycle === "monthly" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-green-700"}`}
                            >
                              {subscription.billing_cycle === "monthly"
                                ? "Monthly"
                                : "Yearly"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              subscription.renewal_date,
                            ).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${categoryColors[subscription.category][1]}`}
                            >
                              {subscription.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingSubscription(subscription)
                              }
                              className="text-gray-400 hover:text-blue-600 transition text-sm font-medium"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteSubscription(subscription.id)
                              }
                              className="text-gray-400 hover:text-red-600 transition text-sm font-medium"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
        <Dialog
          open={editingSubscription !== null}
          onOpenChange={(open) => {
            if (!open) setEditingSubscription(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update the details for your subscription.
              </DialogDescription>
            </DialogHeader>
            {editingSubscription && (
              <form onSubmit={handleUpdateSubscription}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name">Name</label>
                      <Input
                        maxLength={100}
                        type="text"
                        value={editingSubscription.name}
                        onChange={(e) =>
                          setEditingSubscription({
                            ...editingSubscription,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cost">Cost</label>
                      <Input
                        step="0.01"
                        type="number"
                        min={0.01}
                        max={1000000}
                        value={editingSubscription.cost}
                        onChange={(e) =>
                          setEditingSubscription({
                            ...editingSubscription,
                            cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="billing_cycle"
                        className="text-sm font-medium"
                      >
                        Billing Cycle
                      </label>
                      <select
                        className="w-full border rounded p-2 mt-1"
                        value={editingSubscription.billing_cycle}
                        onChange={(e) =>
                          setEditingSubscription({
                            ...editingSubscription,
                            billing_cycle: e.target.value as
                              | "monthly"
                              | "yearly",
                          })
                        }
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="renewal_date">Renewal Date</label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={editingSubscription.renewal_date}
                        onChange={(e) =>
                          setEditingSubscription({
                            ...editingSubscription,
                            renewal_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="category">Category</label>
                      <select
                        className="w-full border rounded p-2"
                        value={editingSubscription.category}
                        onChange={(e) =>
                          setEditingSubscription({
                            ...editingSubscription,
                            category: e.target.value as
                              | "Other"
                              | "Entertainment"
                              | "Productivity"
                              | "Utilities"
                              | "Health"
                              | "Education",
                          })
                        }
                      >
                        <option value="Other">Other</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Health">Health</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="submit">Update</Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingSubscription(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
