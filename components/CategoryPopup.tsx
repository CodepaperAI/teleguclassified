"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./CategoryPopup.module.css";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { generateCategoryUrl } from "@/lib/db/categories";

interface CategoryPopupProps {
    categoryId: string | null;
    onClose: () => void;
}

export default function CategoryPopup({ categoryId, onClose }: CategoryPopupProps) {
    const { categories } = useAppContext();
    const [activeCat, setActiveCat] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!categoryId || !mounted) return null;

    const currentCategory = categories.find(c => c.id === categoryId);
    const subCategories = currentCategory?.subCategories || [];
    const selectedSub = subCategories.find(s => s.label === activeCat);

    const handleBack = () => setActiveCat(null);

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>CATEGORIES</span>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {!activeCat ? (
                        <>
                            <Link href={generateCategoryUrl(currentCategory?.label || '')} className={styles.seeAll} onClick={onClose}>
                                See all in {currentCategory?.label}
                            </Link>
                            <div className={styles.categoryList}>
                                {subCategories.map((sub, idx) => (
                                    <div
                                        key={idx}
                                        className={styles.categoryItem}
                                        onClick={() => setActiveCat(sub.label)}
                                    >
                                        <span className={styles.itemLabel}>{sub.label}</span>
                                        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.backHeader} onClick={handleBack}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                <h3>{activeCat}</h3>
                            </div>
                            <div className={styles.subList}>
                                <Link
                                    href={generateCategoryUrl(currentCategory?.label || '', activeCat)}
                                    className={`${styles.subItem} ${styles.seeAllSub}`}
                                    style={{ fontWeight: 600, borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}
                                    onClick={onClose}
                                >
                                    See all in {activeCat}
                                </Link>
                                {(selectedSub?.subItems || []).map((item, i) => (
                                    <Link
                                        key={i}
                                        href={generateCategoryUrl(currentCategory?.label || '', activeCat, item)}
                                        className={styles.subItem}
                                        onClick={onClose}
                                    >
                                        {item}
                                    </Link>
                                ))}
                                {selectedSub?.subItems?.length === 0 && (
                                    <Link
                                        href={generateCategoryUrl(currentCategory?.label || '', activeCat)}
                                        className={styles.subItem}
                                        onClick={onClose}
                                    >
                                        View all {selectedSub.label}
                                    </Link>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
