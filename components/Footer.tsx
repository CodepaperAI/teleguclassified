"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import styles from "./Footer.module.css";
import { FaYoutube, FaXTwitter, FaInstagram, FaFacebook } from "react-icons/fa6";
import { slugify } from "@/lib/utils";

export default function Footer() {
    const { categories, siteSettings } = useAppContext();
    const pathname = usePathname();
    const isHome = pathname === "/";

    const socialLinks = siteSettings?.social_links || {};
    const contactEmail = siteSettings?.contact_email;
    const contactPhone = siteSettings?.contact_phone;
    const aboutUs = siteSettings?.about_us;

    if (!isHome) {
        return (
            <footer className={styles.footerMinimized}>
                <div className="container">
                    <div className={styles.minimizedContent}>
                        <div className={styles.followSection}>
                            <span className={styles.followLabel}>Follow Us</span>
                            <div className={styles.minimizedSocials}>
                                {socialLinks.youtube && <Link href={socialLinks.youtube} target="_blank" className={styles.socialIcon}><FaYoutube /></Link>}
                                {socialLinks.twitter && <Link href={socialLinks.twitter} target="_blank" className={styles.socialIcon}><FaXTwitter /></Link>}
                                {socialLinks.instagram && <Link href={socialLinks.instagram} target="_blank" className={styles.socialIcon}><FaInstagram /></Link>}
                                {socialLinks.facebook && <Link href={socialLinks.facebook} target="_blank" className={styles.socialIcon}><FaFacebook /></Link>}
                            </div>
                        </div>
                        <Link href="/blog" className={styles.minimizedLink}>Blog</Link>
                        <p className={styles.copyright}>&copy; {new Date().getFullYear()} Canada Telugu Classifieds. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <h4>ABOUT US</h4>
                        <p className={styles.description}>
                            {aboutUs || "Canada Telugu Classifieds is the trusted community marketplace for buying, selling, and connecting with locals."}
                        </p>
                        <div className={styles.socials}>
                            {socialLinks.youtube && <Link href={socialLinks.youtube} target="_blank" className={styles.socialIcon}><FaYoutube /></Link>}
                            {socialLinks.twitter && <Link href={socialLinks.twitter} target="_blank" className={styles.socialIcon}><FaXTwitter /></Link>}
                            {socialLinks.instagram && <Link href={socialLinks.instagram} target="_blank" className={styles.socialIcon}><FaInstagram /></Link>}
                            {socialLinks.facebook && <Link href={socialLinks.facebook} target="_blank" className={styles.socialIcon}><FaFacebook /></Link>}
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h4>CATEGORIES</h4>
                        <div className={styles.links}>
                            {categories
                                .filter((cat) => cat.label !== "Community")
                                .slice(0, 5)
                                .map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/${slugify(cat.label)}`}
                                        className={styles.link}
                                    >
                                        {cat.label}
                                    </Link>
                                ))}
                        </div>
                    </div>

                    <div className={styles.column}>
                        <h4>SUPPORT</h4>
                        <div className={styles.links}>
                            <Link href="/blog" className={styles.link}>Blog</Link>
                            <Link href="/faq" className={styles.link}>FAQ</Link>
                            <Link href="/p/privacy-policy" className={styles.link}>Privacy Policy</Link>
                            <Link href="/p/terms" className={styles.link}>Terms & Conditions</Link>
                            <Link href="/p/refund-policy" className={styles.link}>Refund Policy</Link>
                            <Link href="/p/safty-guidelines" className={styles.link}>Safety Guidelines</Link>
                            {contactEmail && <div className={styles.link} style={{ marginTop: "10px", color: "#ccc" }}>Email: {contactEmail}</div>}
                            {contactPhone && <div className={styles.link} style={{ color: "#ccc" }}>Phone: {contactPhone}</div>}
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} Canada Telugu Classifieds. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
