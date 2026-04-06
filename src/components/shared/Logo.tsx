"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* ---------- component ---------- */

interface LogoProps {
  size?:      "sm" | "md" | "lg";
  showText?:  boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 28, text: "text-sm"  },
  md: { px: 48, text: "text-lg"  },
  lg: { px: 72, text: "text-2xl" },
} as const;

export function Logo({ size = "md", showText = false, className }: LogoProps) {
  const { px, text } = SIZE_MAP[size];

  return (
    <span className={cn("inline-flex items-center gap-2 shrink-0", className)}>
      <Image
        src="/logo.png"
        alt="CalGrid Logo"
        width={px}
        height={px}
        className="object-contain"
        unoptimized
      />
      {showText && (
        <span className={cn("font-serif font-black text-ink tracking-tight leading-none select-none", text)}>
          CALGRID
        </span>
      )}
    </span>
  );
}
