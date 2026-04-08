import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 50)));
    const action = sp.get("action") ?? undefined;
    const articleId = sp.get("articleId") ?? undefined;

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (articleId) where.articleId = articleId;

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { article: { select: { title: true, outlet: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      items: rows,
      logs: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("[GET /api/audit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
