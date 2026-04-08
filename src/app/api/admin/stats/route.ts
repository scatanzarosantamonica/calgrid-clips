import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      pendingReview,
      needsManual,
      approvedThisWeek,
      totalApproved,
      recentAudit,
    ] = await Promise.all([
      prisma.article.count({ where: { status: "QUEUED" } }),
      prisma.article.count({ where: { status: "NEEDS_MANUAL" } }),
      prisma.article.count({
        where: { status: "APPROVED", updatedAt: { gte: weekAgo } },
      }),
      prisma.article.count({ where: { status: "APPROVED" } }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 5,
        include: { article: { select: { title: true, outlet: true } } },
      }),
    ]);

    return NextResponse.json({
      pendingReview,
      needsManual,
      approvedThisWeek,
      totalApproved,
      recentAudit,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
