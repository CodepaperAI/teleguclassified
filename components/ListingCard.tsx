import Image from "next/image";
import Link from "next/link";
import styles from "./ListingCard.module.css";

interface ListingProps {
    id: string | number;
    image: string;
    price: string;
    title: string;
    location: string;
    time: string;
    isFeatured?: boolean;
    href?: string;
}

export default function ListingCard({ id, image, price, title, location, time, isFeatured, href }: ListingProps) {
    const linkHref = href || `/product/${id}`;
    return (
        <Link href={linkHref} className={styles.card}>
            <div className={styles.imageWrapper}>
                {image ? <img src={image} alt={title} className={styles.image} /> : <div className={styles.imagePlaceholder}>No Image</div>}
                {isFeatured && <span className={`${styles.badge} badge-featured`}>Featured</span>}
            </div>
            <div className={styles.content}>
                <div className={styles.top}>
                    <span className={styles.price}>{price}</span>
                    <span className={styles.time}>{time}</span>
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.location}>📍 {location}</p>
            </div>
        </Link>
    );
}
