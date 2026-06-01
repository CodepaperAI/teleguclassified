'use client';

import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaCity } from "react-icons/fa";
import styles from "./LocationsManager.module.css";
import { getLocations, createLocation, updateLocation, deleteLocation, Location } from "@/app/(admin)/admin/locations/actions";

export default function LocationsManager() {
    // State
    const [states, setStates] = useState<Location[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [selectedState, setSelectedState] = useState<Location | null>(null);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingCities, setLoadingCities] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalType, setModalType] = useState<'state' | 'city'>('state');
    const [editingItem, setEditingItem] = useState<Location | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        is_active: true
    });

    // Initial Load
    useEffect(() => {
        loadStates();
    }, []);

    // Load Cities when state changes
    useEffect(() => {
        if (selectedState) {
            loadCities(selectedState.id);
        } else {
            setCities([]);
        }
    }, [selectedState]);

    const loadStates = async () => {
        setLoadingStates(true);
        try {
            const data = await getLocations('state');
            setStates(data);
            if (data.length > 0 && !selectedState) {
                // Optionally select first state
                // setSelectedState(data[0]); 
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load states");
        } finally {
            setLoadingStates(false);
        }
    };

    const loadCities = async (stateId: string) => {
        setLoadingCities(true);
        try {
            const data = await getLocations('city', stateId);
            setCities(data);
        } catch (error) {
            console.error(error);
            alert("Failed to load cities");
        } finally {
            setLoadingCities(false);
        }
    };

    const handleOpenModal = (type: 'state' | 'city', mode: 'create' | 'edit', item?: Location) => {
        setModalType(type);
        setModalMode(mode);
        if (mode === 'edit' && item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                code: item.code,
                is_active: item.is_active
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                code: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await createLocation({
                    ...formData,
                    type: modalType,
                    // If creating a city, parent is selectedState. If creating state, parent is null.
                    parent_id: modalType === 'city' ? selectedState?.id || null : null
                });
            } else if (modalMode === 'edit' && editingItem) {
                await updateLocation(editingItem.id, formData);
            }

            setIsModalOpen(false);

            // Refresh
            if (modalType === 'state') {
                loadStates();
            } else {
                if (selectedState) loadCities(selectedState.id);
            }
        } catch (error) {
            console.error(error);
            alert("Operation failed");
        }
    };

    const handleDelete = async (type: 'state' | 'city', id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        try {
            await deleteLocation(id);
            if (type === 'state') {
                loadStates();
                if (selectedState?.id === id) setSelectedState(null);
            } else {
                if (selectedState) loadCities(selectedState.id);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete. It might depend on other items.");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* States Panel */}
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <h2 className={styles.title}>States / Provinces</h2>
                    </div>
                    <button
                        className={styles.addButton}
                        onClick={() => handleOpenModal('state', 'create')}
                    >
                        <FaPlus /> Add State
                    </button>
                </div>

                <div className={styles.list}>
                    {loadingStates ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : states.length === 0 ? (
                        <div className={styles.emptyState}>No states found.</div>
                    ) : (
                        states.map(state => (
                            <div
                                key={state.id}
                                className={`${styles.listItem} ${selectedState?.id === state.id ? styles.listItemActive : ''}`}
                                onClick={() => setSelectedState(state)}
                            >
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>{state.name}</span>
                                    <span className={styles.itemCode}>{state.code}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenModal('state', 'edit', state);
                                        }}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete('state', state.id);
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Cities Panel */}
            <div className={styles.container} style={{ opacity: selectedState ? 1 : 0.6, pointerEvents: selectedState ? 'auto' : 'none' }}>
                <div className={styles.header}>
                    <div className="flex items-center gap-2">
                        <FaCity className="text-green-600" />
                        <h2 className={styles.title}>
                            Cities {selectedState ? `in ${selectedState.name}` : '(Select a State)'}
                        </h2>
                    </div>
                    <button
                        className={styles.addButton}
                        onClick={() => handleOpenModal('city', 'create')}
                        disabled={!selectedState}
                        style={{ backgroundColor: !selectedState ? '#9ca3af' : undefined }}
                    >
                        <FaPlus /> Add City
                    </button>
                </div>

                <div className={styles.list}>
                    {!selectedState ? (
                        <div className={styles.emptyState}>Select a state on the left to manage cities.</div>
                    ) : loadingCities ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : cities.length === 0 ? (
                        <div className={styles.emptyState}>No cities found in this state.</div>
                    ) : (
                        cities.map(city => (
                            <div key={city.id} className={styles.listItem}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>{city.name}</span>
                                    <span className={styles.itemCode}>{city.code}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleOpenModal('city', 'edit', city)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete('city', city.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>
                            {modalMode === 'create' ? 'Add' : 'Edit'} {modalType === 'state' ? 'State' : 'City'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Name</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder={modalType === 'state' ? "e.g. Ontario" : "e.g. Toronto"}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Code (Optional)</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder={modalType === 'state' ? "e.g. ON" : "e.g. TOR"}
                                />
                            </div>

                            {/* <div className={styles.formGroup}>
                                <label className={styles.toggleSwitch}>
                                    <input 
                                        type="checkbox" 
                                        className={styles.checkbox}
                                        checked={formData.is_active}
                                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                    />
                                    Active
                                </label>
                            </div> */}

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
