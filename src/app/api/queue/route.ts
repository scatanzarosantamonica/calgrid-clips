import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sanitizeText } from "@/lib/sanitize";
import { fetchUrlMetadata } from "@/lib/url-metadata";
import { parseJsonArray } from "@/lib/utils";

const queueSchema = z.object({
  url:       z.string().url(),
  title:     z.string().optional(),
  outlet:    z.string().optional(),
  section:   z.enum(["transmission", "energy", "labor", "local"]).nullable().optional(),
  tags:      z.array(z.string()).optional(),
  priority:  z.boolean().optional(),
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

    /* duplicate check */
    const existing = await prisma.article.findUnique({ where: { url } });
    if (existing) {
      return NextResponse.json(
        { error: "Article with this URL already exists", articleId: existing.id },
        { status: 409 }
      );
    }

    /* fetch metadata from URL */
    const meta = await fetchUrlMetadata(url);

    const title = sanitizeText(data.title || meta.title || url);
    const outlet = sanitizeText(data.outlet || meta.source || new URL(url).hostname.replace(/^www\./, ""));
    const outletDomain = new URL(url).hostname.replace(/^www\./, "");

    const article = await prisma.article.create({
      data: {
        url,
        title,
        outlet,
        outletDomain,
        snippet: meta.description ? sanitizeText(meta.description) : null,
        imageUrl: meta.image || null,
        author: meta.author ? sanitizeText(meta.author) : null,
        section: data.section ?? null,
        tags: JSON.stringify(data.tags ?? []),
        priority: data.priority ?? false,
        status: "QUEUED",
        ingestSource: "MANUAL",
        publishedAt: new Date(),
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
