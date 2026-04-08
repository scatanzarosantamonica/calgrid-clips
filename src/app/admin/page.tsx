"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  AlertCircle,
  CheckCircle,
  BarChart3,
  History,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

/* ---------- types ---------- */

interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string;
  timestamp: string;
  article: { title: string; outlet: string };
}

interface AdminStats {
  pendingReview: number;
  needsManual: number;
  approvedThisWeek: number;
  totalApproved: number;
  recentAudit: AuditEntry[];
}

/* ---------- action badge styles (mirrors AuditLogTable) ---------- */

const ACTION_STYLE: Record<string, string> = {
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject:  "bg-red-50 text-red-600 border-red-200",
  create:  "bg-blue-50 text-blue-700 border-blue-200",
  update:  "bg-amber-50 text-amber-700 border-amber-200",
  delete:  "bg-red-50 text-red-600 border-red-200",
};

/* ---------- stat card config ---------- */

interface CardConfig {
  label: string;
  key: keyof Pick<AdminStats, "pendingReview" | "needsManual" | "approvedThisWeek" | "totalApproved">;
  icon: React.FC<{ className?: string }>;
  accent: string;       // border-left / ring color
  accentBg: string;     // icon background
  href?: string;
}

const CARDS: CardConfig[] = [
  {
    label: "Pending Review",
    key: "pendingReview",
    icon: Inbox,
    accent: "border-l-amber-400",
    accentBg: "bg-amber-50 text-amber-600",
    href: "/admin/queue",
  },
  {
    label: "Needs Manual Summary",
    key: "needsManual",
    icon: AlertCircle,
    accent: "border-l-orange-400",
    accentBg: "bg-orange-50 text-orange-600",
    href: "/admin/queue",
  },
  {
    label: "Approved This Week",
    key: "approvedThisWeek",
    icon: CheckCircle,
    accent: "border-l-emerald-400",
    accentBg: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Total Published",
    key: "totalApproved",
    icon: BarChart3,
    accent: "border-l-blue-500",
    accentBg: "bg-blue-50 text-blue-600",
  },
];

/* ---------- skeleton helpers ---------- */

function CardSkeleton() {
  return (
    <div className="bg-white border border-paper-rule rounded-lg p-5 border-l-4 border-l-paper-rule animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-paper-hover rounded" />
          <div className="h-8 w-16 bg-paper-hover rounded" />
        </div>
        <div className="h-10 w-10 bg-paper-hover rounded-lg" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-14 bg-paper-hover rounded" />
          <div className="h-5 w-16 bg-paper-hover rounded-sm" />
          <div className="h-3 w-48 bg-paper-hover rounded" />
        </div>
      ))}
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: AdminStats = await res.json();
        if (!cancelled) setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ---------- header ---------- */}
      <div>
        <h1 className="font-serif text-2xl text-ink font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="font-sans text-sm text-ink-meta mt-1">
          Overview of your editorial pipeline
        </p>
      </div>

      {/* ---------- stat cards ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : CARDS.map((card) => {
              const Icon = card.icon;
              const value = stats ? stats[card.key] : 0;
              const inner = (
                <div
                  className={cn(
                    "bg-white border border-paper-rule rounded-lg p-5 border-l-4 shadow-sm transition-shadow",
                    card.accent,
                    card.href && "hover:shadow-md cursor-pointer",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans text-xs text-ink-meta uppercase tracking-wide font-medium">
                        {card.label}
                      </p>
                      <p className="font-serif text-3xl text-ink font-bold mt-1 tabular-nums">
                        {value}
                      </p>
                    </div>
                    <div className={cn("p-2.5 rounded-lg", card.accentBg)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );

              return card.href ? (
                <Link key={card.key} href={card.href}>
                  {inner}
                </Link>
              ) : (
                <div key={card.key}>{inner}</div>
              );
            })}
      </div>

      {/* ---------- recent activity ---------- */}
      <div className="bg-white border border-paper-rule rounded-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-paper-rule">
          <History className="h-4 w-4 text-ink-meta" />
          <h2 className="font-serif text-lg text-ink font-semibold">
            Recent Activity
          </h2>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <ActivitySkeleton />
          ) : !stats?.recentAudit?.length ? (
            <p className="font-sans text-sm text-ink-meta text-center py-8">
              No recent activity
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.recentAudit.slice(0, 5).map((entry) => {
                const actionCls =
                  ACTION_STYLE[entry.action] ??
                  "bg-paper-hover text-ink-meta border-paper-rule";
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 text-sm font-sans"
                  >
                    <span className="text-xs text-ink-meta whitespace-nowrap tabular-nums w-16 shrink-0">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                    <span
                      className={cn(
                        "inline-block text-[10px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-sm shrink-0",
                        actionCls,
                      )}
                    >
                      {entry.action}
                    </span>
                    <span className="text-ink-lead truncate">
                      {entry.article.title}
                    </span>
                    <span className="text-ink-meta text-xs truncate shrink-0 ml-auto">
                      {entry.article.outlet}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
