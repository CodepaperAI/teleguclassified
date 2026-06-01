import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { FaArrowRight, FaCalendarAlt, FaTag, FaUser } from "react-icons/fa";
import {
    BLOG_PAGE_SIZE,
    formatBlogDate,
    getReadingTime,
    getUpliftBlogs,
    type UpliftBlog,
} from "@/lib/upliftai";
import styles from "./Blog.module.css";

export const revalidate = 900;

export const metadata: Metadata = {
    title: "Blog | Canada Telugu Classifieds",
    description: "Read community guides, local tips, listing advice, and practical updates for Telugu people living in Canada.",
};

type BlogPageProps = {
    searchParams?: Promise<{
        page?: string | string[];
    }>;
};

function getPageNumber(value?: string | string[]) {
    const pageValue = Array.isArray(value) ? value[0] : value;
    const parsed = Number.parseInt(pageValue || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getInitials(title: string) {
    return title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("");
}

function getSortableDate(blog: UpliftBlog) {
    return blog.publishDate || blog.createdAt || blog.updatedAt || "";
}

function getPublishedLabel(blog: UpliftBlog) {
    const date = formatBlogDate(blog);
    return date ? `Published ${date}` : "Publish date unavailable";
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const page = getPageNumber(resolvedSearchParams?.page);
    const result = await getUpliftBlogs({ page, limit: BLOG_PAGE_SIZE, status: "PUBLISH" });
    const blogs = [...(result.data?.blogs || [])].sort((a, b) =>
        getSortableDate(b).localeCompare(getSortableDate(a))
    );
    const pagination = result.data?.pagination;
    const totalPages = pagination?.totalPages || 1;
    const featured = blogs[0];
    const latestPosts = blogs.slice(1);
    const latestPublishDate = featured ? formatBlogDate(featured) : null;

    return (
        <main className={styles.page}>
            <section className={styles.heroBand}>
                <div className="container">
                    <section className={styles.hero}>
                        <div className={styles.heroCopy}>
                            <p className={styles.eyebrow}>Canada Telugu Classifieds Blog</p>
                            <h1 className={styles.title}>Practical guides for Telugu life and local deals in Canada</h1>
                            <p className={styles.subtitle}>
                                Community updates, marketplace advice, and neighborhood notes for buyers, sellers, renters, business owners, and families.
                            </p>
                            <div className={styles.heroActions}>
                                <Link href="/listings" className={styles.primaryAction}>
                                    Browse listings
                                </Link>
                                <Link href="/post-ad" className={styles.secondaryAction}>
                                    Post Free Ad
                                </Link>
                            </div>
                        </div>
                        <div className={styles.heroPanel}>
                            <span className={styles.panelLabel}>Publishing Feed</span>
                            <strong>{pagination?.total || blogs.length}</strong>
                            <p>published articles from Uplift AI</p>
                            {latestPublishDate && (
                                <small>Latest publish date: {latestPublishDate}</small>
                            )}
                        </div>
                    </section>
                </div>
            </section>

            <div className="container">
                {result.error ? (
                    <section className={styles.emptyState}>
                        <h2>Blog posts are unavailable</h2>
                        <p>The blog feed could not be loaded right now. Please check back soon.</p>
                    </section>
                ) : blogs.length === 0 ? (
                    <section className={styles.emptyState}>
                        <h2>No posts yet</h2>
                        <p>Published blog posts will appear here once they are available.</p>
                    </section>
                ) : (
                    <>
                        {featured && (
                            <section className={styles.featuredSection} aria-label="Featured blog post">
                                <article className={styles.featuredCard}>
                                    <Link href={`/blog/${featured.slug}`} className={styles.featuredImageLink} aria-label={featured.title}>
                                        {featured.featuredImage ? (
                                            <Image
                                                src={featured.featuredImage}
                                                alt=""
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 54vw"
                                                className={styles.featuredImage}
                                                priority
                                            />
                                        ) : (
                                            <div className={styles.featuredImageFallback}>{getInitials(featured.title)}</div>
                                        )}
                                    </Link>

                                    <div className={styles.featuredBody}>
                                        <div className={styles.featuredKicker}>
                                            <span>Featured Article</span>
                                            {featured.categories?.[0] && (
                                                <span className={styles.featuredCategory}>
                                                    <FaTag />
                                                    {featured.categories[0]}
                                                </span>
                                            )}
                                        </div>

                                        <h2 className={styles.featuredTitle}>
                                            <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                                        </h2>

                                        {featured.excerpt && <p className={styles.featuredExcerpt}>{featured.excerpt}</p>}

                                        <div className={styles.featuredMeta}>
                                            <span>
                                                <FaCalendarAlt />
                                                {getPublishedLabel(featured)}
                                            </span>
                                            {getReadingTime(featured) && <span>{getReadingTime(featured)}</span>}
                                            {featured.authorName && (
                                                <span>
                                                    <FaUser />
                                                    {featured.authorName}
                                                </span>
                                            )}
                                        </div>

                                        <Link href={`/blog/${featured.slug}`} className={styles.featuredLink}>
                                            Read featured article <FaArrowRight />
                                        </Link>
                                    </div>
                                </article>
                            </section>
                        )}

                        <section className={styles.latestSection} aria-label="Latest blog posts">
                            <div className={styles.sectionHeader}>
                                <div>
                                    <p className={styles.sectionEyebrow}>Latest Articles</p>
                                    <h2>Fresh guides and community updates</h2>
                                </div>
                                <span>{pagination?.total || blogs.length} total posts</span>
                            </div>

                            <div className={styles.grid}>
                                {(latestPosts.length > 0 ? latestPosts : blogs).map((blog) => {
                                    const date = formatBlogDate(blog);
                                    const readingTime = getReadingTime(blog);
                                    const primaryCategory = blog.categories?.[0];

                                    return (
                                        <article className={styles.card} key={blog.id}>
                                            <Link href={`/blog/${blog.slug}`} className={styles.imageLink} aria-label={blog.title}>
                                                {blog.featuredImage ? (
                                                    <Image
                                                        src={blog.featuredImage}
                                                        alt=""
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        className={styles.image}
                                                    />
                                                ) : (
                                                    <div className={styles.imageFallback}>{getInitials(blog.title)}</div>
                                                )}
                                            </Link>

                                            <div className={styles.cardBody}>
                                                {primaryCategory && (
                                                    <div className={styles.categoryRow}>
                                                        <span className={styles.category}>{primaryCategory}</span>
                                                    </div>
                                                )}

                                                <h2 className={styles.cardTitle}>
                                                    <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                                                </h2>

                                                {blog.excerpt && <p className={styles.excerpt}>{blog.excerpt}</p>}

                                                <div className={styles.meta}>
                                                    <span>
                                                        <FaCalendarAlt />
                                                        {date ? `Published ${date}` : "Publish date unavailable"}
                                                    </span>
                                                    {date && readingTime && <span className={styles.dot} aria-hidden="true" />}
                                                    {readingTime && <span>{readingTime}</span>}
                                                    {blog.authorName && (date || readingTime) && <span className={styles.dot} aria-hidden="true" />}
                                                    {blog.authorName && (
                                                        <span>
                                                            <FaUser />
                                                            {blog.authorName}
                                                        </span>
                                                    )}
                                                </div>

                                                <Link href={`/blog/${blog.slug}`} className={styles.readLink}>
                                                    Read article <FaArrowRight />
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        {totalPages > 1 && (
                            <nav className={styles.pagination} aria-label="Blog pagination">
                                {page > 1 ? (
                                    <Link href={`/blog?page=${page - 1}`} className={styles.pageButton}>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className={styles.pageButtonDisabled}>Previous</span>
                                )}

                                <span className={styles.pageCount}>
                                    Page {page} of {totalPages}
                                </span>

                                {page < totalPages ? (
                                    <Link href={`/blog?page=${page + 1}`} className={styles.pageButton}>
                                        Next
                                    </Link>
                                ) : (
                                    <span className={styles.pageButtonDisabled}>Next</span>
                                )}
                            </nav>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
