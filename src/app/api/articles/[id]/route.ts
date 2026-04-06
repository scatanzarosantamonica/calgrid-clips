import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { sanitizeText } from "@/lib/sanitize";
import { parseJsonArray } from "@/lib/utils";

const patchSchema = z.object({
  title:         z.string().min(1).optional(),
  snippet:       z.string().nullable().optional(),
  manualSummary: z.string().nullable().optional(),
  priority:      z.boolean().optional(),
  tags:          z.array(z.string()).optional(),
  section:       z.enum(["transmission", "energy", "labor", "local"]).nullable().optional(),
  imageUrl:      z.string().url().nullable().optional(),
  status:        z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { auditLogs: { orderBy: { timestamp: "desc" }, take: 20 } },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...article,
      keywordsMatched: parseJsonArray(article.keywordsMatched),
      tags: parseJsonArray(article.tags),
    });
  } catch (err) {
    console.error("[GET /api/articles/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const update: Record<string, unknown> = {};

    if (data.title !== undefined) update.title = sanitizeText(data.title);
    if (data.snippet !== undefined) update.snippet = data.snippet ? sanitizeText(data.snippet) : null;
    if (data.manualSummary !== undefined) update.manualSummary = data.manualSummary;
    if (data.priority !== undefined) update.priority = data.priority;
    if (data.tags !== undefined) update.tags = JSON.stringify(data.tags);
    if (data.section !== undefined) update.section = data.section;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.status !== undefined) update.status = data.status;

    const article = await prisma.article.update({ where: { id }, data: update });

    await writeAuditLog({
      articleId: id,
      action: "EDITED",
      actorEmail: "admin",
      details: { fields: Object.keys(update) },
    });

    return NextResponse.json({
      ...article,
      keywordsMatched: parseJsonArray(article.keywordsMatched),
      tags: parseJsonArray(article.tags),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.errors }, { status: 400 });
    }
    console.error("[PATCH /api/articles/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.article.update({ where: { id }, data: { status: "DELETED" } });

    await writeAuditLog({
      articleId: id,
      action: "DELETED",
      actorEmail: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/articles/:id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
