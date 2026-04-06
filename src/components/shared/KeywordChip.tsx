"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

/* ---------- single chip ---------- */

interface KeywordChipProps {
  keyword:    string;
  className?: string;
}

export function KeywordChip({ keyword, className }: KeywordChipProps) {
  return (
    <span
      className={cn(
        "inline-block text-[10px] font-sans font-medium uppercase tracking-wider",
        "text-ink-meta bg-paper-warm border border-paper-rule px-1.5 py-0.5",
        className,
      )}
    >
      {keyword}
    </span>
  );
}

/* ---------- chip list with overflow ---------- */

interface KeywordChipListProps {
  keywords:    string[];
  maxVisible?: number;
  className?:  string;
}

export function KeywordChipList({
  keywords,
  maxVisible = 3,
  className,
}: KeywordChipListProps) {
  const [expanded, setExpanded] = useState(false);

  if (keywords.length === 0) return null;

  const visible = expanded ? keywords : keywords.slice(0, maxVisible);
  const overflow = keywords.length - maxVisible;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {visible.map((kw) => (
        <KeywordChip key={kw} keyword={kw} />
      ))}
      {!expanded && overflow > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] font-sans text-ink-meta hover:text-ink transition-colors underline underline-offset-2"
        >
          +{overflow} more
        </button>
      )}
    </div>
  );
}
