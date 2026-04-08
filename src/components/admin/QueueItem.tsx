"use client";

import React, { useState } from "react";
import {
  CheckCircle, XCircle, PenSquare, ExternalLink, Clock,
  AlertCircle, Star, Link2, Trash2, Check,
} from "lucide-react";
import { OutletIcon } from "@/components/shared/OutletIcon";
import { KeywordChipList } from "@/components/shared/KeywordChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditArticleModal } from "./EditArticleModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/lib/use-toast";
import { formatRelativeTime, parseJsonArray } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Article } from "@/types";

/* ---------- status helpers ---------- */

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  QUEUED:       { label: "Pending",      icon: Clock,       cls: "text-amber-600 bg-amber-50 border-amber-200" },
  NEEDS_MANUAL: { label: "Needs Manual", icon: AlertCircle, cls: "text-orange-600 bg-orange-50 border-orange-200" },
  APPROVED:     { label: "Approved",     icon: CheckCircle, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  REJECTED:     { label: "Rejected",     icon: XCircle,     cls: "text-red-600 bg-red-50 border-red-200" },
};

/* ---------- component ---------- */

interface QueueItemProps {
  article:   Article;
  onAction:  (id: string, action: "APPROVED" | "REJECTED" | "NEEDS_MANUAL") => void;
  onUpdated: (article: Article) => void;
  onDelete:  (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function QueueItem({ article, onAction, onUpdated, onDelete, selected, onToggleSelect }: QueueItemProps) {
  const [busy, setBusy]               = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);

  const keywords = parseJsonArray(article.keywordsMatched as unknown as string);
  const status   = STATUS_MAP[article.status] ?? STATUS_MAP.pending;
  const StatusIcon = status.icon;

  /* --- actions --- */

  async function handleApprove() {
    setBusy(true);
    try {
      await onAction(article.id, "APPROVED");
      toast({ title: "Article approved" });
    } catch (err) {
      toast({ title: "Failed to approve", description: String(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await onAction(article.id, "REJECTED");
      toast({ title: "Article rejected" });
    } catch (err) {
      toast({ title: "Failed to reject", description: String(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(article.id);
      toast({ title: "Article deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", description: String(err), variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={cn(
        "nyt-card group",
        article.priority && "ring-1 ring-amber-300 bg-amber-50/30",
        selected && "ring-2 ring-brand-400/50 bg-brand-50/20",
      )}>
        {/* top row: checkbox + status + outlet + time */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {onToggleSelect && (
            <button
              type="button"
              onClick={() => onToggleSelect(article.id)}
              className={cn(
                "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors mr-0.5",
                selected
                  ? "bg-brand-500 border-brand-500"
                  : "border-ink-meta hover:border-ink-lead",
              )}
            >
              {selected && <Check className="h-2.5 w-2.5 text-white" />}
            </button>
          )}
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-sm",
            status.cls,
          )}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>

          <OutletIcon outlet={article.outlet} size={16} className="ml-1" />

          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-meta font-sans">
            {article.outlet}
          </span>

          {article.priority && (
            <>
              <span className="text-ink-muted text-[10px]">·</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                <Star className="h-2.5 w-2.5 fill-amber-600" />
                Priority
              </span>
            </>
          )}

          <span className="ml-auto text-[10px] text-ink-muted font-sans tabular-nums">
            {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        {/* title */}
        <h3 className="font-serif font-bold text-ink leading-snug mb-1 text-base sm:text-lg">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2 inline-flex items-center gap-1.5"
          >
            {article.title}
            <ExternalLink className="h-3 w-3 text-ink-meta shrink-0" />
          </a>
        </h3>

        {/* snippet */}
        {article.snippet && (
          <p className="text-sm text-ink-lead leading-relaxed line-clamp-2 mb-2">
            {article.snippet}
          </p>
        )}

        {/* keywords */}
        {keywords.length > 0 && (
          <div className="mb-3">
            <KeywordChipList keywords={keywords} maxVisible={4} />
          </div>
        )}

        {/* url */}
        <div className="flex items-center gap-1 text-[10px] text-ink-muted font-sans mb-3 truncate">
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{article.url}</span>
        </div>

        {/* action buttons */}
        <div className="flex items-center gap-2 flex-wrap border-t border-paper-rule pt-3">
          {(article.status === "QUEUED" || article.status === "NEEDS_MANUAL") && (
            <>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={busy}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] uppercase tracking-widest font-sans"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={busy}
                className="gap-1.5 text-[11px] uppercase tracking-widest font-sans border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
            disabled={busy}
            className="gap-1.5 text-[11px] uppercase tracking-widest font-sans"
          >
            <PenSquare className="h-3.5 w-3.5" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            disabled={busy}
            className="gap-1.5 text-[11px] uppercase tracking-widest font-sans text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* edit modal */}
      <EditArticleModal
        article={editOpen ? article : null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => { setEditOpen(false); }}
      />

      {/* delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete article?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the article and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setDeleteOpen(false); handleDelete(); }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
