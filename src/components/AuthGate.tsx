"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";

// SHA-256 hash of "Gaming123!"
const VALID_HASH =
  "2bc87f0f815b0b34a70b7d97941a9d3516f83a46d1666611fab0ecbf41070c92";

interface AuthGateProps {
  children: ReactNode;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage for existing auth
    const stored = sessionStorage.getItem("calgrid-auth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const hash = await sha256(password);
    if (hash === VALID_HASH) {
      sessionStorage.setItem("calgrid-auth", "true");
      setIsAuthenticated(true);
    } else {
      setError("Invalid password. Please try again.");
      setPassword("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="animate-pulse text-ink-faint">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="CalGrid Logo"
              width={72}
              height={72}
              className="object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="font-serif text-headline-2 text-ink">CALGRID NEWS</h1>
          <p className="text-body-sm text-ink-muted mt-1">
            California Gateway Connector Projects
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-body-sm font-medium text-ink-light mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              className="w-full h-10 rounded-md border border-rule bg-paper-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-10 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
          >
            Access Dashboard
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-caption text-ink-faint mt-8">
          Contact CalGrid for access credentials
        </p>
      </div>
    </div>
  );
}
