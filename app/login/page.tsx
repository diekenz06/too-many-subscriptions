"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setMessage("Login successful!");
      router.push("/dashboard");
    } catch (error: any) {
      setMessage(error.message || "Error logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-md p-8">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <CardContent>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          {message && <div className="text-sm text-red-500">{message}</div>}
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
