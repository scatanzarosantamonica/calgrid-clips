import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sanitizeText } from "@/lib/sanitize";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { parseJsonArray } from "@/lib/utils";

/* ────────────────────────────── GET ────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") ?? "QUEUED";

    const where: Record<string, unknown> =
      status === "all" ? {} : { status };

    const rows = await prisma.article.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    const articles = rows.map((r) => ({
      ...r,
      keywordsMatched: parseJsonArray(r.keywordsMatched),
      tags: parseJsonArray(r.tags),
    }));

    return NextResponse.json(articles);
  } catch (err) {
    console.error("[GET /api/queue]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ────────────────────────────── POST ───────────────────────────── */

const queueSchema = z.object({
  url:           z.string().url(),
  title:         z.string().optional(),
  outlet:        z.string().optional(),
  outletDomain:  z.string().optional(),
  section:       z.enum(["transmission", "energy", "labor", "local"]).nullable().optional(),
  tags:          z.array(z.string()).optional(),
  priority:      z.boolean().optional(),
  publishedAt:   z.string().optional(),
  imageUrl:      z.string().url().or(z.literal("")).optional(),
  snippet:       z.string().optional(),
  manualSummary: z.string().optional(),
  status:        z.enum(["QUEUED", "APPROVED", "NEEDS_MANUAL"]).optional(),
});

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    // strip common tracking params
    for (const p of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      u.searchParams.delete(p);
    }
    return u.toString();
  } catch {
    return raw.trim();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = queueSchema.parse(body);

    const url = normalizeUrl(data.url);

    /* duplicate check — treat soft-deleted records as absent so the URL can be re-added */
    const existing = await prisma.article.findUnique({ where: { url } });
    if (existing && existing.status !== "DELETED") {
      return NextResponse.json(
        { error: "Article with this URL already exists", articleId: existing.id },
        { status: 409 }
      );
    }
    if (existing && existing.status === "DELETED") {
      await prisma.article.delete({ where: { id: existing.id } });
    }

    /* fetch metadata from URL only if caller didn't supply key fields */
    const needsMetadata = !data.title || !data.outlet || !data.snippet || !data.imageUrl;
    const meta = needsMetadata ? await fetchUrlMetadata(url) : { title: "", source: "", description: "", image: "", author: "" };

    const title = sanitizeText(data.title || meta.title || url);
    const outlet = sanitizeText(data.outlet || meta.source || new URL(url).hostname.replace(/^www\./, ""));
    const outletDomain = data.outletDomain || new URL(url).hostname.replace(/^www\./, "");
    const snippetText = data.snippet ?? meta.description ?? null;
    const imageUrl = data.imageUrl || meta.image || null;

    let publishedAt: Date;
    if (data.publishedAt) {
      const parsed = new Date(data.publishedAt);
      publishedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      publishedAt = new Date();
    }

    const article = await prisma.article.create({
      data: {
        url,
        title,
        outlet,
        outletDomain,
        snippet: snippetText ? sanitizeText(snippetText) : null,
        manualSummary: data.manualSummary || null,
        imageUrl,
        author: meta.author ? sanitizeText(meta.author) : null,
        section: data.section ?? null,
        tags: JSON.stringify(data.tags ?? []),
        priority: data.priority ?? false,
        status: data.status ?? "QUEUED",
        ingestSource: "MANUAL",
        publishedAt,
        keywordsMatched: "[]",
      },
    });

    await writeAuditLog({
      articleId: article.id,
      action: "QUEUED",
      actorEmail: "admin",
      details: { url, title, ingestSource: "MANUAL" },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.errors }, { status: 400 });
    }
    console.error("[POST /api/queue]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
