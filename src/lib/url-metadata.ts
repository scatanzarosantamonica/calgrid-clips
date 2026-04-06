import { logger } from "./logger";

export interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  source: string;
  author: string;
}

const TIMEOUT_MS = 10000;
const USER_AGENT =
  "CalGridClipsBot/1.0 (+https://calgrid.news; news aggregation)";

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  const metadata: UrlMetadata = {
    title: "",
    description: "",
    image: "",
    source: "",
    author: "",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn({ url, status: response.status }, "Failed to fetch URL");
      return metadata;
    }

    const html = await response.text();

    // Extract Open Graph and meta tags
    metadata.title = extractMeta(html, "og:title") || extractTitle(html) || "";
    metadata.description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      "";
    metadata.image = extractMeta(html, "og:image") || "";
    metadata.source =
      extractMeta(html, "og:site_name") || extractDomainName(url);
    metadata.author =
      extractMeta(html, "author") ||
      extractMeta(html, "article:author") ||
      "";

    // Resolve relative image URLs
    if (metadata.image && !metadata.image.startsWith("http")) {
      try {
        metadata.image = new URL(metadata.image, url).toString();
      } catch {
        metadata.image = "";
      }
    }
  } catch (error) {
    logger.error({ error, url }, "Error fetching URL metadata");
  }

  return metadata;
}

function extractMeta(html: string, property: string): string {
  // Try property attribute (Open Graph)
  const ogMatch = html.match(
    new RegExp(
      `<meta[^>]*property=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
      "i"
    )
  );
  if (ogMatch) return ogMatch[1];

  // Try content before property
  const ogMatch2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${escapeRegex(property)}["']`,
      "i"
    )
  );
  if (ogMatch2) return ogMatch2[1];

  // Try name attribute
  const nameMatch = html.match(
    new RegExp(
      `<meta[^>]*name=["']${escapeRegex(property)}["'][^>]*content=["']([^"']*)["']`,
      "i"
    )
  );
  if (nameMatch) return nameMatch[1];

  // Try content before name
  const nameMatch2 = html.match(
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${escapeRegex(property)}["']`,
      "i"
    )
  );
  if (nameMatch2) return nameMatch2[1];

  return "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : "";
}

function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // Capitalize first letter of each part
    return hostname
      .split(".")
      .slice(0, -1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
