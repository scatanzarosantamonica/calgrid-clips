"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getFaviconUrl, stringToColor, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ---------- helpers ---------- */

function domainFromOutlet(outlet: string): string {
  if (outlet.startsWith("http")) {
    try { return new URL(outlet).hostname.replace(/^www\./, ""); } catch { /* fall through */ }
  }
  return outlet
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.]/g, "")
    + ".com";
}

/* ---------- component ---------- */

interface OutletIconProps {
  outlet:     string;
  size?:      number;
  className?: string;
}

export function OutletIcon({ outlet, size = 20, className }: OutletIconProps) {
  const [failed, setFailed] = useState(false);

  const domain   = domainFromOutlet(outlet);
  const favicon  = getFaviconUrl(domain);
  const initials = getInitials(outlet);
  const bg       = stringToColor(outlet);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-sm font-sans font-bold text-white select-none",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.45, backgroundColor: bg }}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={favicon}
      alt=""
      width={size}
      height={size}
      className={cn("rounded-sm object-contain", className)}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
