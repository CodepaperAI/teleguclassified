"use client";

import Image from "next/image";
import styles from "./Hero.module.css";
import { useAppContext } from "@/context/AppContext";

export default function Hero() {
    const { siteSettings } = useAppContext();
    const bannerUrl = siteSettings?.home_banner_url || '/hero-bg.png';
    const description = siteSettings?.hero_description || 'Buy, sell, rent, and connect with locals easily across Canada.';

    return (
        <section className={styles.sectionWrapper}>
            <div className="container" style={{ padding: 0 }}>
                <div className={styles.hero}>
                    <Image
                        src={bannerUrl}
                        alt="Canada Telugu Classifieds Banner"
                        fill
                        priority
                        className={styles.bannerImage}
                    />
                    <div className={styles.overlay}></div>
                    <div className={styles.content}>
                        <h1 className={styles.title}>
                            Canada Telugu Classifieds
                        </h1>
                        <h2 className={styles.subtitle}>
                            (మన కమ్యూనిటీ మన ప్లాట్‌ఫామ్)
                        </h2>
                        <p className={styles.description}>
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
