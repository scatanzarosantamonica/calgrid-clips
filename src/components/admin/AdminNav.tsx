"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, LayoutDashboard, PlusCircle, History, LogOut, Mail } from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------- nav items ---------- */

const NAV_ITEMS = [
  { label: "Queue",        href: "/admin/queue",        icon: Inbox },
  { label: "Dashboard",    href: "/admin",              icon: LayoutDashboard },
  { label: "Clips Builder",href: "/admin/clips",        icon: Mail },
  { label: "Manual Entry", href: "/admin/manual-entry",  icon: PlusCircle },
  { label: "Audit Log",    href: "/admin/audit",        icon: History },
] as const;

/* ---------- component ---------- */

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-paper-rule">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* top strip */}
        <div className="flex items-center justify-between py-2 border-b border-paper-rule">
          <Link href="/" className="inline-flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-serif font-bold text-ink text-sm tracking-tight leading-none">
              CalGrid News
            </span>
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink-meta border border-paper-rule px-1.5 py-0.5 rounded-sm">
              Admin
            </span>
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

        {/* nav */}
        <nav className="flex items-center gap-0 overflow-x-auto -mb-px" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
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
