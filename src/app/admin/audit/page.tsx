"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { History, ChevronLeft, ChevronRight, Search, X, Filter } from "lucide-react";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditLogEntry } from "@/types";

const PAGE_SIZE = 50;

const ACTION_FILTERS = [
  "All",
  "APPROVED",
  "REJECTED",
  "EDITED",
  "QUEUED",
  "DELETED",
] as const;

type ActionFilter = (typeof ACTION_FILTERS)[number];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<ActionFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchEntries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (activeAction !== "All") {
      params.set("action", activeAction);
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    fetch(`/api/audit?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, activeAction, searchTerm]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* Client-side fallback: filter by article title if the API doesn't support search */
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return entries;
    const q = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      // The API includes article: { title, outlet } on each row
      const articleTitle =
        ((entry as unknown) as { article?: { title?: string } })
          .article?.title ?? "";
      const details = entry.details ?? "";
      return (
        articleTitle.toLowerCase().includes(q) ||
        details.toLowerCase().includes(q)
      );
    });
  }, [entries, searchTerm]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* Pagination display: "Showing 1-50 of 658" */
  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  function handleActionFilter(action: ActionFilter) {
    setActiveAction(action);
    setPage(1);
  }

  function handleSearch() {
    setSearchTerm(searchInput);
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <History className="h-6 w-6 text-brand-400" />
            Audit Log
          </h1>
          <p className="text-sm text-ink-meta mt-0.5 font-sans">
            Complete record of admin actions — {total} total entries.
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="space-y-3">
        {/* Action filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-ink-meta shrink-0" />
          {ACTION_FILTERS.map((action) => (
            <button
              key={action}
              onClick={() => handleActionFilter(action)}
              className={
                "inline-flex items-center px-3 py-1 text-xs font-sans font-medium rounded-full border transition-all duration-150 " +
                (activeAction === action
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-ink-meta border-paper-rule hover:border-ink hover:text-ink")
              }
            >
              {action === "All" ? "All" : action}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-meta pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Search by article title..."
              className="w-full pl-9 pr-9 py-1.5 text-sm font-sans bg-white border border-paper-rule rounded-md text-ink placeholder:text-ink-meta focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-meta hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSearch}
            disabled={loading}
            className="font-sans"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-serif text-lg text-ink-meta">
            {searchTerm
              ? `No entries matching "${searchTerm}"`
              : activeAction !== "All"
                ? `No ${activeAction} entries found`
                : "No audit entries yet"}
          </p>
          {(searchTerm || activeAction !== "All") && (
            <button
              onClick={() => {
                clearSearch();
                setActiveAction("All");
              }}
              className="mt-2 text-sm font-sans text-brand-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <AuditLogTable entries={filteredEntries} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm font-sans text-ink-meta">
          <span>
            Showing {rangeStart}–{rangeEnd} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="text-xs text-ink-meta tabular-nums px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
