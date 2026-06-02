import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { formatBlogDate, getBlog, getReadingTime, getSiteUrl } from "@/lib/upliftai";
import styles from "./page.module.css";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 900;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlog(slug);
  const post = result.data;

  if (!post) {
    return {
      title: "Blog post not found"
    };
  }

  const url = `${getSiteUrl()}/blog/${post.slug}`;
  const description = post.meta?.seoDescription || post.excerpt || "Canada Telugu Classifieds blog article.";

  return {
    title: post.meta?.seoTitle || post.title,
    description,
    keywords: post.meta?.keywords || post.tags || undefined,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: post.meta?.ogTitle || post.title,
      description: post.meta?.ogDescription || description,
      url,
      type: "article",
      siteName: post.meta?.ogSiteName || "Canada Telugu Classifieds Blog",
      locale: post.meta?.ogLocale || "en_CA",
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      publishedTime: post.publishDate || undefined,
      modifiedTime: post.updatedAt || post.publishDate || undefined,
      tags: post.meta?.articleTags || post.tags || undefined
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const result = await getBlog(slug);
  const post = result.data;

  if (!post) {
    if (result.status === 404) notFound();

    return (
      <main className={styles.page}>
        <div className="container">
          <Link href="/blog" className={styles.backLink}>Back to Blog</Link>
          <section className={styles.emptyState}>
            <h1>Blog post is unavailable</h1>
            <p>The article could not be loaded right now.</p>
          </section>
        </div>
      </main>
    );
  }

  const date = formatBlogDate(post);
  const readingTime = getReadingTime(post);
  const articleUrl = `${getSiteUrl()}/blog/${post.slug}`;
  const publisher = {
    "@type": "Organization",
    name: "Canada Telugu Classifieds",
    url: getSiteUrl(),
    logo: `${getSiteUrl()}/logo.png`
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.meta?.seoDescription || undefined,
    url: articleUrl,
    image: post.featuredImage || undefined,
    datePublished: post.publishDate || post.createdAt || undefined,
    dateModified: post.updatedAt || post.publishDate || undefined,
    author: publisher,
    publisher
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }}
      />
      <div className="container">
        <Link href="/blog" className={styles.backLink}>Back to Blog</Link>

        <article className={styles.article}>
          <header className={styles.header}>
            {post.categories?.length ? (
              <div className={styles.categories}>
                {post.categories.slice(0, 3).map((category) => (
                  <span key={category}>{category}</span>
                ))}
              </div>
            ) : null}

            <h1>{post.title}</h1>
            {post.excerpt && <p>{post.excerpt}</p>}
            <div className={styles.meta}>
              {date && <span>Published {date}</span>}
              {readingTime && <span>{readingTime}</span>}
            </div>
          </header>

          {post.featuredImage && (
            <div className={styles.imageWrap}>
              <Image src={post.featuredImage} alt="" fill sizes="(max-width: 1000px) 100vw, 1000px" priority />
            </div>
          )}

          <div className={styles.content}>
            {post.content ? <ReactMarkdown rehypePlugins={[rehypeRaw]}>{post.content}</ReactMarkdown> : <p>{post.excerpt}</p>}
          </div>
        </article>
      </div>
    </main>
  );
}
