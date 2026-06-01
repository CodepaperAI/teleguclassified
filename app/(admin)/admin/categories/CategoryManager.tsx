"use client";

import { useState } from "react";
import { CategoryDto, SubCategoryDto, ListingTypeDto } from "@/lib/db/categories";
import {
    createCategory, updateCategory, deleteCategory,
    createSubCategory, updateSubCategory, deleteSubCategory,
    createListingType, updateListingType, deleteListingType
} from "@/lib/actions/admin-categories";
import styles from "./CategoryManager.module.css";
import { FaPlus, FaPen, FaTrash, FaChevronRight, FaChevronDown, FaLayerGroup, FaTags, FaList } from "react-icons/fa6";
import Dialog from "@/components/Dialog";

interface Props {
    initialCategories: CategoryDto[];
}

type ModalType = 'category' | 'subcategory' | 'listingtype';
type ActionType = 'create' | 'edit' | 'delete';

export default function CategoryManager({ initialCategories }: Props) {
    // We rely on server revalidation to update the list, but for optimal UX we could update local state too.
    // However, since we revalidatePath in actions, the page should refresh. 
    // But since this is a client component receiving props, we might need to rely on router.refresh() 
    // or just assume the parent re-renders when the server action completes and Next.js updates the RSC payload.
    // Actually, router.refresh() is needed in the client component after action to pull new data.

    // For simplicity, let's use the props, but we might need a useRouter to refresh.
    // Wait, createAdminClient actions revalidatePath, which updates the server cache.
    // But the client component needs to trigger a refresh.

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<number>>(new Set());

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('category');
    const [modalAction, setModalAction] = useState<ActionType>('create');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [parentId, setParentId] = useState<string | number | null>(null);

    const [formData, setFormData] = useState({ label: '', id: '', icon: '' }); // id is only for category creation
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm', onConfirm: () => { } });

    const toggleCategory = (id: string) => {
        const next = new Set(expandedCategories);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedCategories(next);
    };

    const toggleSubCategory = (id: number) => {
        const next = new Set(expandedSubCategories);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedSubCategories(next);
    };

    const openModal = (type: ModalType, action: ActionType, item?: any, parent?: string | number) => {
        setModalType(type);
        setModalAction(action);
        setSelectedItem(item);
        setParentId(parent || null);
        setFormData({
            label: item?.label || '',
            id: item?.id || '',
            icon: item?.icon || ''
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (modalType === 'category') {
                if (modalAction === 'create') {
                    // ID is auto-generated
                    result = await createCategory({ label: formData.label, icon: formData.icon });
                } else {
                    result = await updateCategory(selectedItem.id, { label: formData.label, icon: formData.icon });
                }
            } else if (modalType === 'subcategory') {
                if (modalAction === 'create') {
                    result = await createSubCategory({ label: formData.label, category_id: parentId as string });
                } else {
                    result = await updateSubCategory(selectedItem.id, { label: formData.label, category_id: selectedItem.category_id });
                }
            } else if (modalType === 'listingtype') {
                if (modalAction === 'create') {
                    result = await createListingType({ label: formData.label, sub_category_id: parentId as number });
                } else {
                    result = await updateListingType(selectedItem.id, { label: formData.label, sub_category_id: selectedItem.sub_category_id });
                }
            }

            if (result && !result.success) {
                alert(result.error);
            } else {
                setModalOpen(false);
                // In a real app, use router.refresh() here
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (type: ModalType, id: string | number) => {
        setDialog({
            isOpen: true,
            title: `Delete ${type === 'category' ? 'Category' : type === 'subcategory' ? 'Subcategory' : 'Listing Type'}?`,
            message: "Are you sure? This action cannot be undone and might affect existing listings.",
            type: 'confirm',
            onConfirm: async () => {
                let result;
                if (type === 'category') result = await deleteCategory(id as string);
                else if (type === 'subcategory') result = await deleteSubCategory(id as number);
                else result = await deleteListingType(id as number);

                if (result && !result.success) {
                    alert(result.error);
                } else {
                    window.location.reload();
                }
                setDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <div className={styles.manager}>
            <Dialog
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
                onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
            />

            <div className={styles.topBar}>
                <button className={styles.addBtn} onClick={() => openModal('category', 'create')}>
                    <FaPlus /> Add New Category
                </button>
            </div>

            <div className={styles.tree}>
                {initialCategories.map(cat => (
                    <div key={cat.id} className={styles.categoryNode}>
                        <div className={styles.nodeHeader}>
                            <button className={styles.expandBtn} onClick={() => toggleCategory(cat.id)}>
                                {expandedCategories.has(cat.id) ? <FaChevronDown /> : <FaChevronRight />}
                            </button>
                            <span className={styles.icon}>{cat.icon || <FaLayerGroup />}</span>
                            <span className={styles.label}>{cat.label}</span>
                            <span className={styles.idBadge}>{cat.id}</span>

                            <div className={styles.actions}>
                                <button onClick={() => openModal('category', 'edit', cat)} title="Edit">
                                    <FaPen />
                                </button>
                                <button onClick={() => handleDelete('category', cat.id)} title="Delete" className={styles.deleteBtn}>
                                    <FaTrash />
                                </button>
                                <button onClick={() => openModal('subcategory', 'create', null, cat.id)} title="Add Subcategory" className={styles.addSubBtn}>
                                    <FaPlus /> Sub
                                </button>
                            </div>
                        </div>

                        {expandedCategories.has(cat.id) && (
                            <div className={styles.children}>
                                {cat.subCategories?.map(sub => (
                                    <div key={sub.id} className={styles.subNode}>
                                        <div className={styles.nodeHeader}>
                                            <button className={styles.expandBtn} onClick={() => toggleSubCategory(sub.id)}>
                                                {expandedSubCategories.has(sub.id) ? <FaChevronDown /> : <FaChevronRight />}
                                            </button>
                                            <span className={styles.icon}><FaTags /></span>
                                            <span className={styles.label}>{sub.label}</span>

                                            <div className={styles.actions}>
                                                <button onClick={() => openModal('subcategory', 'edit', sub, cat.id)} title="Edit">
                                                    <FaPen />
                                                </button>
                                                <button onClick={() => handleDelete('subcategory', sub.id)} title="Delete" className={styles.deleteBtn}>
                                                    <FaTrash />
                                                </button>
                                                <button onClick={() => openModal('listingtype', 'create', null, sub.id)} title="Add Type" className={styles.addSubBtn}>
                                                    <FaPlus /> Type
                                                </button>
                                            </div>
                                        </div>

                                        {expandedSubCategories.has(sub.id) && (
                                            <div className={styles.grandChildren}>
                                                {sub.listingTypes?.map(type => (
                                                    <div key={type.id} className={styles.typeNode}>
                                                        <span className={styles.icon}><FaList /></span>
                                                        <span className={styles.label}>{type.label}</span>
                                                        <div className={styles.actions}>
                                                            <button onClick={() => openModal('listingtype', 'edit', type, sub.id)} title="Edit">
                                                                <FaPen />
                                                            </button>
                                                            <button onClick={() => handleDelete('listingtype', type.id)} title="Delete" className={styles.deleteBtn}>
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!sub.listingTypes || sub.listingTypes.length === 0) && (
                                                    <div className={styles.emptyNode}>No listing types</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!cat.subCategories || cat.subCategories.length === 0) && (
                                    <div className={styles.emptyNode}>No subcategories</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>
                            {modalAction === 'create' ? 'Add' : 'Edit'} {modalType === 'category' ? 'Category' : modalType === 'subcategory' ? 'Subcategory' : 'Listing Type'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Label</label>
                                <input
                                    type="text"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    required
                                />
                            </div>
                            {modalType === 'category' && (
                                <div className={styles.formGroup}>
                                    <label>Icon (Emoji or Class)</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={loading} className={styles.submitBtn}>
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
