import "server-only";

const UPLIFT_API_BASE = "https://api.upliftai.co/api/public/v1";

export const BLOG_PAGE_SIZE = 12;

export type BlogStatus = "PUBLISH" | "DRAFT" | "ALL";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  status?: string | null;
  publishDate?: string | null;
  publishTime?: string | null;
  featuredImage?: string | null;
  categories?: string[] | null;
  tags?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  meta?: {
    seoTitle?: string | null;
    seoDescription?: string | null;
    keywords?: string[] | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogSiteName?: string | null;
    ogLocale?: string | null;
    articleTags?: string[] | null;
  } | null;
  customFields?: Record<string, unknown> | null;
};

type BlogListData = {
  blogs: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status?: number;
};

function getUpliftToken() {
  return process.env.UPLIFTAI_API_TOKEN || process.env.UPLIFT_API_TOKEN || "";
}

async function fetchUplift<T>(url: URL): Promise<ApiResult<T>> {
  const token = getUpliftToken();

  if (!token) {
    return {
      data: null,
      error: "UPLIFTAI_API_TOKEN is not configured.",
      status: 500
    };
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 900 }
    });

    const payload = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || payload.success === false) {
      return {
        data: null,
        error: payload.error || `Uplift API request failed with status ${response.status}.`,
        status: response.status
      };
    }

    return {
      data: payload.data || null,
      error: payload.data ? null : "Uplift API returned no data.",
      status: response.status
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unable to fetch Uplift blog data."
    };
  }
}

export async function getBlogs({
  page = 1,
  limit = BLOG_PAGE_SIZE,
  status = "PUBLISH"
}: {
  page?: number;
  limit?: number;
  status?: BlogStatus;
} = {}) {
  const url = new URL(`${UPLIFT_API_BASE}/blogs`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("status", status);

  return fetchUplift<BlogListData>(url);
}

export async function getBlog(slug: string) {
  const url = new URL(`${UPLIFT_API_BASE}/blog/${encodeURIComponent(slug)}`);
  const result = await fetchUplift<{ blog: BlogPost }>(url);

  return {
    ...result,
    data: result.data?.blog || null
  };
}

export function getSiteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function parseBlogDate(value?: string | null) {
  if (!value) return null;
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBlogDate(post: BlogPost) {
  const date = parseBlogDate(post.publishDate || post.createdAt || post.updatedAt);

  if (!date) return null;

  return new Intl.DateTimeFormat("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function getSortableDate(post: BlogPost) {
  return post.publishDate || post.createdAt || post.updatedAt || "";
}

export function getReadingTime(post: BlogPost) {
  const readingTime = post.customFields?.readingTime;
  if (typeof readingTime === "string") return readingTime;

  const plainText = (post.content || post.excerpt || "").replace(/<[^>]*>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  if (!wordCount) return null;

  return `${Math.max(1, Math.round(wordCount / 220))} min read`;
}
