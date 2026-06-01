"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./Faq.module.css";
import { FaChevronDown, FaQuestionCircle, FaChartLine, FaEnvelope, FaGlobe } from "react-icons/fa";

interface FaqItem {
    question: string;
    answer: React.ReactNode;
}

interface FaqCategory {
    title: string;
    icon: React.ReactNode;
    items: FaqItem[];
}

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState<{ cat: number, item: number } | null>({ cat: 0, item: 0 });

    const toggleAccordion = (catIndex: number, itemIndex: number) => {
        if (openIndex?.cat === catIndex && openIndex?.item === itemIndex) {
            setOpenIndex(null);
        } else {
            setOpenIndex({ cat: catIndex, item: itemIndex });
        }
    };

    const categories: FaqCategory[] = [
        {
            title: "Business Advertiser FAQ",
            icon: <FaChartLine />,
            items: [
                {
                    question: "Why are advertising fees non-refundable?",
                    answer: (
                        <div>
                            <p>Advertising fees are non-refundable because:</p>
                            <ul>
                                <li>Your ad space and visibility are provided immediately after payment</li>
                                <li>Once an ad is published or promoted, the service is considered delivered</li>
                                <li>Advertising exposure cannot be reversed or taken back</li>
                            </ul>
                            <p>This policy helps us keep pricing fair and affordable for all advertisers.</p>
                        </div>
                    )
                },
                {
                    question: "Why don’t you guarantee leads or sales?",
                    answer: (
                        <div>
                            <p>We provide advertising visibility, not guaranteed results. Leads and sales depend on:</p>
                            <ul>
                                <li>Your service quality</li>
                                <li>Pricing and competitiveness</li>
                                <li>Customer demand</li>
                                <li>Location and timing</li>
                            </ul>
                            <p>Just like newspaper ads or online ads, results can vary. Therefore, leads or sales cannot be guaranteed.</p>
                        </div>
                    )
                },
                {
                    question: "What exactly am I paying for?",
                    answer: (
                        <div>
                            <p>You are paying for:</p>
                            <ul>
                                <li>Placement on a trusted Telugu community platform</li>
                                <li>Visibility in selected categories and cities</li>
                                <li>Access to potential customers</li>
                                <li>Promotional features (if selected)</li>
                            </ul>
                            <p>You are not paying for guaranteed customers.</p>
                        </div>
                    )
                },
                {
                    question: "What if I don’t receive any calls or messages?",
                    answer: (
                        <div>
                            <p>If you receive fewer responses:</p>
                            <ul>
                                <li>Review your ad description and pricing</li>
                                <li>Add photos, logo, and clear contact details</li>
                                <li>Consider upgrading to Featured or Premium listings</li>
                            </ul>
                            <p>We are happy to provide basic guidance, but results vary.</p>
                        </div>
                    )
                },
                {
                    question: "Can I edit my ad after paying?",
                    answer: (
                        <div>
                            <p><strong>Yes.</strong> You can edit your ad details, description, images, and contact information anytime while your listing is active.</p>
                        </div>
                    )
                },
                {
                    question: "Can I cancel my subscription?",
                    answer: (
                        <div>
                            <p>Yes, you may cancel your subscription at any time.</p>
                            <ul>
                                <li>Cancellation stops future billing</li>
                                <li>The current paid period will remain active</li>
                                <li>No partial or unused time refunds are provided</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: "Why do ads rotate or move positions?",
                    answer: (
                        <div>
                            <p>To ensure fair visibility:</p>
                            <ul>
                                <li>Featured or Top Ads rotate among other similar ads</li>
                                <li>Regular listings move down as new ads are posted</li>
                            </ul>
                            <p>Rotation helps all advertisers receive exposure.</p>
                        </div>
                    )
                },
                {
                    question: "What happens if my ad violates rules?",
                    answer: (
                        <div>
                            <p>If an ad violates our policies:</p>
                            <ul>
                                <li>It may be edited, paused, or removed</li>
                                <li>Repeated violations may lead to account suspension</li>
                                <li>Fees are not refunded for removed ads</li>
                            </ul>
                        </div>
                    )
                },
                {
                    question: "Can my account be reclassified or suspended?",
                    answer: (
                        <div>
                            <p>Yes. Accounts may be reclassified or suspended if rules are violated, misleading info is posted, or attempts are made to bypass fees. All administrative decisions are final.</p>
                        </div>
                    )
                },
                {
                    question: "Who should advertise on this platform?",
                    answer: (
                        <div>
                            <p>Our platform is ideal for:</p>
                            <ul>
                                <li>Telugu-owned businesses</li>
                                <li>Local service providers</li>
                                <li>Professionals serving the Telugu community in Canada</li>
                            </ul>
                        </div>
                    )
                }
            ]
        },
        {
            title: "Ad Limits FAQ",
            icon: <FaQuestionCircle />,
            items: [
                {
                    question: "How many free ads can I post?",
                    answer: (
                        <div>
                            <p>Each user can post up to 2 free active ads at a time during our launch period. “Active” means ads that are live and not expired or deleted.</p>
                        </div>
                    )
                },
                {
                    question: "Can I post ads in different categories?",
                    answer: (
                        <div>
                            <p><strong>Yes.</strong> You can post ads in any category, but the total active ads cannot exceed 2. For example: 1 Rental + 1 Buy & Sell.</p>
                        </div>
                    )
                },
                {
                    question: "How many rental ads are allowed?",
                    answer: (
                        <div>
                            <p>For safety and quality reasons, only <strong>2 active rental ads</strong> are allowed per user. Rental ads expire after 30 days. This helps reduce spam and scams.</p>
                        </div>
                    )
                },
                {
                    question: "How many job ads can I post for free?",
                    answer: (
                        <div>
                            <p>Individuals can post 2 free job ads. Companies or recruiters are requested to use a paid job plan. Job ads expire after 30 days.</p>
                        </div>
                    )
                },
                {
                    question: "How many Buy & Sell ads are allowed?",
                    answer: (
                        <div>
                            <p>You can post up to 2 Buy & Sell ads. Ads expire after 30 days. Duplicate or repeated ads for the same item are not allowed.</p>
                        </div>
                    )
                },
                {
                    question: "How many service ads can I post?",
                    answer: (
                        <div>
                            <p>Individuals can post 1 free service ad. Businesses are required to upgrade to a vendor plan. Service ads expire after 30 days.</p>
                        </div>
                    )
                },
                {
                    question: "What happens after my ad expires?",
                    answer: (
                        <div>
                            <p>Once an ad expires, it is automatically removed from public view. You can repost or post a new ad (subject to free limits).</p>
                        </div>
                    )
                },
                {
                    question: "Can I post more than the free limit?",
                    answer: (
                        <div>
                            <p><strong>Yes.</strong> You can upgrade to Featured Ads for better visibility or subscribe to a Vendor or Business plan for more ads. Upgrading is optional.</p>
                        </div>
                    )
                },
                {
                    question: "Do featured ads increase my ad limit?",
                    answer: (
                        <div>
                            <p><strong>No.</strong> Featured ads boost visibility only and do not increase the number of allowed ads.</p>
                        </div>
                    )
                },
                {
                    question: "Why do you have ad limits?",
                    answer: (
                        <div>
                            <p>Ad limits help us keep listings clean, reduce spam, and give equal visibility to everyone. Our goal is to protect and support the Telugu community.</p>
                        </div>
                    )
                },
                {
                    question: "Can trusted users post more ads?",
                    answer: (
                        <div>
                            <p><strong>Yes.</strong> Users who verify email, post genuine ads, and receive no scam reports may receive additional posting benefits.</p>
                        </div>
                    )
                },
                {
                    question: "Is posting really free?",
                    answer: (
                        <div>
                            <p><strong>Yes.</strong> Basic ad posting is 100% free for regular users during the launch period.</p>
                        </div>
                    )
                }
            ]
        }
    ];

    return (
        <main style={{ minHeight: '100vh', background: '#f4f7f9' }}>
            <Navbar />
            
            <div className={styles.faqContainer}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Frequently Asked Questions</h1>
                    <p className={styles.subtitle}>
                        Everything you need to know about pricing, ad limits, and how our platform works.
                    </p>
                </header>

                {categories.map((category, catIndex) => (
                    <section key={catIndex} className={styles.categorySection}>
                        <h2 className={styles.categoryTitle}>
                            <i>{category.icon}</i>
                            {category.title}
                        </h2>
                        
                        <div className={styles.faqGrid}>
                            {category.items.map((item, itemIndex) => (
                                <div key={itemIndex} className={styles.faqItem}>
                                    <button 
                                        className={styles.faqQuestion}
                                        onClick={() => toggleAccordion(catIndex, itemIndex)}
                                    >
                                        <span>{item.question}</span>
                                        <FaChevronDown className={`${styles.icon} ${openIndex?.cat === catIndex && openIndex?.item === itemIndex ? styles.iconOpen : ''}`} />
                                    </button>
                                    
                                    <div className={`${styles.faqAnswer} ${openIndex?.cat === catIndex && openIndex?.item === itemIndex ? styles.faqAnswerOpen : ''}`}>
                                        <div className={styles.answerContent}>
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <div className={styles.contactBox}>
                    <h3 className={styles.contactTitle}>Still have questions?</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
                        If you couldn't find the answer you're looking for, feel free to reach out to our support team.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaEnvelope color="#19A38F" />
                            <a href="mailto:info@canadateluguclassifieds.com" className={styles.contactLink}>info@canadateluguclassifieds.com</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaGlobe color="#c5a059" />
                            <a href="https://www.canadateluguclassifieds.com" target="_blank" className={styles.contactLink}>www.canadateluguclassifieds.com</a>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
