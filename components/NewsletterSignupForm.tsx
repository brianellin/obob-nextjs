"use client";

import { useState } from "react";
import { Send, PawPrint, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ROLES = [
  { value: "Student", label: "Student" },
  { value: "Parent/Guardian", label: "Parent/Guardian" },
  { value: "Teacher/Librarian", label: "Teacher/Librarian" },
  { value: "OBOB Volunteer", label: "OBOB Volunteer" },
];

const DIVISIONS = [
  { value: "elementary", label: "Elementary (3-5)" },
  { value: "middle", label: "Middle School (6-8)" },
  { value: "high", label: "High School (9-12)" },
];

export default function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [divisions, setDivisions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!role) {
      setError("Please select your role");
      return;
    }

    // Client-side check for student emails
    if (email.toLowerCase().includes("student")) {
      setError(
        "It looks like you're using a school or student email address. Unfortunately, we can't send emails to these addresses. Please ask a parent or guardian to sign up with their email instead!"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          role,
          divisions: divisions.length > 0 ? divisions : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setEmail("");
        setName("");
        setRole("");
        setDivisions([]);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <p className="text-xl font-medium text-green-600">
            Woof! You&apos;re signed up!
          </p>
          <PawPrint
            className="h-6 w-6 text-black drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
            style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" }}
          />
        </div>
        <p className="text-gray-600">
          Thanks for joining our mailing list. We&apos;ll keep you updated on
          all things OBOB!
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setIsSubmitted(false)}
        >
          Sign up another email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email address <span className="text-red-500">*</span>
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Name <span className="text-gray-400">(optional)</span>
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I am a... <span className="text-red-500">*</span>
        </label>
        <ToggleGroup
          type="single"
          value={role}
          onValueChange={(value) => value && setRole(value)}
          className="flex flex-wrap justify-start gap-2"
        >
          {ROLES.map((r) => (
            <ToggleGroupItem
              key={r.value}
              value={r.value}
              aria-label={r.label}
              className="text-sm data-[state=on]:bg-purple-600 data-[state=on]:text-white hover:bg-gray-100"
            >
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          I&apos;m interested in...{" "}
          <span className="text-gray-400">(select all that apply)</span>
        </label>
        <ToggleGroup
          type="multiple"
          value={divisions}
          onValueChange={setDivisions}
          className="flex flex-wrap justify-start gap-2"
        >
          {DIVISIONS.map((d) => (
            <ToggleGroupItem
              key={d.value}
              value={d.value}
              aria-label={d.label}
              className="text-sm data-[state=on]:bg-cyan-500 data-[state=on]:text-white hover:bg-gray-100"
            >
              {d.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          "Signing up..."
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Sign Up for Updates
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        We won't ever share or sell your info. Unsubscribe anytime.
      </p>
    </form>
  );
}
