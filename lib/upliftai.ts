const UPLIFTAI_API_BASE = "https://api.upliftai.co/api/public/v1";

export const BLOG_PAGE_SIZE = 9;

export type UpliftBlogStatus = "PUBLISH" | "DRAFT" | "ALL";

export interface UpliftPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface UpliftBlogMeta {
    seoTitle?: string | null;
    seoDescription?: string | null;
    focusKeyword?: string | null;
    keywords?: string[] | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogType?: string | null;
    ogUrl?: string | null;
    ogSiteName?: string | null;
    ogLocale?: string | null;
    articleAuthor?: string | null;
    articleSection?: string | null;
    articleTags?: string[] | null;
}

export interface UpliftBlogFreshness {
    lastUpdatedAt?: string | null;
    ageDays?: number | null;
    needsRefresh?: boolean | null;
    freshnessThresholdDays?: number | null;
}

export interface UpliftBlog {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    status?: UpliftBlogStatus | string;
    publishDate?: string | null;
    publishTime?: string | null;
    featuredImage?: string | null;
    categories?: string[] | null;
    tags?: string[] | null;
    seoScore?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    authorName?: string | null;
    authorUrl?: string | null;
    freshness?: UpliftBlogFreshness | null;
    meta?: UpliftBlogMeta | null;
    customFields?: Record<string, unknown> | null;
    analytics?: Record<string, unknown> | null;
}

interface UpliftApiEnvelope<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UpliftApiResult<T> {
    data: T | null;
    error: string | null;
    status?: number;
}

export interface UpliftBlogListData {
    blogs: UpliftBlog[];
    pagination: UpliftPagination;
}

export interface UpliftBlogDetailData {
    blog: UpliftBlog;
}

function getUpliftToken() {
    return (
        process.env.UPLIFTAI_API_TOKEN ||
        process.env.UPLIFT_API_TOKEN ||
        process.env.NEXT_PUBLIC_UPLIFT_API_TOKEN ||
        ""
    );
}

async function fetchUplift<T>(url: URL): Promise<UpliftApiResult<T>> {
    const token = getUpliftToken();

    if (!token) {
        return {
            data: null,
            error: "UPLIFTAI_API_TOKEN is not configured.",
            status: 500,
        };
    }

    try {
        const response = await fetch(url.toString(), {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            next: { revalidate: 900 },
        });

        const payload = (await response.json()) as UpliftApiEnvelope<T>;

        if (!response.ok || payload.success === false) {
            return {
                data: null,
                error: payload.error || `Uplift API request failed with status ${response.status}.`,
                status: response.status,
            };
        }

        if (!payload.data) {
            return {
                data: null,
                error: "Uplift API returned no data.",
                status: response.status,
            };
        }

        return {
            data: payload.data,
            error: null,
            status: response.status,
        };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : "Unable to fetch Uplift blog data.",
        };
    }
}

export async function getUpliftBlogs({
    page = 1,
    limit = BLOG_PAGE_SIZE,
    status = "PUBLISH",
}: {
    page?: number;
    limit?: number;
    status?: UpliftBlogStatus;
} = {}) {
    const url = new URL(`${UPLIFTAI_API_BASE}/blogs`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("status", status);

    return fetchUplift<UpliftBlogListData>(url);
}

export async function getUpliftBlog(slug: string) {
    const url = new URL(`${UPLIFTAI_API_BASE}/blog/${encodeURIComponent(slug)}`);
    return fetchUplift<UpliftBlogDetailData>(url);
}

function parseBlogDate(value?: string | null) {
    if (!value) return null;

    const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBlogDate(blog: UpliftBlog) {
    const date = parseBlogDate(blog.publishDate || blog.createdAt || blog.updatedAt);

    if (!date) return null;

    return new Intl.DateTimeFormat("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

export function getBlogLastModified(blog: UpliftBlog) {
    const date =
        parseBlogDate(blog.freshness?.lastUpdatedAt) ||
        parseBlogDate(blog.updatedAt) ||
        parseBlogDate(blog.publishDate) ||
        parseBlogDate(blog.createdAt);

    return (date || new Date()).toISOString().split("T")[0];
}

export function getReadingTime(blog: UpliftBlog) {
    const readingTime = blog.customFields?.readingTime;
    return typeof readingTime === "string" ? readingTime : null;
}
