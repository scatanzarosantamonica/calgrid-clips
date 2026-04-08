"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox, LayoutDashboard, PlusCircle, History, LogOut, Mail, ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- nav items ---------- */

const CONTENT_ITEMS = [
  { label: "Dashboard",     href: "/admin",              icon: LayoutDashboard },
  { label: "Queue",         href: "/admin/queue",        icon: Inbox },
  { label: "Clips Builder", href: "/admin/clips",        icon: Mail },
  { label: "Manual Entry",  href: "/admin/manual-entry", icon: PlusCircle },
] as const;

const ADMIN_ITEMS = [
  { label: "Audit Log",     href: "/admin/audit",        icon: History },
] as const;

/* ---------- component ---------- */

export function AdminNav() {
  const pathname = usePathname();
  const [queueCount, setQueueCount] = useState(0);
  const [manualCount, setManualCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setQueueCount(data.pendingReview ?? 0);
          setManualCount(data.needsManual ?? 0);
        }
      } catch { /* ignore */ }
    }
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  function getBadge(href: string): number | null {
    if (href === "/admin/queue") {
      const total = queueCount + manualCount;
      return total > 0 ? total : null;
    }
    return null;
  }

  return (
    <header className="bg-white border-b border-paper-rule">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* top strip */}
        <div className="flex items-center justify-between py-2 border-b border-paper-rule">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-serif font-bold text-ink text-sm tracking-tight leading-none uppercase">
              CALGRID NEWS
            </span>
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-meta border border-paper-rule px-1.5 py-0.5 rounded-sm">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest font-sans text-ink-meta hover:text-ink transition-colors px-2 py-1"
            >
              <ExternalLink className="h-3 w-3" />
              Public View
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-1.5 text-[11px] uppercase tracking-widest font-sans text-ink-meta hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>

        {/* nav */}
        <nav className="flex items-center gap-0 overflow-x-auto -mb-px" aria-label="Admin navigation">
          {/* Content group */}
          {CONTENT_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(href + "/");
            const badge = getBadge(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3 py-3 text-[11px] font-sans font-medium uppercase tracking-[0.12em] whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-meta hover:text-ink-lead hover:border-ink-meta",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {badge !== null && (
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tabular-nums">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <span className="shrink-0 w-px h-5 bg-paper-rule mx-1 self-center" />

          {/* Admin group */}
          {ADMIN_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3 py-3 text-[11px] font-sans font-medium uppercase tracking-[0.12em] whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-meta hover:text-ink-lead hover:border-ink-meta",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
