"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
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
  }, []);

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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>Add Subscription</DialogTrigger>
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
                <label className="text-sm font-medium">Billing Cycle</label>
                <select
                  className="w-full border rounded p-2"
                  value={billingCycle}
                  onChange={(e) =>
                    setBillingCycle(e.target.value as "monthly" | "yearly")
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-medium">Renewal Date</label>
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
      <h1 className="text-2xl font-bold mb-4">Your Subscriptions</h1>
      {subscriptions.length === 0 ? (
        <p>You have no subscriptions.</p>
      ) : (
        <ul className="space-y-2">
          {subscriptions.map((subscription) => (
            <li key={subscription.id} className="border p-2">
              <h2 className="text-lg font-semibold">{subscription.name}</h2>
              <p>Cost: ${subscription.cost.toFixed(2)}</p>
              <p>Billing Cycle: {subscription.billing_cycle}</p>
              <p>Renewal Date: {subscription.renewal_date}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
