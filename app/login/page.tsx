"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"coach" | "kid">("coach");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Coach fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Kid fields
  const [username, setUsername] = useState("");
  const [magicCode, setMagicCode] = useState("");

  const handleCoachAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isRegistering
        ? "/api/auth/coach/register"
        : "/api/auth/coach/login";
      const body = isRegistering
        ? { email, password, name }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect to coach dashboard
      router.push("/coach");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKidLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/team-member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, magicCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect to kid's progress page
      router.push("/my-progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            OBOB.dog
          </Link>
          <p className="text-gray-600 mt-2">Login to track your progress</p>
        </div>

        <Card className="p-6">
          <ToggleGroup
            type="single"
            value={loginType}
            onValueChange={(value) => {
              if (value) {
                setLoginType(value as "coach" | "kid");
                setError("");
                setIsRegistering(false);
              }
            }}
            className="mb-6"
          >
            <ToggleGroupItem
              value="coach"
              className="flex-1 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
            >
              Parent/Coach
            </ToggleGroupItem>
            <ToggleGroupItem
              value="kid"
              className="flex-1 data-[state=on]:bg-green-500 data-[state=on]:text-white"
            >
              Team Member
            </ToggleGroupItem>
          </ToggleGroup>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {loginType === "coach" ? (
            <form onSubmit={handleCoachAuth} className="space-y-4">
              {isRegistering && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isRegistering ? "At least 8 characters" : "Your password"}
                  minLength={isRegistering ? 8 : undefined}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isRegistering
                  ? "Create Account"
                  : "Login"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                  }}
                  className="text-blue-600 hover:underline"
                >
                  {isRegistering
                    ? "Already have an account? Login"
                    : "Need an account? Register"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleKidLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Your username"
                />
              </div>
              <div>
                <Label htmlFor="magicCode">Magic Code</Label>
                <Input
                  id="magicCode"
                  type="text"
                  value={magicCode}
                  onChange={(e) => setMagicCode(e.target.value.toUpperCase())}
                  required
                  placeholder="ABC123"
                  maxLength={6}
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your coach for your magic code
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
