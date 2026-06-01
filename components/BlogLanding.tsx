import Image from "next/image";
import Link from "next/link";
import { formatBlogDate, getBlogs, getReadingTime, getSiteUrl, getSortableDate, type BlogPost } from "@/lib/upliftai";
import styles from "./BlogLanding.module.css";

const topics = [
  {
    title: "Buy & Sell",
    text: "Practical tips for finding deals, pricing items, and making safer local exchanges."
  },
  {
    title: "Real Estate",
    text: "Guides for rentals, roommates, neighbourhood moves, and Telugu-friendly housing searches."
  },
  {
    title: "Services",
    text: "Notes for choosing local service providers and understanding common community needs."
  },
  {
    title: "Jobs",
    text: "Career reads, newcomer context, and hiring updates shaped for Telugu professionals."
  },
  {
    title: "Events",
    text: "Community updates for cultural gatherings, meetups, and local Telugu celebrations."
  }
];

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
  const visiblePosts = latest.length ? latest : posts;

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
            <span className={styles.brandMark}>CTC</span>
            <span>
              <strong>Canada Telugu Classifieds</strong>
              <small>మన కమ్యూనిటీ మన ప్లాట్‌ఫామ్</small>
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Blog sections">
            <a href="#topics">Topics</a>
            <a href="#latest">Latest</a>
            <a href="https://canadateluguclassifieds.com/">Classifieds</a>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Canada Telugu Classifieds Blog</p>
              <h1>Fresh reads for Telugu life, local listings, and community decisions in Canada</h1>
              <p>
                Helpful stories for buying, selling, renting, hiring, finding services, and staying connected with the Telugu community across Canada.
              </p>
              <div className={styles.heroActions}>
                <a href="#latest">Read latest articles</a>
                <a href="https://canadateluguclassifieds.com/">Visit classifieds</a>
              </div>
            </div>
            <div className={styles.heroPanel} aria-label="Community blog focus">
              <span>For the Telugu community</span>
              <strong>Guides before you post, search, move, hire, or attend.</strong>
              <p>Built as a focused blog home for Canada Telugu Classifieds readers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.topicBand} id="topics">
        <div className="container">
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Community Topics</p>
            <h2>Blog guidance around the classifieds people actually use</h2>
          </div>
          <div className={styles.topicGrid}>
            {topics.map((topic) => (
              <article className={styles.topic} key={topic.title}>
                <h3>{topic.title}</h3>
                <p>{topic.text}</p>
              </article>
            ))}
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
              <div className={styles.sectionHead} id="latest">
                <div>
                  <p className={styles.eyebrow}>Latest Articles</p>
                  <h2>New reads from the Canada Telugu Classifieds blog</h2>
                </div>
              </div>

              <div className={styles.grid}>
                {visiblePosts.map((post) => (
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

      <footer className={styles.footer}>
        <div className="container">
          <p>Canada Telugu Classifieds Blog</p>
          <span>మన కమ్యూనిటీ మన ప్లాట్‌ఫామ్</span>
        </div>
      </footer>
    </main>
  );
}
