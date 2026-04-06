"use client";

import React from "react";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry } from "@/types";
import { cn } from "@/lib/utils";

/* ---------- action styling ---------- */

const ACTION_STYLE: Record<string, string> = {
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject:  "bg-red-50 text-red-600 border-red-200",
  create:  "bg-blue-50 text-blue-700 border-blue-200",
  update:  "bg-amber-50 text-amber-700 border-amber-200",
  delete:  "bg-red-50 text-red-600 border-red-200",
};

/* ---------- component ---------- */

interface AuditLogTableProps {
  entries:    AuditLogEntry[];
  loading?:   boolean;
  className?: string;
}

export function AuditLogTable({ entries, loading, className }: AuditLogTableProps) {
  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-paper-hover rounded" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn("text-center py-16", className)}>
        <p className="font-serif text-lg text-ink-meta">No audit entries yet</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-[12px] font-sans">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="py-2 pr-4 font-bold uppercase tracking-widest text-[10px] text-ink">
              When
            </th>
            <th className="py-2 pr-4 font-bold uppercase tracking-widest text-[10px] text-ink">
              Action
            </th>
            <th className="py-2 pr-4 font-bold uppercase tracking-widest text-[10px] text-ink">
              Entity
            </th>
            <th className="py-2 pr-4 font-bold uppercase tracking-widest text-[10px] text-ink">
              User
            </th>
            <th className="py-2 font-bold uppercase tracking-widest text-[10px] text-ink">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const actionCls = ACTION_STYLE[entry.action] ?? "bg-paper-hover text-ink-meta border-paper-rule";
            return (
              <tr
                key={entry.id}
                className="border-b border-paper-rule hover:bg-paper-hover transition-colors"
              >
                <td className="py-2 pr-4 text-ink-muted whitespace-nowrap tabular-nums">
                  {formatRelativeTime(entry.createdAt)}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-sm",
                      actionCls,
                    )}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="py-2 pr-4 text-ink-lead">
                  {entry.entity}
                  {entry.entityId && (
                    <span className="text-ink-muted ml-1">
                      #{entry.entityId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-ink-meta">
                  {entry.userName || entry.userId || "system"}
                </td>
                <td className="py-2 text-ink-muted max-w-[240px] truncate">
                  {entry.details ?? "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
