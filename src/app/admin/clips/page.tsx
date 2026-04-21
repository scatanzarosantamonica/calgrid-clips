"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Mail,
  ClipboardCopy,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Search,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatClipDate,
  formatSubjectDate,
  buildPlainTextClipsEmail,
  buildRichTextClipsHtml,
} from "@/lib/clips";
import type { ClipArticle, ClipSection } from "@/lib/clips";
import type { Article } from "@/types";

// ─── Section definitions (match the four public-facing categories) ───────────

const SECTIONS = [
  { key: "transmission", heading: "California Transmission" },
  { key: "energy", heading: "California Energy" },
  { key: "labor", heading: "California Labor" },
  { key: "local", heading: "Local Coverage" },
] as const;

/** Map a DB section value to its display heading */
function sectionHeading(key: string | null | undefined): string {
  return SECTIONS.find((s) => s.key === key)?.heading ?? "Uncategorized";
}

// ─── Date range options ─────────────────────────────────────────────────────

type DateRange = 7 | 14 | 30 | "all";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 14 days", value: 14 },
  { label: "Last 30 days", value: 30 },
  { label: "All", value: "all" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClipsPage() {
  // Article data from API
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(14);

  // Clip composition state – all four sections pre-populated
  const [sections, setSections] = useState<ComposerSection[]>(
    SECTIONS.map((s) => ({
      id: crypto.randomUUID(),
      heading: s.heading,
      articleIds: [],
    }))
  );
  const [activeSection, setActiveSection] = useState(0);

  // Per-article snippet overrides (keyed by article id)
  const [snippetOverrides, setSnippetOverrides] = useState<
    Record<string, string>
  >({});

  // Copy feedback
  const [copied, setCopied] = useState(false);
  const [emailReady, setEmailReady] = useState(false);

  // ── Fetch approved articles ────────────────────────────────────────────────
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/queue?status=APPROVED");
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ── Derived: selected article IDs across all sections ──────────────────────
  const allSelectedIds = useMemo(
    () => new Set(sections.flatMap((s) => s.articleIds)),
    [sections]
  );

  // ── Date-filtered articles ─────────────────────────────────────────────────
  const dateFilteredArticles = useMemo(() => {
    if (dateRange === "all") return articles;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    cutoff.setHours(0, 0, 0, 0);
    return articles.filter((a) => {
      const pubDate = new Date(a.publishedAt);
      return pubDate >= cutoff;
    });
  }, [articles, dateRange]);

  // ── Filtered articles for the picker (date + search) ───────────────────────
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return dateFilteredArticles;
    const q = search.toLowerCase();
    return dateFilteredArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.outlet.toLowerCase().includes(q) ||
        (a.author ?? "").toLowerCase().includes(q)
    );
  }, [dateFilteredArticles, search]);

  // ── Articles grouped by section for the left-side picker ──────────────────
  const groupedArticles = useMemo(() => {
    const groups: { key: string; heading: string; articles: Article[] }[] =
      SECTIONS.map((s) => ({ key: s.key, heading: s.heading, articles: [] }));
    const uncategorized: Article[] = [];

    for (const a of filteredArticles) {
      const group = groups.find((g) => g.key === a.section);
      if (group) {
        group.articles.push(a);
      } else {
        uncategorized.push(a);
      }
    }

    // Only include groups that have articles; append uncategorized at end
    const result = groups.filter((g) => g.articles.length > 0);
    if (uncategorized.length > 0) {
      result.push({ key: "uncategorized", heading: "Uncategorized", articles: uncategorized });
    }
    return result;
  }, [filteredArticles]);

  // ── Helpers: resolve snippet for an article ────────────────────────────────
  function getSnippet(article: Article): string {
    if (snippetOverrides[article.id] !== undefined)
      return snippetOverrides[article.id];
    return article.manualSummary ?? article.snippet ?? "";
  }

  function getAuthor(article: Article): string {
    return article.author?.trim() || "Staff Report";
  }

  // ── Section management ─────────────────────────────────────────────────────
  // Sections are fixed to the four main categories; no add/remove needed

  function toggleArticle(articleId: string) {
    // Find the article's section to auto-place it in the matching composer section
    const article = articleMap.get(articleId);
    const matchHeading = article ? sectionHeading(article.section) : null;

    setSections((prev) => {
      // If removing, remove from whichever section it's in
      const existingIdx = prev.findIndex((s) => s.articleIds.includes(articleId));
      if (existingIdx !== -1) {
        return prev.map((s, i) =>
          i === existingIdx
            ? { ...s, articleIds: s.articleIds.filter((id) => id !== articleId) }
            : s
        );
      }

      // If adding, place in the matching section (or active section as fallback)
      const targetIdx = matchHeading
        ? prev.findIndex((s) => s.heading === matchHeading)
        : -1;
      const addTo = targetIdx !== -1 ? targetIdx : activeSection;

      return prev.map((s, i) =>
        i === addTo ? { ...s, articleIds: [...s.articleIds, articleId] } : s
      );
    });
  }

  function removeArticleFromSection(sectionIdx: number, articleId: string) {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? { ...s, articleIds: s.articleIds.filter((id) => id !== articleId) }
          : s
      )
    );
  }

  function moveArticle(
    sectionIdx: number,
    articleIdx: number,
    dir: "up" | "down"
  ) {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIdx) return s;
        const ids = [...s.articleIds];
        const newIdx = dir === "up" ? articleIdx - 1 : articleIdx + 1;
        if (newIdx < 0 || newIdx >= ids.length) return s;
        [ids[articleIdx], ids[newIdx]] = [ids[newIdx], ids[articleIdx]];
        return { ...s, articleIds: ids };
      })
    );
  }

  // ── Build clip data for output ─────────────────────────────────────────────
  const articleMap = useMemo(() => {
    const m = new Map<string, Article>();
    for (const a of articles) m.set(a.id, a);
    return m;
  }, [articles]);

  function buildSections(): ClipSection[] {
    return sections
      .filter((s) => s.articleIds.length > 0)
      .map((s) => ({
        heading: s.heading,
        articles: s.articleIds
          .map((id) => articleMap.get(id))
          .filter(Boolean)
          .map(
            (a): ClipArticle => ({
              title: a!.title,
              url: a!.url,
              outlet: a!.outlet,
              author: getAuthor(a!),
              publishedAt: a!.publishedAt,
              snippet: getSnippet(a!),
            })
          ),
      }));
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function handleGenerateEmail() {
    const data = buildSections();
    if (data.length === 0) return;

    // Show "paste" reminder
    setEmailReady(true);
    setTimeout(() => setEmailReady(false), 4000);

    // Open mailto with just the subject (user pastes the rich text from Step 1)
    const subject = `CalGrid Clips: ${formatSubjectDate()}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}`, "_blank");
  }

  async function handleCopyRichText() {
    const data = buildSections();
    if (data.length === 0) return;
    const html = buildRichTextClipsHtml(data);
    const plain = buildPlainTextClipsEmail(data);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const totalSelected = allSelectedIds.size;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[--text-primary]">
            Generate Email Clips
          </h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">
            Select articles, assign sections, and generate a formatted email
            draft.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopyRichText}
            disabled={totalSelected === 0}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-brand-400" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied!" : "Step 1: Copy Rich Text"}
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleGenerateEmail}
            disabled={totalSelected === 0 || !copied}
          >
            {emailReady ? (
              <Check className="h-3.5 w-3.5 text-green-300" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            {emailReady ? "Now paste into email body" : "Step 2: Generate Email Draft"}
          </Button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-[1fr_1fr] gap-5">
        {/* ── Left: Article picker ─────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[--text-primary]">
              Approved Articles
            </h2>
            <span className="text-xs text-[--text-muted]">
              {totalSelected} selected
            </span>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[--text-muted] shrink-0" />
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                  dateRange === opt.value
                    ? "bg-brand-500/15 border-brand-500/30 text-brand-400"
                    : "bg-surface border-surface-border text-[--text-muted] hover:text-[--text-secondary] hover:bg-surface-raised"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--text-muted]" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-surface border border-surface-border rounded-lg text-[--text-primary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--text-muted] hover:text-[--text-secondary]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Article list grouped by section */}
          <div className="space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-[--text-muted] py-8 text-center">
                Loading articles...
              </p>
            ) : groupedArticles.length === 0 ? (
              <p className="text-sm text-[--text-muted] py-8 text-center">
                No approved articles found.
              </p>
            ) : (
              groupedArticles.map((group) => (
                <div key={group.key} className="space-y-1.5">
                  <p className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider px-1 pt-1 border-b border-surface-border pb-1.5">
                    {group.heading}
                    <span className="text-[--text-muted] font-normal ml-1.5">
                      ({group.articles.length})
                    </span>
                  </p>
                  {group.articles.map((article) => {
                    const selected = allSelectedIds.has(article.id);
                    return (
                      <button
                        key={article.id}
                        onClick={() => toggleArticle(article.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-100",
                          selected
                            ? "bg-brand-500/10 border-brand-500/30"
                            : "bg-surface border-surface-border hover:border-brand-600/40 hover:bg-surface-raised"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              "mt-0.5 h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                              selected
                                ? "bg-brand-400 border-brand-400"
                                : "border-[--text-muted]"
                            )}
                          >
                            {selected && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[--text-primary] leading-snug line-clamp-2">
                              {article.title}
                            </p>
                            <p className="text-xs text-[--text-muted] mt-0.5">
                              {article.outlet}
                              {article.author ? ` (${article.author})` : ""} &middot;{" "}
                              {formatClipDate(article.publishedAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Sections + Preview ────────────────────────────────── */}
        <div className="space-y-4">
          {/* Section tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sections.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  idx === activeSection
                    ? "bg-brand-500/15 border-brand-500/30 text-brand-400"
                    : "bg-surface border-surface-border text-[--text-secondary] hover:bg-surface-raised"
                )}
              >
                {s.heading || "Untitled"}
                <span className="text-[--text-muted]">
                  ({s.articleIds.length})
                </span>
              </button>
            ))}
          </div>

          {/* Active section editor */}
          {sections[activeSection] && (
            <div className="space-y-3">
              {/* Section heading (read-only label) */}
              <p className="text-sm font-semibold text-[--text-primary]">
                {sections[activeSection].heading}
              </p>

              {/* Articles in this section with editable snippets */}
              {sections[activeSection].articleIds.length === 0 ? (
                <p className="text-xs text-[--text-muted] py-6 text-center border border-dashed border-surface-border rounded-lg">
                  Select articles from the left panel to add them to this
                  section.
                </p>
              ) : (
                <div className="space-y-2">
                  {sections[activeSection].articleIds.map((id, aIdx) => {
                    const article = articleMap.get(id);
                    if (!article) return null;
                    return (
                      <div
                        key={id}
                        className="bg-surface border border-surface-border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 mt-0.5 text-[--text-muted] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[--text-primary] leading-snug">
                              {article.title}
                            </p>
                            <p className="text-xs text-[--text-muted] mt-0.5">
                              {article.outlet} ({getAuthor(article)}) &middot;{" "}
                              {formatClipDate(article.publishedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                moveArticle(activeSection, aIdx, "up")
                              }
                              disabled={aIdx === 0}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                moveArticle(activeSection, aIdx, "down")
                              }
                              disabled={
                                aIdx ===
                                sections[activeSection].articleIds.length - 1
                              }
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                removeArticleFromSection(activeSection, id)
                              }
                            >
                              <X className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        {/* Editable snippet */}
                        <textarea
                          rows={3}
                          value={getSnippet(article)}
                          onChange={(e) =>
                            setSnippetOverrides((prev) => ({
                              ...prev,
                              [article.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter snippet text..."
                          className="w-full px-2.5 py-2 text-xs bg-bg-base border border-surface-border rounded-md text-[--text-secondary] placeholder:text-[--text-muted] focus:outline-none focus:ring-1 focus:ring-brand-400 resize-y"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Preview panel ─────────────────────────────────────────── */}
          {totalSelected > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-[--text-muted] uppercase tracking-wider">
                Preview
              </h3>
              <div className="bg-bg-muted border border-surface-border rounded-xl p-5 space-y-5">
                <p className="text-xs text-[--text-muted] font-medium">
                  Subject: CalGrid Clips: {formatSubjectDate()}
                </p>
                <div className="border-t border-surface-border" />
                {sections
                  .filter((s) => s.articleIds.length > 0)
                  .map((s) => (
                    <div key={s.id} className="space-y-3">
                      {/* Section heading */}
                      <p className="text-sm font-bold italic text-[--text-primary]">
                        {s.heading}
                      </p>
                      {s.articleIds.map((id) => {
                        const a = articleMap.get(id);
                        if (!a) return null;
                        return (
                          <div key={id} className="space-y-0.5">
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-[#9B8EC4] hover:underline leading-snug block"
                            >
                              {a.title}
                            </a>
                            <p className="text-sm text-[--text-secondary] leading-relaxed">
                              <strong className="text-[--text-primary]">
                                {a.outlet}
                              </strong>{" "}
                              ({getAuthor(a)}){" "}
                              {formatClipDate(a.publishedAt)}:{" "}
                              {getSnippet(a)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface ComposerSection {
  id: string;
  heading: string;
  articleIds: string[];
}
