import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText, sanitizeAndTruncate } from "@/lib/sanitize";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { writeAuditLog } from "@/lib/audit";
import { parseJsonArray } from "@/lib/utils";

const bodySchema = z.object({
  url:      z.string().url(),
  section:  z.enum(["transmission", "energy", "labor", "local"]).nullable().optional(),
  tags:     z.array(z.string()).optional(),
  priority: z.boolean().optional(),
});

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const p of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      u.searchParams.delete(p);
    }
    return u.toString();
  } catch {
    return raw.trim();
  }
}

export async function POST(req: NextRequest) {
  /* rate limit */
  const rl = rateLimit("fetch-from-url", 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);

    const url = normalizeUrl(data.url);

    /* duplicate check — soft-deleted records should not block re-adding the URL */
    const existing = await prisma.article.findUnique({ where: { url } });
    if (existing && existing.status !== "DELETED") {
      return NextResponse.json({
        duplicate: true,
        article: {
          ...existing,
          keywordsMatched: parseJsonArray(existing.keywordsMatched),
          tags: parseJsonArray(existing.tags),
        },
      });
    }
    if (existing && existing.status === "DELETED") {
      await prisma.article.delete({ where: { id: existing.id } });
    }

    /* fetch metadata */
    const meta = await fetchUrlMetadata(url);

    const title = sanitizeText(meta.title || url);
    const snippet = meta.description ? sanitizeAndTruncate(meta.description, 500) : null;
    const outlet = sanitizeText(meta.source || new URL(url).hostname.replace(/^www\./, ""));
    const outletDomain = new URL(url).hostname.replace(/^www\./, "");

    const article = await prisma.article.create({
      data: {
        url,
        title,
        outlet,
        outletDomain,
        snippet,
        imageUrl: meta.image || null,
        author: meta.author ? sanitizeText(meta.author) : null,
        section: data.section ?? null,
        tags: JSON.stringify(data.tags ?? []),
        priority: data.priority ?? false,
        status: "QUEUED",
        ingestSource: "URL",
        publishedAt: new Date(),
        keywordsMatched: "[]",
      },
    });

    await writeAuditLog({
      articleId: article.id,
      action: "URL_INGESTED",
      actorEmail: "admin",
      details: { url, title, outlet },
    });

    return NextResponse.json(
      {
        ...article,
        keywordsMatched: parseJsonArray(article.keywordsMatched),
        tags: parseJsonArray(article.tags),
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.errors }, { status: 400 });
    }
    console.error("[POST /api/admin/articles/fetch-from-url]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
