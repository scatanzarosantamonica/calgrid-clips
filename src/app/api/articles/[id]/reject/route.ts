import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await writeAuditLog({
      articleId: id,
      action: "REJECTED",
      actorEmail: "admin",
      details: { previousStatus: article.status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[POST /api/articles/:id/reject]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
