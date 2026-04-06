import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchUrlMetadata } from "@/lib/url-metadata";

export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        imageUrl: null,
        status: { not: "DELETED" },
      },
      orderBy: { publishedAt: "desc" },
      take: 25,
    });

    const results: { id: string; status: string; imageUrl?: string }[] = [];

    for (const article of articles) {
      try {
        const meta = await fetchUrlMetadata(article.url);
        if (meta.image) {
          await prisma.article.update({
            where: { id: article.id },
            data: { imageUrl: meta.image },
          });
          results.push({ id: article.id, status: "updated", imageUrl: meta.image });
        } else {
          results.push({ id: article.id, status: "no_image" });
        }
      } catch {
        results.push({ id: article.id, status: "error" });
      }
    }

    return NextResponse.json({
      processed: results.length,
      updated: results.filter((r) => r.status === "updated").length,
      results,
    });
  } catch (err) {
    console.error("[POST /api/admin/articles/refresh-images]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
