"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, LogOut, Copy, Check } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: number;
  username: string;
  displayName: string;
  createdAt: number;
}

interface NewMember {
  id: number;
  username: string;
  displayName: string;
  magicCode: string;
}

export default function CoachDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMember, setNewMember] = useState<NewMember | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();

      if (!data.isLoggedIn || data.userType !== "coach") {
        router.push("/login");
        return;
      }

      setSession(data);
      loadTeamMembers();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members/list");
      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error("Error loading team members:", error);
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

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/auth/team-member/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team member");
      }

      // Show success with magic code
      setNewMember(data.teamMember);
      setUsername("");
      setDisplayName("");
      loadTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const copyMagicCode = () => {
    if (newMember?.magicCode) {
      navigator.clipboard.writeText(newMember.magicCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setNewMember(null);
    setUsername("");
    setDisplayName("");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              OBOB.dog
            </Link>
            <p className="text-gray-600 mt-1">Coach Dashboard</p>
            <p className="text-sm text-gray-500">Welcome, {session?.displayName}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {newMember ? "Team Member Created!" : "Add Team Member"}
                  </DialogTitle>
                </DialogHeader>

                {newMember ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <p className="font-medium text-green-800 mb-2">
                        {newMember.displayName} ({newMember.username}) has been created!
                      </p>
                      <div className="mt-3">
                        <Label>Magic Code (save this - it won't be shown again!):</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={newMember.magicCode}
                            readOnly
                            className="font-mono text-lg"
                          />
                          <Button onClick={copyMagicCode} variant="outline">
                            {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={closeDialog} className="w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateMember} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        placeholder="e.g., Sarah Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        required
                        placeholder="e.g., sarah_s"
                        pattern="[a-z0-9_]+"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Letters, numbers, and underscores only
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating ? "Creating..." : "Create Team Member"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No team members yet. Click "Add Member" to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded border"
                >
                  <div>
                    <p className="font-medium">{member.displayName}</p>
                    <p className="text-sm text-gray-600">@{member.username}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Added {new Date(member.createdAt * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-blue-600 hover:underline">
                Practice Questions
              </Link>
              <Link href="/books" className="block text-blue-600 hover:underline">
                Browse Books
              </Link>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600">
              Team members can login using their username and magic code at the login page.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
