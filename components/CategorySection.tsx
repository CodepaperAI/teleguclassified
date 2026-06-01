import Link from "next/link";
import styles from "./CategorySection.module.css";

const categories = [
    {
        title: "Buy/Sell",
        description: "Find electronics, vehicles, furniture and more from the community members across Canada.",
        icon: "🛒",
        link: "/buy-sell",
        color: "var(--primary)"
    },
    {
        title: "Services",
        description: "Discover trusted Telugu professionals for IT, Legal, Healthcare, Tiffin Services, and more.",
        icon: "🛠️",
        link: "/services",
        color: "var(--accent)"
    },
    {
        title: "Real Estate",
        description: "Browse rentals, shared accommodations, and housing opportunities in Telugu-favored neighborhoods.",
        icon: "🏠",
        link: "/real-estate",
        color: "var(--secondary)"
    },
    {
        title: "Jobs",
        description: "Explore career opportunities within the community, from IT roles to local services.",
        icon: "💼",
        link: "/jobs",
        color: "var(--primary)"
    },
    {
        title: "Events",
        description: "Stay updated with community gatherings, festivals, and networking events across Canada.",
        icon: "📅",
        link: "/events",
        color: "var(--accent)"
    }
];

export default function CategorySection() {
    return (
        <section className={styles.section} id="categories">
            <div className={`${styles.header} animate-fade`}>
                <h2 className="gradient-text">Explore Categories</h2>
                <p style={{ color: "var(--text-muted)" }}>Browse through our curated sections to find exactly what you need.</p>
            </div>

            <div className={styles.grid}>
                {categories.map((cat, index) => (
                    <Link href={cat.link} key={index}>
                        <div className={`${styles.card} glass-morphism animate-slide-up`} style={{ animationDelay: `${0.2 * (index + 1)}s` }}>
                            <div className={styles.content}>
                                <div className={styles.cardIcon}>{cat.icon}</div>
                                <h3 className={styles.cardTitle}>{cat.title}</h3>
                                <p className={styles.cardDesc}>{cat.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
