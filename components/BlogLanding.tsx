import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, getBlogs, getReadingTime, getSiteUrl, getSortableDate, type BlogPost } from "@/lib/upliftai";
import styles from "./BlogLanding.module.css";

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function publishedLabel(post: BlogPost) {
  const date = formatBlogDate(post);
  return date ? `Published ${date}` : "Publish date unavailable";
}

function blogJsonLd(posts: BlogPost[]) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Canada Telugu Classifieds Blog",
    url: siteUrl,
    blogPost: posts.slice(0, 12).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishDate || post.createdAt || undefined,
      dateModified: post.updatedAt || post.publishDate || undefined,
      author: post.authorName
        ? {
            "@type": "Person",
            name: post.authorName,
            url: post.authorUrl || undefined
          }
        : undefined,
      image: post.featuredImage || undefined,
      description: post.excerpt || undefined
    }))
  };
}

export default async function BlogLanding() {
  const result = await getBlogs({ page: 1, limit: 12, status: "PUBLISH" });
  const posts = [...(result.data?.blogs || [])].sort((a, b) => getSortableDate(b).localeCompare(getSortableDate(a)));
  const featured = posts[0];
  const latest = posts.slice(1);

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogJsonLd(posts))
        }}
      />

      <header className={styles.topbar}>
        <div className="container">
          <Link href="/" className={styles.brand} aria-label="Canada Telugu Classifieds Blog home">
            <span className={styles.brandMark}>CT</span>
            <span>
              <strong>Canada Telugu</strong>
              <small>Classifieds Blog</small>
            </span>
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Canada Telugu Classifieds Blog</p>
              <h1>Community guides for Telugu classifieds, local services, and trusted deals in Canada</h1>
              <p>
                Buying guides, seller safety tips, local service notes, and marketplace advice shaped around the Canada Telugu Classifieds community.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {result.error ? (
          <section className={styles.emptyState}>
            <h2>Blog posts are unavailable</h2>
            <p>We could not load the latest Telugu Classifieds articles right now.</p>
          </section>
        ) : posts.length === 0 ? (
          <section className={styles.emptyState}>
            <h2>No posts yet</h2>
            <p>Published Telugu Classifieds guides will appear here soon.</p>
          </section>
        ) : (
          <>
            {featured && (
              <article className={styles.featured}>
                <Link href={`/blog/${featured.slug}`} className={styles.featuredImage} aria-label={featured.title}>
                  {featured.featuredImage ? (
                    <Image src={featured.featuredImage} alt="" fill sizes="(max-width: 900px) 100vw, 55vw" priority />
                  ) : (
                    <div className={styles.imageFallback}>{getInitials(featured.title)}</div>
                  )}
                </Link>
                <div className={styles.featuredBody}>
                  <div className={styles.kickerRow}>
                    <span>Featured Article</span>
                    {featured.categories?.[0] && <span>{featured.categories[0]}</span>}
                  </div>
                  <h2>
                    <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                  </h2>
                  {featured.excerpt && <p>{featured.excerpt}</p>}
                  <div className={styles.meta}>
                    <span>{publishedLabel(featured)}</span>
                    {getReadingTime(featured) && <span>{getReadingTime(featured)}</span>}
                    {featured.authorName && <span>{featured.authorName}</span>}
                  </div>
                  <Link href={`/blog/${featured.slug}`} className={styles.readLink}>
                    Read article
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </div>
              </article>
            )}

            <section className={styles.latest}>
              <div className={styles.sectionHead}>
                <div>
                  <p className={styles.eyebrow}>Latest Telugu Classifieds Articles</p>
                  <h2>Fresh community and marketplace updates</h2>
                </div>
              </div>

              <div className={styles.grid}>
                {(latest.length ? latest : posts).map((post) => (
                  <article className={styles.card} key={post.id}>
                    <Link href={`/blog/${post.slug}`} className={styles.cardImage} aria-label={post.title}>
                      {post.featuredImage ? (
                        <Image src={post.featuredImage} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
                      ) : (
                        <div className={styles.imageFallback}>{getInitials(post.title)}</div>
                      )}
                    </Link>
                    <div className={styles.cardBody}>
                      {post.categories?.[0] && <span className={styles.category}>{post.categories[0]}</span>}
                      <h3>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      {post.excerpt && <p>{post.excerpt}</p>}
                      <div className={styles.cardMeta}>
                        <span>{publishedLabel(post)}</span>
                        {getReadingTime(post) && <span>{getReadingTime(post)}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
