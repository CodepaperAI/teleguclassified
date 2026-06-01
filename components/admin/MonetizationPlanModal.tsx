"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaPlus, FaCheck, FaChevronRight, FaChevronDown, FaShieldAlt } from "react-icons/fa";
import styles from "./MonetizationPlanModal.module.css";
import { MonetizationPlan, createOrUpdatePlan } from "@/lib/actions/admin-plans";
import { getCategoriesTree, CategoryDto } from "@/lib/db/categories";

interface Props {
    plan?: MonetizationPlan | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MonetizationPlanModal({ plan, onClose, onSuccess }: Props) {
    const [name, setName] = useState(plan?.name || "");
    const [listingPrice, setListingPrice] = useState(plan?.listing_price || 0);
    const [paidImageLimit, setPaidImageLimit] = useState(plan?.paid_image_limit || 10);

    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [selectedCatIds, setSelectedCatIds] = useState<string[]>(plan?.category_ids || []);
    const [selectedSubIds, setSelectedSubIds] = useState<number[]>(plan?.sub_category_ids || []);
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getCategoriesTree();
            setCategories(data);
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (catId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedCats(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleCategoryToggle = (catId: string) => {
        const isSelected = selectedCatIds.includes(catId);
        const category = categories.find(c => c.id === catId);
        const subIds = category?.subCategories?.map(s => s.id) || [];

        if (isSelected) {
            // Uncheck category and ALL its subcategories
            setSelectedCatIds(prev => prev.filter(id => id !== catId));
            setSelectedSubIds(prev => prev.filter(id => !subIds.includes(id)));
        } else {
            // Check category and ALL its subcategories
            setSelectedCatIds(prev => [...prev, catId]);
            setSelectedSubIds(prev => {
                const newSubs = subIds.filter(id => !prev.includes(id));
                return [...prev, ...newSubs];
            });
        }
    };

    const handleSubCategoryToggle = (subId: number, parentId: string) => {
        const isSelected = selectedSubIds.includes(subId);

        if (isSelected) {
            setSelectedSubIds(prev => prev.filter(id => id !== subId));
            // Note: We keep the category checked if at least one sub is still checked?
            // Actually, the user's logic: "if category checked then all subcategory checked automatically but admin can manually uncheck".
            // So checking a sub manually doesn't necessarily check the category.
            // But if all subs are unchecked, should we uncheck category? Let's see.
        } else {
            setSelectedSubIds(prev => [...prev, subId]);
        }
    };

    const isAllSubsSelected = (cat: CategoryDto) => {
        if (!cat.subCategories || cat.subCategories.length === 0) return selectedCatIds.includes(cat.id);
        return cat.subCategories.every(s => selectedSubIds.includes(s.id));
    };

    const isSomeSubsSelected = (cat: CategoryDto) => {
        if (!cat.subCategories || cat.subCategories.length === 0) return false;
        const some = cat.subCategories.some(s => selectedSubIds.includes(s.id));
        return some && !isAllSubsSelected(cat);
    };

    const handleSave = async () => {
        if (!name) return alert("Please enter a plan name");

        setSaving(true);
        try {
            await createOrUpdatePlan(
                {
                    id: plan?.id,
                    name,
                    free_limit: 0, // No longer per-plan
                    listing_price: listingPrice,
                    free_image_limit: 0, // No longer per-plan
                    paid_image_limit: paidImageLimit
                },
                selectedCatIds,
                selectedSubIds
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2 className={styles.title}>{plan ? "Edit Plan" : "Add Monetization Plan"}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
                </header>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}><FaShieldAlt color="#c5a059" /> Plan Details</h3>
                        <div className={styles.grid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Plan Name</label>
                                <input
                                    className={styles.input}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Real Estate Premium, Basic Silver"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Price per Listing ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={styles.input}
                                    value={listingPrice}
                                    onChange={e => setListingPrice(parseFloat(e.target.value) || 0)}
                                    min="0"
                                />
                                <p className={styles.helperText} style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                    Default price. Overridden by category-specific pricing if set.
                                </p>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Max Image Limit</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={paidImageLimit}
                                    onChange={e => setPaidImageLimit(parseInt(e.target.value) || 0)}
                                    min="0"
                                />
                                <p className={styles.helperText} style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                    Max images allowed per listing for this plan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}><FaPlus size={14} color="#c5a059" /> Assign to Categories</h3>
                        <p className={styles.description} style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                            Choose categories and subcategories that this plan should apply to.
                        </p>

                        <div className={styles.tree}>
                            {loading ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading categories...</div>
                            ) : (
                                categories.map(cat => (
                                    <div key={cat.id} className={styles.treeNode}>
                                        <div className={styles.catRow} onClick={() => handleCategoryToggle(cat.id)}>
                                            <button
                                                className={`${styles.expandBtn} ${expandedCats.includes(cat.id) ? styles.expanded : ''}`}
                                                onClick={(e) => toggleExpand(cat.id, e)}
                                            >
                                                <FaChevronRight size={14} />
                                            </button>

                                            <label className={styles.checkboxContainer} onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCatIds.includes(cat.id)}
                                                    onChange={() => handleCategoryToggle(cat.id)}
                                                />
                                                <span className={`${styles.checkmark} ${isSomeSubsSelected(cat) ? styles.indeterminate : ''}`}></span>
                                                <span className={styles.catLabel}>{cat.label}</span>
                                            </label>
                                        </div>

                                        {expandedCats.includes(cat.id) && cat.subCategories && (
                                            <div className={styles.subsContainer}>
                                                {cat.subCategories.map(sub => (
                                                    <div key={sub.id} className={styles.subRow}>
                                                        <label className={styles.checkboxContainer}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubIds.includes(sub.id)}
                                                                onChange={() => handleSubCategoryToggle(sub.id, cat.id)}
                                                            />
                                                            <span className={styles.checkmark}></span>
                                                            <span className={styles.subLabel}>{sub.label}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.submitBtn}
                        onClick={handleSave}
                        disabled={saving || !name}
                    >
                        {saving ? "Saving..." : <><FaCheck fontSize={14} /> Save Plan</>}
                    </button>
                </footer>
            </div>
        </div>
    );
}
