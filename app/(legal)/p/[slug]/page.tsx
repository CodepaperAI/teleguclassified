import { getCMSPageBySlug } from "../../../(admin)/admin/pages/actions";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import styles from "./page.module.css";
import { Metadata } from "next";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const { slug } = params;
    const page = await getCMSPageBySlug(slug);

    if (!page) return { title: 'Page Not Found' };

    return {
        title: `${page.title} | Canada Telugu Classifieds`,
        description: `Read our ${page.title.toLowerCase()} for Canada Telugu Classifieds.`,
    };
}

export default async function LegalPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const { slug } = params;
    const page = await getCMSPageBySlug(slug);

    if (!page) {
        notFound();
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{page.title}</h1>
                <p className={styles.lastUpdated}>
                    Last updated: {new Date(page.updated_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </header>

            <div className={styles.content}>
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{page.content}</ReactMarkdown>
            </div>
        </main>
    );
}
