"use client";

import React, { useState } from "react";
import { PlusCircle, X, ExternalLink, AlertCircle, ImageIcon, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface FormState {
  title:         string;
  outlet:        string;
  outletDomain:  string;
  url:           string;
  imageUrl:      string;
  publishedAt:   string;
  snippet:       string;
  manualSummary: string;
  tags:          string[];
  priority:      boolean;
  status:        "QUEUED" | "APPROVED" | "NEEDS_MANUAL";
}

const DEFAULT_FORM: FormState = {
  title:         "",
  outlet:        "",
  outletDomain:  "",
  url:           "",
  imageUrl:      "",
  publishedAt:   toLocalDatetimeString(new Date()),
  snippet:       "",
  manualSummary: "",
  tags:          [],
  priority:      false,
  status:        "QUEUED",
};

// Known outlet domain → name mappings
const OUTLET_MAP: Record<string, string> = {
  "latimes.com": "Los Angeles Times",
  "sfchronicle.com": "San Francisco Chronicle",
  "sacbee.com": "Sacramento Bee",
  "sandiegouniontribune.com": "San Diego Union-Tribune",
  "mercurynews.com": "Mercury News",
  "pe.com": "Press-Enterprise",
  "desertsun.com": "Desert Sun",
  "calmatters.org": "CalMatters",
  "politico.com": "Politico",
  "eenews.net": "E&E News",
  "utilitydive.com": "Utility Dive",
  "greentechmedia.com": "Greentech Media",
  "spglobal.com": "S&P Global",
  "reuters.com": "Reuters",
  "apnews.com": "Associated Press",
  "bloomberg.com": "Bloomberg",
  "nytimes.com": "New York Times",
  "washingtonpost.com": "Washington Post",
};

export default function ManualEntryPage() {
  const [form,     setForm]     = useState<FormState>(DEFAULT_FORM);
  const [tagInput, setTagInput] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-extract domain and outlet name from URL
  function handleUrlBlur() {
    const url = form.url.trim();
    if (!url) return;
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      if (!form.outletDomain) update("outletDomain", domain);
      if (!form.outlet) {
        const match = OUTLET_MAP[domain];
        if (match) update("outlet", match);
      }
    } catch { /* not a valid URL yet */ }
  }

  function handleUrlChange(url: string) {
    update("url", url);
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      if (!form.outletDomain) update("outletDomain", domain);
      // Also try to auto-fill outlet name
      if (!form.outlet) {
        const match = OUTLET_MAP[domain];
        if (match) update("outlet", match);
      }
    } catch { /* not a valid URL yet */ }
  }

  // Auto-populate from URL metadata
  async function handleAutoPopulate() {
    const url = form.url.trim();
    if (!url) return;
    setFetching(true);
    try {
      const res = await fetch("/api/admin/articles/fetch-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.status === 409) {
        const data = await res.json();
        toast({ variant: "warning", title: "URL already exists", description: data.error });
        return;
      }
      if (!res.ok) {
        toast({ variant: "error", title: "Could not fetch metadata" });
        return;
      }
      const article = await res.json();
      // Pre-fill form from fetched article
      setForm((f) => ({
        ...f,
        title: article.title || f.title,
        outlet: article.outlet || f.outlet,
        outletDomain: article.outletDomain || f.outletDomain,
        snippet: article.snippet || f.snippet,
        imageUrl: article.imageUrl || f.imageUrl,
      }));
      toast({ variant: "success", title: "Metadata fetched", description: "Form populated from URL." });
    } catch {
      toast({ variant: "error", title: "Network error" });
    } finally {
      setFetching(false);
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      update("tags", [...form.tags, t]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    update("tags", form.tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault();
    if (asDraft) {
      setSavingDraft(true);
    } else {
      setSaving(true);
    }
    try {
      const submitData = {
        ...form,
        imageUrl: form.imageUrl.trim() || undefined,
        publishedAt: form.publishedAt + ":00Z",
        status: asDraft ? "NEEDS_MANUAL" : form.status,
      };

      const res = await fetch("/api/queue", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(submitData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Submission failed");
      }

      const created = await res.json();
      setLastSaved(created.title);
      setForm(DEFAULT_FORM);
      setTagInput("");
      toast({
        variant: "success",
        title: asDraft ? "Draft saved" : "Article added",
        description: `"${created.title.slice(0, 60)}" ${asDraft ? "saved as draft" : "added to queue"}`,
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
      setSavingDraft(false);
    }
  }

  const isBusy = saving || savingDraft || fetching;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Toaster />
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[--text-primary]">
          Manual Article Entry
        </h1>
        <p className="text-sm text-[--text-secondary] mt-0.5">
          Add articles manually — required for paywalled sources.
        </p>
      </div>

      {/* Compliance notice */}
      <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800/50 rounded-xl p-4 text-amber-300 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Compliance reminder:</strong> Do not copy and paste copyrighted article text.
          Write an original summary in your own words. Always include the canonical source URL.
        </div>
      </div>

      {lastSaved && (
        <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-xl px-4 py-3 text-emerald-300 text-sm">
          Saved: &ldquo;{lastSaved}&rdquo;
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 bg-surface rounded-xl border border-surface-border p-6">
        {/* URL — first because it auto-fills domain */}
        <Field label="Article URL *">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="url"
                value={form.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com/article"
                required
                leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoPopulate}
              disabled={!form.url.trim() || isBusy}
              className="shrink-0 gap-1.5 h-10"
            >
              {fetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              {fetching ? "Fetching..." : "Auto-fill"}
            </Button>
          </div>
          <p className="text-xs text-[--text-muted] mt-1">
            Paste a URL and click &ldquo;Auto-fill&rdquo; to populate fields from the article&apos;s metadata.
          </p>
        </Field>

        {/* Title */}
        <Field label="Title *">
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Article headline"
            required
            maxLength={500}
          />
        </Field>

        {/* Outlet */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Outlet Name *">
            <Input
              value={form.outlet}
              onChange={(e) => update("outlet", e.target.value)}
              placeholder="e.g. Los Angeles Times"
              required
            />
          </Field>
          <Field label="Outlet Domain *">
            <Input
              value={form.outletDomain}
              onChange={(e) => update("outletDomain", e.target.value)}
              placeholder="latimes.com"
              required
            />
          </Field>
        </div>

        {/* Published date */}
        <Field label="Published Date/Time *">
          <Input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) => update("publishedAt", e.target.value)}
            required
          />
        </Field>

        {/* Image URL */}
        <Field label="Image URL (optional — auto-fetched from article if left blank)">
          <Input
            type="url"
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="https://example.com/image.jpg"
            leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
          />
        </Field>

        {/* Snippet */}
        <Field label="Snippet (from public summary or metadata)">
          <Textarea
            value={form.snippet}
            onChange={(e) => update("snippet", e.target.value)}
            placeholder="Short excerpt from a freely available summary — plain text only"
            rows={3}
            maxLength={600}
          />
        </Field>

        {/* Manual summary */}
        <Field label="Manual Summary (your own words — required for paywalled articles)">
          <Textarea
            value={form.manualSummary}
            onChange={(e) => update("manualSummary", e.target.value)}
            placeholder="Write 2–3 paragraphs summarizing the article in your own words. Do not reproduce copyrighted text verbatim."
            rows={8}
          />
          <p className="text-xs text-[--text-muted] mt-1">
            Plain text only. Do not reproduce copyrighted content verbatim.
          </p>
        </Field>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag and press Enter"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              maxLength={50}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="muted" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Field>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Initial Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as FormState["status"])}
              className="w-full h-9 rounded-lg border border-surface-border bg-surface-raised px-3 text-sm text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="QUEUED">Queued (needs review)</option>
              <option value="APPROVED">Approved (publish immediately)</option>
              <option value="NEEDS_MANUAL">Needs Manual Summary</option>
            </select>
          </Field>

          <Field label="Priority">
            <div className="flex items-center gap-3 h-9">
              <button
                type="button"
                role="switch"
                aria-checked={form.priority}
                onClick={() => update("priority", !form.priority)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${
                  form.priority ? "bg-purple-600 border-purple-500" : "bg-surface-overlay border-surface-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.priority ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-[--text-secondary]">Priority article</span>
            </div>
          </Field>
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isBusy} className="flex-1">
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Add Article"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            disabled={isBusy || !form.url.trim() || !form.title.trim()}
            className="gap-1.5"
          >
            {savingDraft ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setForm(DEFAULT_FORM)}
            disabled={isBusy}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[--text-secondary]">{label}</label>
      {children}
    </div>
  );
}

/** Format a Date as a local YYYY-MM-DDTHH:mm string for datetime-local inputs. */
function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
