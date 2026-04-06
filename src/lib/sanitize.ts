const ENTITY_MAP: Record<string, string> = {
  "&amp;":  "&",
  "&lt;":   "<",
  "&gt;":   ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;":  "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(str: string): string {
  return str
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#039|#39);/gi, (m) => ENTITY_MAP[m.toLowerCase()] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

export function sanitizeText(input: string): string {
  if (!input) return "";
  return decodeEntities(input.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeAndTruncate(input: string, maxLength: number): string {
  const clean = sanitizeText(input);
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + "\u2026";
}
