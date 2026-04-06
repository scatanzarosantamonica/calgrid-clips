import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseJsonArray } from "@/lib/utils";

const querySchema = z.object({
  search:     z.string().optional(),
  outlet:     z.string().optional(),
  from:       z.string().optional(),
  to:         z.string().optional(),
  priority:   z.enum(["true", "false"]).optional(),
  tag:        z.string().optional(),
  quickRange: z.enum(["today", "yesterday", "week"]).optional(),
  section:    z.enum(["transmission", "energy", "labor", "local"]).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(100).default(30),
});

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const obj = Object.fromEntries(req.nextUrl.searchParams.entries());
    const q = querySchema.parse(obj);

    const where: Record<string, unknown> = { status: { not: "DELETED" } };

    /* ---- filters ---- */
    if (q.outlet) where.outletDomain = q.outlet;
    if (q.priority) where.priority = q.priority === "true";
    if (q.section) where.section = q.section;

    /* date range */
    if (q.quickRange) {
      const now = new Date();
      if (q.quickRange === "today") {
        where.publishedAt = { gte: startOfDay(now), lte: endOfDay(now) };
      } else if (q.quickRange === "yesterday") {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        where.publishedAt = { gte: startOfDay(y), lte: endOfDay(y) };
      } else if (q.quickRange === "week") {
        const w = new Date(now);
        w.setDate(w.getDate() - 7);
        where.publishedAt = { gte: startOfDay(w), lte: endOfDay(now) };
      }
    } else if (q.from || q.to) {
      const range: Record<string, Date> = {};
      if (q.from) range.gte = startOfDay(new Date(q.from));
      if (q.to) range.lte = endOfDay(new Date(q.to));
      where.publishedAt = range;
    }

    /* full-text search */
    if (q.search) {
      where.OR = [
        { title: { contains: q.search } },
        { snippet: { contains: q.search } },
        { outlet: { contains: q.search } },
      ];
    }

    /* tag filter */
    if (q.tag) {
      where.tags = { contains: q.tag };
    }

    const skip = (q.page - 1) * q.pageSize;

    const [rows, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        skip,
        take: q.pageSize,
      }),
      prisma.article.count({ where }),
    ]);

    const articles = rows.map((r) => ({
      ...r,
      keywordsMatched: parseJsonArray(r.keywordsMatched),
      tags: parseJsonArray(r.tags),
    }));

    return NextResponse.json({
      articles,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query", details: err.errors }, { status: 400 });
    }
    console.error("[GET /api/articles]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
