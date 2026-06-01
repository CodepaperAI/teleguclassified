import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
    formatBlogDate,
    getReadingTime,
    getUpliftBlog,
} from "@/lib/upliftai";
import styles from "./BlogPost.module.css";

export const revalidate = 900;

type BlogPostPageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await getUpliftBlog(slug);
    const blog = result.data?.blog;

    if (!blog) {
        return {
            title: "Blog | Canada Telugu Classifieds",
        };
    }

    const title = blog.meta?.seoTitle || `${blog.title} | Canada Telugu Classifieds`;
    const description = blog.meta?.seoDescription || blog.excerpt || undefined;
    const image = blog.featuredImage ? [{ url: blog.featuredImage }] : undefined;

    return {
        title,
        description,
        keywords: blog.meta?.keywords || blog.tags || undefined,
        authors: blog.authorName ? [{ name: blog.authorName, url: blog.authorUrl || undefined }] : undefined,
        openGraph: {
            title: blog.meta?.ogTitle || blog.title,
            description: blog.meta?.ogDescription || description,
            type: "article",
            url: `https://canadateluguclassifieds.com/blog/${blog.slug}`,
            siteName: blog.meta?.ogSiteName || "Canada Telugu Classifieds",
            locale: blog.meta?.ogLocale || "en_CA",
            images: image,
            publishedTime: blog.publishDate || undefined,
            modifiedTime: blog.updatedAt || blog.freshness?.lastUpdatedAt || undefined,
            authors: blog.authorName ? [blog.authorName] : undefined,
            tags: blog.meta?.articleTags || blog.tags || undefined,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const result = await getUpliftBlog(slug);
    const blog = result.data?.blog;

    if (!blog) {
        if (result.status === 404) {
            notFound();
        }

        return (
            <main className={styles.page}>
                <div className="container">
                    <Link href="/blog" className={styles.backLink}>Back to Blog</Link>
                    <section className={styles.emptyState}>
                        <h1>Blog post is unavailable</h1>
                        <p>The article could not be loaded right now. Please check back soon.</p>
                    </section>
                </div>
            </main>
        );
    }

    const date = formatBlogDate(blog);
    const readingTime = getReadingTime(blog);
    const categories = blog.categories || [];
    const tags = blog.tags || [];

    return (
        <main className={styles.page}>
            <div className="container">
                <Link href="/blog" className={styles.backLink}>Back to Blog</Link>

                <header className={styles.header}>
                    {categories.length > 0 && (
                        <div className={styles.categoryRow}>
                            {categories.slice(0, 3).map((category) => (
                                <span className={styles.category} key={category}>{category}</span>
                            ))}
                        </div>
                    )}

                    <h1 className={styles.title}>{blog.title}</h1>

                    {blog.excerpt && <p className={styles.excerpt}>{blog.excerpt}</p>}

                    <div className={styles.meta}>
                        {date && <span>Published {date}</span>}
                        {date && readingTime && <span className={styles.dot} aria-hidden="true" />}
                        {readingTime && <span>{readingTime}</span>}
                        {blog.authorName && (date || readingTime) && <span className={styles.dot} aria-hidden="true" />}
                        {blog.authorName && blog.authorUrl ? (
                            <Link href={blog.authorUrl} className={styles.authorLink} target="_blank">
                                {blog.authorName}
                            </Link>
                        ) : (
                            blog.authorName && <span>{blog.authorName}</span>
                        )}
                    </div>
                </header>

                {blog.featuredImage && (
                    <Image
                        src={blog.featuredImage}
                        alt=""
                        width={1200}
                        height={640}
                        sizes="(max-width: 1100px) 100vw, 1100px"
                        className={styles.featuredImage}
                        priority
                    />
                )}

                <article className={styles.articleShell}>
                    <div className={styles.articleBody}>
                        {blog.content ? (
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{blog.content}</ReactMarkdown>
                        ) : (
                            <p>{blog.excerpt}</p>
                        )}
                    </div>

                    {tags.length > 0 && (
                        <div className={styles.tags} aria-label="Blog tags">
                            {tags.map((tag) => (
                                <span className={styles.tag} key={tag}>{tag}</span>
                            ))}
                        </div>
                    )}
                </article>
            </div>
        </main>
    );
}
