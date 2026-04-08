"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Inbox, RefreshCw, Filter, CheckCircle2, XCircle, AlertCircle, Clock,
  Search, X, Plus, ChevronDown, CheckSquare,
} from "lucide-react";
import { QueueItem }    from "@/components/admin/QueueItem";
import UrlFetchBar      from "@/components/admin/UrlFetchBar";
import { Button }       from "@/components/ui/button";
import { Skeleton }     from "@/components/ui/skeleton";
import { cn }           from "@/lib/utils";
import type { Article, ArticleStatus } from "@/types";

const STATUS_TABS: { label: string; value: string; icon: React.FC<{ className?: string }> }[] = [
  { label: "Queue",    value: "QUEUED,NEEDS_MANUAL", icon: Inbox        },
  { label: "Approved", value: "APPROVED",            icon: CheckCircle2 },
  { label: "Rejected", value: "REJECTED",            icon: XCircle      },
  { label: "All",      value: "all",                 icon: Filter       },
];

export default function QueuePage() {
  const [articles,    setArticles]    = useState<Article[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("QUEUED,NEEDS_MANUAL");
  const [refreshing,  setRefreshing]  = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch ── */

  const fetchQueue = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "QUEUED,NEEDS_MANUAL") {
        const [q, m] = await Promise.all([
          fetch("/api/queue?status=QUEUED").then((r) => r.json()),
          fetch("/api/queue?status=NEEDS_MANUAL").then((r) => r.json()),
        ]);
        setArticles(
          [...(Array.isArray(q) ? q : []), ...(Array.isArray(m) ? m : [])].sort(
            (a, b) =>
              (b.priority ? 1 : 0) - (a.priority ? 1 : 0) ||
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        const url =
          tab === "all" ? "/api/queue?status=QUEUED" : `/api/queue?status=${tab}`;
        const res  = await fetch(url);
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(activeTab); }, [activeTab, fetchQueue]);

  // Clear selection when tab changes
  useEffect(() => { setSelectedIds(new Set()); }, [activeTab]);

  /* ── Filtered articles ── */

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.outlet?.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  /* ── Handlers ── */

  function handleArticleFetched(article: Article) {
    if (activeTab === "QUEUED,NEEDS_MANUAL") {
      setArticles((prev) => [article, ...prev.filter((a) => a.id !== article.id)]);
    } else {
      setActiveTab("QUEUED,NEEDS_MANUAL");
    }
    // Auto-collapse after 3s
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setAddOpen(false), 3000);
  }

  async function handleAction(id: string, action: "APPROVED" | "REJECTED" | "NEEDS_MANUAL") {
    const endpoint =
      action === "APPROVED"   ? `/api/articles/${id}/approve`
      : action === "REJECTED" ? `/api/articles/${id}/reject`
      : `/api/articles/${id}`;

    const res = await fetch(
      endpoint,
      action === "NEEDS_MANUAL"
        ? {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ status: "NEEDS_MANUAL" }),
          }
        : { method: "POST" }
    );
    if (!res.ok) throw new Error("Action failed");

    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action as ArticleStatus } : a))
    );
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setArticles((prev) => prev.filter((a) => a.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleUpdated(updated: Article) {
    setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchQueue(activeTab);
    setRefreshing(false);
  }

  /* ── Selection ── */

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    const allIds = filteredArticles.map((a) => a.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  async function handleBulkAction(action: "APPROVED" | "REJECTED") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => handleAction(id, action))
      );
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  }

  /* ── Derived ── */

  const counts = {
    queued:   articles.filter((a) => a.status === "QUEUED").length,
    manual:   articles.filter((a) => a.status === "NEEDS_MANUAL").length,
    priority: articles.filter((a) => a.priority).length,
  };

  const allVisibleSelected =
    filteredArticles.length > 0 &&
    filteredArticles.every((a) => selectedIds.has(a.id));

  /* ── Render ── */

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">
            Review Queue
          </h1>
          <p className="text-sm text-ink-meta mt-0.5 font-sans">
            Approve or reject articles before they appear on the dashboard.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Collapsible Add Article */}
      <div className="space-y-2">
        <button
          onClick={() => setAddOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-sans font-medium transition-all duration-150",
            addOpen
              ? "bg-white border-paper-rule text-ink"
              : "bg-white border-paper-rule text-ink hover:border-ink/30"
          )}
        >
          {addOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {addOpen ? "Hide" : "Add Article"}
        </button>
        {addOpen && (
          <div className="animate-in slide-in-from-top-1 duration-150">
            <UrlFetchBar onArticleFetched={handleArticleFetched} />
          </div>
        )}
      </div>

      {/* Stat Chips */}
      {activeTab === "QUEUED,NEEDS_MANUAL" && !loading && (
        <div className="flex items-center gap-3 flex-wrap">
          <StatChip
            icon={<Inbox className="h-3 w-3" />}
            label="Queued"
            count={counts.queued}
            variant="default"
          />
          <StatChip
            icon={<AlertCircle className="h-3 w-3" />}
            label="Needs Manual"
            count={counts.manual}
            variant="warning"
          />
          <StatChip
            icon={<Clock className="h-3 w-3 text-purple-400" />}
            label="Priority"
            count={counts.priority}
            variant="purple"
          />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-meta" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or outlet..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-paper-rule bg-white text-sm text-ink font-sans placeholder:text-ink-meta/60 focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-meta hover:text-ink transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-paper-rule">
        {STATUS_TABS.map(({ label, value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium font-sans border-b-2 transition-all duration-150",
              activeTab === value
                ? "border-ink text-ink"
                : "border-transparent text-ink-meta hover:text-ink hover:border-ink/30"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Select All / Count bar */}
      {!loading && filteredArticles.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm font-sans text-ink-meta hover:text-ink transition-colors"
          >
            <CheckSquare className={cn("h-4 w-4", allVisibleSelected && "text-ink")} />
            {allVisibleSelected ? "Deselect All" : "Select All"}
          </button>
          <span className="text-sm font-sans text-ink-meta">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedIds.size > 0 && (
              <span className="ml-2 font-medium text-ink">
                ({selectedIds.size} selected)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Article List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <QueueItemSkeleton key={i} />)}
        </div>
      ) : filteredArticles.length === 0 ? (
        searchQuery ? (
          <div className="text-center py-16 space-y-3">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-white border border-paper-rule flex items-center justify-center">
                <Search className="h-8 w-8 text-ink-meta" />
              </div>
            </div>
            <h3 className="font-serif font-semibold text-ink">No results</h3>
            <p className="text-sm text-ink-meta font-sans">
              No articles match &ldquo;{searchQuery}&rdquo;.{" "}
              <button
                onClick={() => setSearchQuery("")}
                className="underline hover:text-ink transition-colors"
              >
                Clear search
              </button>
            </p>
          </div>
        ) : (
          <EmptyState tab={activeTab} />
        )
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <QueueItem
              key={article.id}
              article={article}
              onAction={handleAction}
              onUpdated={handleUpdated}
              onDelete={handleDelete}
              selected={selectedIds.has(article.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-ink text-white rounded-lg shadow-lg px-5 py-3 animate-in slide-in-from-bottom-2 duration-200">
          <span className="text-sm font-sans font-medium">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5 bg-white/20" />
          <Button
            size="sm"
            disabled={bulkLoading}
            onClick={() => handleBulkAction("APPROVED")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-1.5 font-sans"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve Selected ({selectedIds.size})
          </Button>
          <Button
            size="sm"
            disabled={bulkLoading}
            onClick={() => handleBulkAction("REJECTED")}
            className="bg-red-600 hover:bg-red-700 text-white border-none gap-1.5 font-sans"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject Selected ({selectedIds.size})
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatChip({
  icon, label, count, variant,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  variant: "default" | "warning" | "purple";
}) {
  const cls = {
    default: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    purple:  "bg-purple-500/10 border-purple-500/20 text-purple-400",
  }[variant];

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium font-sans ${cls}`}
    >
      {icon}
      {label}
      <span className="font-bold">{count}</span>
    </div>
  );
}

function QueueItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-paper-rule p-4 space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  const isQueue = tab === "QUEUED,NEEDS_MANUAL";
  return (
    <div className="text-center py-16 space-y-3">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-2xl bg-white border border-paper-rule flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
      </div>
      <h3 className="font-serif font-semibold text-ink">
        {isQueue ? "Queue is clear!" : "No articles found"}
      </h3>
      <p className="text-sm text-ink-meta font-sans">
        {isQueue
          ? "Click \"+ Add Article\" above or run ingestion to add articles."
          : "No articles match the selected filter."}
      </p>
    </div>
  );
}
