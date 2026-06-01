"use client";

import { useState } from "react";
import { LocationDto } from "@/lib/db/locations";
import {
    createLocation, updateLocation, deleteLocation, toggleLocationStatus
} from "@/lib/actions/admin-locations";
import styles from "./LocationManager.module.css";
import { FaPlus, FaPen, FaTrash, FaChevronRight, FaChevronDown, FaMapMarkerAlt, FaCity } from "react-icons/fa";
import Dialog from "@/components/Dialog";

interface Props {
    initialLocations: LocationDto[];
}

type ModalType = 'state' | 'city';
type ActionType = 'create' | 'edit' | 'delete';

export default function LocationManager({ initialLocations }: Props) {
    const states = initialLocations.filter(loc => loc.type === 'state');
    const getCitiesForState = (stateId: string) => initialLocations.filter(loc => loc.type === 'city' && loc.parent_id === stateId);

    const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('state');
    const [modalAction, setModalAction] = useState<ActionType>('create');
    const [selectedItem, setSelectedItem] = useState<LocationDto | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);

    const [formData, setFormData] = useState({ name: '', is_active: true });
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'alert' as 'alert' | 'confirm', onConfirm: () => { } });

    const toggleState = (id: string) => {
        const next = new Set(expandedStates);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedStates(next);
    };

    const openModal = (type: ModalType, action: ActionType, item?: LocationDto | null, parent?: string | null) => {
        setModalType(type);
        setModalAction(action);
        setSelectedItem(item || null);
        setParentId(parent || null);
        setFormData({
            name: item?.name || '',
            is_active: item?.is_active ?? true
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (modalAction === 'create') {
                result = await createLocation({
                    name: formData.name,
                    type: modalType,
                    parent_id: modalType === 'city' ? parentId! : undefined
                });
            } else if (selectedItem) {
                result = await updateLocation(selectedItem.id, {
                    name: formData.name,
                    is_active: formData.is_active
                });
            }

            if (result && !result.success) {
                alert(result.error);
            } else {
                setModalOpen(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (type: ModalType, id: string) => {
        setDialog({
            isOpen: true,
            title: `Delete ${type === 'state' ? 'State' : 'City'}?`,
            message: "Are you sure? This action cannot be undone.",
            type: 'confirm',
            onConfirm: async () => {
                const result = await deleteLocation(id);

                if (result && !result.success) {
                    alert(result.error);
                }
                setDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleToggleStatus = async (item: LocationDto) => {
        const result = await toggleLocationStatus(item.id, item.is_active);
        if (!result.success) {
            alert(result.error);
        }
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
                <button className={styles.addBtn} onClick={() => openModal('state', 'create')}>
                    <FaPlus /> Add State/Province
                </button>
            </div>

            <div className={styles.tree}>
                {states.map(state => (
                    <div key={state.id} className={`${styles.categoryNode} ${!state.is_active ? styles.nodeDisabled : ''}`}>
                        <div className={styles.nodeHeader}>
                            <button className={styles.expandBtn} onClick={() => toggleState(state.id)}>
                                {expandedStates.has(state.id) ? <FaChevronDown /> : <FaChevronRight />}
                            </button>
                            <span className={styles.icon}><FaMapMarkerAlt /></span>
                            <span className={styles.label}>{state.name} ({state.code})</span>
                            <span className={state.is_active ? styles.badge : styles.badgeDisabled}>
                                {state.is_active ? 'Active' : 'Disabled'}
                            </span>

                            <div className={styles.actions}>
                                <button onClick={() => handleToggleStatus(state)} title={state.is_active ? "Disable" : "Enable"}>
                                    {state.is_active ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => openModal('state', 'edit', state)} title="Edit">
                                    <FaPen />
                                </button>
                                <button onClick={() => handleDelete('state', state.id)} title="Delete" className={styles.deleteBtn}>
                                    <FaTrash />
                                </button>
                                <button onClick={() => openModal('city', 'create', null, state.id)} title="Add City" className={styles.addSubBtn}>
                                    <FaPlus /> City
                                </button>
                            </div>
                        </div>

                        {expandedStates.has(state.id) && (
                            <div className={styles.children}>
                                {getCitiesForState(state.id).map(city => (
                                    <div key={city.id} className={`${styles.subNode} ${!city.is_active ? styles.nodeDisabled : ''}`}>
                                        <div className={styles.nodeHeader}>
                                            <span style={{ marginLeft: 32 }} className={styles.icon}><FaCity /></span>
                                            <span className={styles.label}>{city.name}</span>
                                            <span className={city.is_active ? styles.badge : styles.badgeDisabled}>
                                                {city.is_active ? 'Active' : 'Disabled'}
                                            </span>

                                            <div className={styles.actions}>
                                                <button onClick={() => handleToggleStatus(city)} title={city.is_active ? "Disable" : "Enable"}>
                                                    {city.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button onClick={() => openModal('city', 'edit', city, state.id)} title="Edit">
                                                    <FaPen />
                                                </button>
                                                <button onClick={() => handleDelete('city', city.id)} title="Delete" className={styles.deleteBtn}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {getCitiesForState(state.id).length === 0 && (
                                    <div className={styles.emptyNode}>No cities added yet.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>
                            {modalAction === 'create' ? 'Add' : 'Edit'} {modalType === 'state' ? 'State/Province' : 'City'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder={modalType === 'state' ? "e.g., Ontario" : "e.g., Toronto"}
                                />
                            </div>


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
