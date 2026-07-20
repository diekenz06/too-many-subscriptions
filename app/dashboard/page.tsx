"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCaption,
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
interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: "monthly" | "yearly";
  renewal_date: string;
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
  const router = useRouter();
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
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

      const { error: insertError } = await supabase
        .from("subscriptions")
        .insert([
          {
            name,
            cost: parseFloat(cost),
            billing_cycle: billingCycle,
            renewal_date: renewalDate,
            user_id: user.id,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      // Reset form fields
      setName("");
      setCost("");

      setRenewalDate("");
      setIsDialogOpen(false);

      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Error creating subscription.");
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

  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    if (sub.billing_cycle === "yearly") {
      return total + sub.cost / 12;
    }
    return total + sub.cost;
  }, 0);

  const monthlySubscriptions = subscriptions.filter(
    (sub) => sub.billing_cycle === "monthly",
  ).length;
  const yearlySubscriptions = subscriptions.length - monthlySubscriptions;
  const nextRenewal = subscriptions.length
    ? subscriptions.reduce((earliest, sub) => {
        const renewalDateValue = new Date(sub.renewal_date).getTime();
        return renewalDateValue < earliest ? renewalDateValue : earliest;
      }, new Date(subscriptions[0].renewal_date).getTime())
    : null;

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Too Many Subscriptions
          </h1>
        </div>
      </header>
      <div className="max-w-6xl mx-auto">
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Cost</label>
                      <Input
                        type="number"
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
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        required
                      />
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
                <p className="text-sm text-gray-500">Monthly estimate</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(totalMonthlyCost)}
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
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No subscriptions yet.</p>
            </div>
          ) : (
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
                    <TableHead className="text-right font-semibold text-gray-700 text-sm">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
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
                          className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${subscription.billing_cycle === "monthly" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {subscription.billing_cycle === "monthly"
                            ? "Monthly"
                            : "Yearly"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.renewal_date).toLocaleDateString(
                          "de-DE",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() =>
                            handleDeleteSubscription(subscription.id)
                          }
                          className="text-gray-400 hover:text-red-600 transition text-sm font-medium"
                        >
                          Remove
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
