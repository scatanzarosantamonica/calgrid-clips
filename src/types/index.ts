export type ArticleSection = "transmission" | "energy" | "labor" | "local";

export type ArticleStatus = "pending" | "approved" | "rejected";

export interface Article {
  id: string;
  url: string;
  title: string;
  description: string | null;
  source: string | null;
  outlet: string;
  author: string | null;
  imageUrl: string | null;
  section: ArticleSection;
  keywords: string[];
  keywordsMatched: string[];
  tags: string[];
  snippet: string | null;
  manualSummary: string | null;
  priority: boolean;
  status: ArticleStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  approvedBy: string | null;
  rejectedBy: string | null;
}

export interface DashboardFilters {
  outlet?:     string;
  from?:       string;
  to?:         string;
  priority?:   boolean;
  tag?:        string;
  quickRange?: "today" | "yesterday" | "week";
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  details: string | null;
  createdAt: string;
}

export interface ArticleFormData {
  url: string;
  title: string;
  description?: string;
  source?: string;
  author?: string;
  imageUrl?: string;
  section: ArticleSection;
  keywords?: string[];
  status?: ArticleStatus;
}

export interface UrlMetadata {
  title: string;
  description: string;
  image: string;
  source: string;
  author: string;
}
