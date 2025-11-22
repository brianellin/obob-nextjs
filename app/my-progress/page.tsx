"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, BookOpen } from "lucide-react";
import Link from "next/link";

export default function MyProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (!data.isLoggedIn || data.userType !== "team_member") {
        router.push("/login");
        return;
      }

      setSession(data);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-2xl font-bold text-green-600 hover:text-green-700">
              OBOB.dog
            </Link>
            <p className="text-gray-600 mt-1">My Progress</p>
            <p className="text-sm text-gray-500">Hello, {session?.displayName}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              Practice Questions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Practice with questions from your reading list. Your progress is automatically tracked!
            </p>
            <Link href="/">
              <Button className="w-full">Start Practicing</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Coming Soon</h3>
            <p className="text-sm text-gray-600">
              Reading tracker and detailed stats will be available soon!
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">What's Tracked</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Every question you answer during practice sessions</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Your scores and accuracy on different question types</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Which books you're strongest and weakest on</span>
            </li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
