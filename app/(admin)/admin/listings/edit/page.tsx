"use client";

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import styles from "./AdminEditListing.module.css";
import { useAppContext } from "@/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { adminCreateListing, adminUpdateListing } from "@/lib/actions/admin-listings";

import { getActiveCitiesByStateCode, LocationDto } from "@/lib/db/locations";
import { getProfile } from "@/lib/db/profile";

import dynamic from 'next/dynamic';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

type Phase = "category" | "details" | "preview";

export default function AdminEditListingPage() {
    return (
        <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.loader}></div><p>Loading Admin Editor...</p></div>}>
            <AdminEditListingContent />
        </Suspense>
    );
}

function AdminEditListingContent() {
    const supabase = createClient();
    const router = useRouter();
    const { user, isAdmin, isCheckingAdmin, isLoadingUser, addListing, categories, locations, isLoadingCategories, showAlert, showToast, premiumPlans, monetizationPlans, siteSettings } = useAppContext();

    const [isPublishing, setIsPublishing] = useState(false);
    const [isFetchingListing, setIsFetchingListing] = useState(false);

    const searchParams = useSearchParams();
    const listingId = searchParams.get("id") || searchParams.get("edit");
    const targetUserId = searchParams.get("userId") || searchParams.get("forUserId");

    // Phase State
    const [phase, setPhase] = useState<Phase>("category");

    // Phase 1: Category Selection
    const [selectedCatId, setSelectedCatId] = useState("");
    const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);
    const [selectedListingTypeId, setSelectedListingTypeId] = useState<number | null>(null);

    const [selectedSubCatLabel, setSelectedSubCatLabel] = useState("");
    const [selectedSubItemLabel, setSelectedSubItemLabel] = useState("");

    // Phase 2: Form Details
    const [adType, setAdType] = useState("offering");
    const [forSaleBy, setForSaleBy] = useState("owner");
    const [itemCondition, setItemCondition] = useState("");
    const [adTitle, setAdTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    // Price
    const [priceType, setPriceType] = useState("amount");
    const [priceAmount, setPriceAmount] = useState("");

    // Contact
    const [contactName, setContactName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [hidePhone, setHidePhone] = useState(false);

    // Location
    const [selectedProvinceCode, setSelectedProvinceCode] = useState("ON");
    const [city, setCity] = useState("Toronto");
    const [isOtherCity, setIsOtherCity] = useState(false);
    const [address, setAddress] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [activeCities, setActiveCities] = useState<LocationDto[]>([]);

    // Coordinates
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const [forRentBy, setForRentBy] = useState("owner");
    const [bedrooms, setBedrooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [sqft, setSqft] = useState("");
    const [acres, setAcres] = useState("");
    const [additionalOptions, setAdditionalOptions] = useState<string[]>([]);
    const [unitType, setUnitType] = useState("");
    const [agreementType, setAgreementType] = useState("");
    const [moveInDate, setMoveInDate] = useState("");
    const [petFriendly, setPetFriendly] = useState("");
    const [furnished, setFurnished] = useState("");
    const [appliances, setAppliances] = useState<string[]>([]);
    const [airConditioning, setAirConditioning] = useState("");
    const [outdoorSpace, setOutdoorSpace] = useState<string[]>([]);
    const [smoking, setSmoking] = useState("");
    const [accessibility, setAccessibility] = useState<string[]>([]);
    const [utilities, setUtilities] = useState<string[]>([]);
    const [wifiMore, setWifiMore] = useState<string[]>([]);
    const [parking, setParking] = useState("");
    const [termAgreement, setTermAgreement] = useState<string[]>([]);
    const [youtubeVideo, setYoutubeVideo] = useState("");
    const [websiteUrlEnabled, setWebsiteUrlEnabled] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [storageType, setStorageType] = useState("");
    const [keepLocationPrivate, setKeepLocationPrivate] = useState(false);

    // Job Specific
    const [jobOfferedBy, setJobOfferedBy] = useState("individual");
    const [companyName, setCompanyName] = useState("");
    const [jobType, setJobType] = useState("");
    const [salaryFrom, setSalaryFrom] = useState("");
    const [salaryTo, setSalaryTo] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Event Specific
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventStartTime, setEventStartTime] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventEndTime, setEventEndTime] = useState("");
    const [organizerName, setOrganizerName] = useState("");
    const [venueName, setVenueName] = useState("");
    const [hideEventLocation, setHideEventLocation] = useState(false);

    // Media
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
    const [imageLimit, setImageLimit] = useState(999); // Admins can upload any number of images

    // Admin Specific
    const [targetProfile, setTargetProfile] = useState<any>(null);
    const [listingStatus, setListingStatus] = useState("active");
    const [boostPlan, setBoostPlan] = useState<string | null>(null);

    // Fetch target profile if userId is provided
    useEffect(() => {
        if (targetUserId && isAdmin) {
            getProfile(targetUserId, supabase).then(profile => {
                if (profile) {
                    setTargetProfile(profile);
                    setContactName(prev => prev || profile.full_name || "");
                    setEmail(prev => prev || profile.email || "");
                }
            });
        }
    }, [targetUserId, isAdmin, supabase]);

    // Fetch listing for edit
    useEffect(() => {
        if (listingId && isAdmin) {
            const fetchListing = async () => {
                setIsFetchingListing(true);
                try {
                    const { data, error } = await supabase
                        .from('listings')
                        .select('*')
                        .eq('id', listingId)
                        .single();

                    if (data && !error) {
                        setPhase("details");
                        setSelectedCatId(data.category_id || "");
                        setSelectedSubCatId(data.sub_category_id || null);
                        setSelectedListingTypeId(data.listing_type_id || null);
                        setSelectedSubCatLabel(data.sub_category_label || "");
                        setSelectedSubItemLabel(data.sub_item_label || "");
                        setAdType(data.ad_type || "offering");
                        setForSaleBy(data.for_sale_by || "owner");
                        setItemCondition(data.item_condition || "");
                        setListingStatus(data.status || "active");
                        setAdTitle(data.title || "");
                        setDescription(data.description || "");
                        setTags(data.tags || []);
                        setPriceType(data.price_type || "amount");
                        setPriceAmount(data.price?.toString() || "");
                        setContactName(data.contact_name || "");
                        setPhone(data.contact_phone || "");
                        setEmail(data.contact_email || "");
                        setHidePhone(data.hide_phone_on_ad || false);
                        setSelectedProvinceCode(data.province_code || "ON");
                        setCity(data.city || "");
                        setAddress(data.address || "");
                        setPostalCode(data.postal_code || "");
                        setCoords(data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null);
                        setExistingImageUrls(data.images || []);
                        setInitialImageUrls(data.images || []);
                        setImagePreviews(data.images || []);
                        setYoutubeVideo(data.youtube_video_url || "");
                        setWebsiteUrlEnabled(!!data.website_url);
                        setWebsiteUrl(data.website_url || "");
                        setBoostPlan(data.boost_plan || null);

                        if (data.attributes) {
                            const attrs = data.attributes as any;
                            setBedrooms(attrs.bedrooms || "");
                            setBathrooms(attrs.bathrooms || "");
                            setSqft(attrs.sqft || "");
                            setAcres(attrs.acres || "");
                            setUnitType(attrs.unitType || "");
                            setAgreementType(attrs.agreementType || "");
                            setMoveInDate(attrs.moveInDate || "");
                            setPetFriendly(attrs.petFriendly || "");
                            setFurnished(attrs.furnished || "");
                            setAppliances(attrs.appliances || []);
                            setAirConditioning(attrs.airConditioning || "");
                            setOutdoorSpace(attrs.outdoorSpace || []);
                            setSmoking(attrs.smoking || "");
                            setAccessibility(attrs.accessibility || []);
                            setUtilities(attrs.utilities || []);
                            setWifiMore(attrs.wifiMore || []);
                            setParking(attrs.parking || "");
                            setTermAgreement(attrs.termAgreement || []);
                            setAdditionalOptions(attrs.additionalOptions || []);
                            setForRentBy(attrs.for_rent_by || "owner");
                            setJobOfferedBy(attrs.job_offered_by || "individual");
                            setCompanyName(attrs.company_name || "");
                            setJobType(attrs.job_type || "");
                            setSalaryFrom(attrs.salary_from || "");
                            setSalaryTo(attrs.salary_to || "");
                            setOrganizerName(attrs.organizer_name || "");
                            setVenueName(attrs.venue_name || "");
                            setEventStartDate(attrs.event_start_date || "");
                            setEventStartTime(attrs.event_start_time || "");
                            setEventEndDate(attrs.event_end_date || "");
                            setEventEndTime(attrs.event_end_time || "");
                            setHideEventLocation(attrs.hide_event_location || false);
                        }
                    }
                } finally {
                    setIsFetchingListing(false);
                }
            };
            fetchListing();
        }
    }, [listingId, isAdmin, supabase]);

    // Handle City/Province
    useEffect(() => {
        if (selectedProvinceCode) {
            getActiveCitiesByStateCode(selectedProvinceCode).then(setActiveCities);
        }
    }, [selectedProvinceCode]);

    // Handlers
    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCoords({ lat: latitude, lng: longitude });
                    fetchAddress(latitude, longitude);
                    setIsLocating(false);
                },
                () => {
                    showAlert("Error", "Could not get location.");
                    setIsLocating(false);
                }
            );
        }
    };

    const fetchAddress = async (lat: number, lng: number) => {
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await resp.json();
            if (data?.address) {
                const a = data.address;
                setAddress(`${a.house_number || ''} ${a.road || ''}`.trim());
                setCity(a.city || a.town || a.village || '');
                setPostalCode(a.postcode || '');
            }
        } catch (e) { console.error(e); }
    };

    const fetchCoordinates = async (query: string) => {
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await resp.json();
            if (data?.length > 0) setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } catch (e) { console.error(e); }
    };

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        const nt = tagInput.split(",").map(t => t.trim()).filter(t => t && !tags.includes(t));
        setTags([...tags, ...nt].slice(0, 5));
        setTagInput("");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (imagePreviews.length + files.length > imageLimit) {
            showAlert("Limit Reached", `Max ${imageLimit} images.`);
            return;
        }
        setSelectedImages(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeImage = (index: number) => {
        const url = imagePreviews[index];
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
            setSelectedImages(prev => prev.filter((_, i) => i !== imagePreviews.slice(0, index).filter(u => u.startsWith('blob:')).length));
        } else {
            setExistingImageUrls(prev => prev.filter(u => u !== url));
        }
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handlePublish = async () => {
        if (!isAdmin) return;
        if (!adTitle || !selectedCatId) {
            showAlert("Notice", "Missing required fields.");
            return;
        }

        setIsPublishing(true);
        try {
            // Upload Images
            const urls: string[] = [];
            for (const f of selectedImages) {
                const ext = f.name.split('.').pop();
                const path = `${targetUserId || user?.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
                const { error } = await supabase.storage.from('listings').upload(path, f);
                if (error) throw error;
                urls.push(supabase.storage.from('listings').getPublicUrl(path).data.publicUrl);
            }

            const attributes: any = {};
            if (selectedCatId === "housing") {
                if (selectedSubCatLabel === "For Rent") {
                    attributes.for_rent_by = forRentBy;
                }
                if (bedrooms) attributes.bedrooms = bedrooms;
                Object.assign(attributes, { bathrooms, sqft, acres, unitType, agreementType, moveInDate, petFriendly, furnished, appliances, airConditioning, outdoorSpace, smoking, accessibility, utilities, wifiMore, parking, termAgreement, additionalOptions });
            } else if (selectedCatId === "jobs") {
                Object.assign(attributes, { job_offered_by: jobOfferedBy, company_name: companyName, job_type: jobType, salary_from: salaryFrom, salary_to: salaryTo });
            } else if (selectedCatId === "events") {
                Object.assign(attributes, { organizer_name: organizerName, venue_name: venueName, event_start_date: eventStartDate, event_start_time: eventStartTime, event_end_date: eventEndDate, event_end_time: eventEndTime, hide_event_location: hideEventLocation });
            }

            const listingData = {
                user_id: targetUserId || user?.id,
                title: adTitle,
                description,
                price: priceType === "amount" ? parseFloat(priceAmount) : null,
                price_type: priceType,
                category_id: selectedCatId,
                sub_category_id: selectedSubCatId,
                listing_type_id: selectedListingTypeId,
                sub_category_label: selectedSubCatLabel,
                sub_item_label: selectedSubItemLabel,
                ad_type: adType,
                for_sale_by: forSaleBy,
                item_condition: itemCondition,
                contact_name: contactName,
                contact_phone: phone,
                contact_email: email,
                hide_phone_on_ad: hidePhone,
                city,
                postal_code: postalCode,
                province_code: selectedProvinceCode,
                address,
                tags,
                latitude: coords?.lat,
                longitude: coords?.lng,
                images: [...existingImageUrls, ...urls],
                youtube_video_url: youtubeVideo,
                website_url: websiteUrlEnabled ? websiteUrl : null,
                attributes,
                listing_fee: 0,
                status: listingStatus,
                boost_plan: boostPlan
            };

            const result = listingId 
                ? await adminUpdateListing(listingId, listingData)
                : await adminCreateListing(targetUserId || user?.id || "", listingData);

            if (result.error) throw result.error;
            showToast("Listing saved by Admin", "success");
            router.push("/admin/listings");
        } catch (e: any) { showAlert("Error", e.message); } finally { setIsPublishing(false); }
    };

    // Derived
    const currentCategory = categories.find(c => c.id === selectedCatId);
    const subCategories = currentCategory?.subCategories || [];
    const currentSubCategory = subCategories.find(sc => sc.label === selectedSubCatLabel);
    const subItems = currentSubCategory?.subItems || [];

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLevel, setModalLevel] = useState<"subCategory" | "subItem">("subCategory");

    // Security Guard
    if (isLoadingUser || isCheckingAdmin) {
        return <div className={styles.loadingContainer}><div className={styles.loader}></div><p>Verifying Admin Access...</p></div>;
    }

    if (!isAdmin) {
        return <div className="p-8 text-center text-red-600">Access Denied. Admin privilege required.</div>;
    }

    // Phase Renders (Mirrored from post-ad but adapted)
    const renderPhase1 = () => (
        <section className={styles.card}>
            <div className={styles.stepHeader}>
                <div className={styles.stepNumber}>1</div>
                <h2>Select Category</h2>
            </div>
            <div className={styles.categoryGrid}>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`${styles.catBtn} ${selectedCatId === cat.id ? styles.catBtnActive : ""}`}
                        onClick={() => {
                            setSelectedCatId(cat.id);
                            setSelectedSubCatLabel("");
                            setSelectedSubItemLabel("");
                            setModalLevel("subCategory");
                            setIsModalOpen(true);
                        }}
                    >
                        <span className={styles.catIcon}>{cat.icon}</span>
                        <span className={styles.catLabel}>{cat.label}</span>
                    </button>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {modalLevel === "subItem" && (
                                    <button className={styles.backBtn} onClick={() => setModalLevel("subCategory")}>←</button>
                                )}
                                <h3>CATEGORIES</h3>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            {modalLevel === "subCategory" ? (
                                <>
                                    <div className={styles.modalActionItem} onClick={() => {
                                        setSelectedSubCatLabel("All in " + (currentCategory?.label || ""));
                                        setIsModalOpen(false);
                                    }}>
                                        <span style={{ color: '#2563eb' }}>See all in {currentCategory?.label}</span>
                                    </div>
                                    <div className={styles.modalList}>
                                        {subCategories.map((sub, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.modalItem}
                                                onClick={() => {
                                                    setSelectedSubCatLabel(sub.label);
                                                    setSelectedSubCatId(sub.id);
                                                    if (sub.subItems && sub.subItems.length > 0) setModalLevel("subItem");
                                                    else setIsModalOpen(false);
                                                }}
                                            >
                                                <span>{sub.label}</span>
                                                {sub.subItems && sub.subItems.length > 0 && <span className={styles.chevron}>›</span>}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.modalList}>
                                    {subItems.map((item, idx) => (
                                        <div key={idx} className={styles.modalItem} onClick={() => { setSelectedSubItemLabel(item); setIsModalOpen(false); }}>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedCatId && selectedSubCatLabel && (
                <div className={styles.selectionSummary}>
                    <div className={styles.selectionInfo}>
                        <span className={styles.selectionLabel}>Selected:</span>
                        <strong className={styles.selectionText}>{currentCategory?.label} › {selectedSubCatLabel} {selectedSubItemLabel ? `› ${selectedSubItemLabel}` : ""}</strong>
                    </div>
                    <div className={styles.selectionActions}>
                        <button className={styles.changeBtn} onClick={() => setIsModalOpen(true)}>Change</button>
                        <button className={styles.continueBtn} onClick={() => setPhase("details")}>Continue →</button>
                    </div>
                </div>
            )}
        </section>
    );

    const renderPhase2 = () => {
        const isHousing = selectedCatId === "housing";
        const isJobs = selectedCatId === "jobs";
        const isEvents = selectedCatId === "events";

        return (
            <div className={styles.detailsLayout}>
                {/* Category Selection Summary */}
                <div className={styles.categorySummaryBox}>
                    <div className={styles.categorySummaryContent}>
                        <span>Selected Category</span>
                        <strong>{currentCategory?.label} › {selectedSubCatLabel} {selectedSubItemLabel ? `› ${selectedSubItemLabel}` : ""}</strong>
                    </div>
                    <button className={styles.categoryChangeBtn} onClick={() => setPhase("category")}>
                        Change Category
                    </button>
                </div>

                {/* Admin Management Helper */}
                <div className={styles.adminControlsCard}>
                    <div className={styles.adminControlsHeader}>
                         <h3 className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span> Admin Controls
                        </h3>
                    </div>
                    
                    <p className={styles.adminContextInfo}>
                        Acting as: <strong>{targetProfile?.full_name || targetUserId || "Master Admin"}</strong> ({targetProfile?.email || "System Account"})
                    </p>

                    <div className={styles.adminGrid}>
                        <div className={styles.adminField}>
                            <label className={styles.adminLabel}>Set Listing Status</label>
                            <select 
                                className={styles.adminSelect} 
                                value={listingStatus} 
                                onChange={e => setListingStatus(e.target.value)}
                            >
                                <option value="active">Active (Visible)</option>
                                <option value="payment_pending">Payment Pending</option>
                                <option value="expired">Expired</option>
                                <option value="deleted">Deleted (Hidden)</option>
                            </select>
                        </div>
                        <div className={styles.adminField}>
                            <label className={styles.adminLabel}>Ownership ID</label>
                            <input 
                                type="text" 
                                className={`${styles.adminInput} ${styles.adminInputReadOnly}`} 
                                value={targetUserId || ""} 
                                readOnly 
                            />
                        </div>
                    </div>
                </div>

                <section className={styles.card}>
                    <div className={styles.stepHeader}>
                        <div className={styles.stepNumber}>1</div>
                        <h2>Ad Details</h2>
                    </div>

                    <div className={styles.formGrid}>
                        {!isJobs && !isEvents && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ad Type</label>
                                <div className={styles.radioGroupHorizontal}>
                                    <label className={styles.radioOption}>
                                        <input type="radio" value="offering" checked={adType === "offering"} onChange={() => setAdType("offering")} />
                                        <span>Offering</span>
                                    </label>
                                    <label className={styles.radioOption}>
                                        <input type="radio" value="wanted" checked={adType === "wanted"} onChange={() => setAdType("wanted")} />
                                        <span>Wanted</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {selectedSubCatLabel === "For Rent" && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>For Rent By</label>
                                <div className={styles.radioGroupHorizontal}>
                                    <label className={styles.radioOption}>
                                        <input type="radio" name="forRentBy" value="owner" checked={forRentBy === "owner"} onChange={() => setForRentBy("owner")} />
                                        <span>Owner</span>
                                    </label>
                                    <label className={styles.radioOption}>
                                        <input type="radio" name="forRentBy" value="professional" checked={forRentBy === "professional"} onChange={() => setForRentBy("professional")} />
                                        <span>Professional</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Ad Title</label>
                            <input type="text" className={styles.input} value={adTitle} onChange={e => setAdTitle(e.target.value)} placeholder="What are you listing?" />
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Description</label>
                            <textarea className={styles.textarea} rows={8} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide details about your listing..." />
                        </div>

                        {/* HOUSING SPECIALIZED FIELDS */}
                        {isHousing && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Bedrooms</label>
                                    <select className={styles.select} value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
                                        <option value="">Select Bedrooms</option>
                                        {["Studio", "1", "1 + Den", "2", "2 + Den", "3", "3 + Den", "4", "4 + Den", "5+"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Bathrooms</label>
                                    <select className={styles.select} value={bathrooms} onChange={e => setBathrooms(e.target.value)}>
                                        <option value="">Select Bathrooms</option>
                                        {["1", "1.5", "2", "2.5", "3", "3.5", "4+"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Size (sqft)</label>
                                    <input type="text" className={styles.input} value={sqft} onChange={e => setSqft(e.target.value)} placeholder="e.g. 850" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Unit Type</label>
                                    <select className={styles.select} value={unitType} onChange={e => setUnitType(e.target.value)}>
                                        <option value="">- Select -</option>
                                        {["Apartment", "Basement", "Condo", "House", "Townhouse", "Duplex/Triplex", "Loft"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Agreement Type</label>
                                    <select className={styles.select} value={agreementType} onChange={e => setAgreementType(e.target.value)}>
                                        <option value="">- Select -</option>
                                        {["Month-to-month", "1 Year", "Fixed Term"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Move-in Date</label>
                                    <input type="date" className={styles.input} value={moveInDate} onChange={e => setMoveInDate(e.target.value)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Furnished</label>
                                    <div className={styles.radioGroupHorizontal}>
                                        {["Yes", "No"].map(opt => (
                                            <label key={opt} className={styles.radioOption}>
                                                <input type="radio" value={opt} checked={furnished === opt} onChange={() => setFurnished(opt)} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Air Conditioning</label>
                                    <select className={styles.select} value={airConditioning} onChange={e => setAirConditioning(e.target.value)}>
                                        <option value="">- Select -</option>
                                        {["Central", "Window Unit", "None"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Parking</label>
                                    <select className={styles.select} value={parking} onChange={e => setParking(e.target.value)}>
                                        <option value="">- Select -</option>
                                        {["Included", "Available for Fee", "None"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Appliances</label>
                                    <div className={styles.checkboxGroupHorizontal}>
                                        {["Fridge", "Stove", "Washer", "Dryer", "Dishwasher"].map(app => (
                                            <label key={app} className={styles.checkboxOption}>
                                                <input type="checkbox" checked={appliances.includes(app)} onChange={e => e.target.checked ? setAppliances([...appliances, app]) : setAppliances(appliances.filter(a => a !== app))} />
                                                <span>{app}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Pet Friendly</label>
                                    <div className={styles.radioGroupHorizontal}>
                                        {["Yes", "No", "Limited"].map(opt => (
                                            <label key={opt} className={styles.radioOption}>
                                                <input type="radio" value={opt} checked={petFriendly === opt} onChange={() => setPetFriendly(opt)} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Smoking Permitted</label>
                                    <div className={styles.radioGroupHorizontal}>
                                        {["Yes", "No", "Outside only"].map(opt => (
                                            <label key={opt} className={styles.radioOption}>
                                                <input type="radio" value={opt} checked={smoking === opt} onChange={() => setSmoking(opt)} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Outdoor Space</label>
                                    <div className={styles.checkboxGroupHorizontal}>
                                        {["Balcony", "Yard", "Deck", "Patio"].map((opt) => (
                                            <label key={opt} className={styles.checkboxOption}>
                                                <input type="checkbox" checked={outdoorSpace.includes(opt)} onChange={(e) => e.target.checked ? setOutdoorSpace([...outdoorSpace, opt]) : setOutdoorSpace(outdoorSpace.filter(o => o !== opt))} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Utilities Included</label>
                                    <div className={styles.checkboxGroupHorizontal}>
                                        {["Heat", "Water", "Electricity", "Internet"].map((opt) => (
                                            <label key={opt} className={styles.checkboxOption}>
                                                <input type="checkbox" checked={utilities.includes(opt)} onChange={(e) => e.target.checked ? setUtilities([...utilities, opt]) : setUtilities(utilities.filter(u => u !== opt))} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Accessibility</label>
                                    <div className={styles.checkboxGroupHorizontal}>
                                        {["Elevator", "Ramp", "Wheelchair Accessible"].map((opt) => (
                                            <label key={opt} className={styles.checkboxOption}>
                                                <input type="checkbox" checked={accessibility.includes(opt)} onChange={(e) => e.target.checked ? setAccessibility([...accessibility, opt]) : setAccessibility(accessibility.filter(a => a !== opt))} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Additional Options (optional)</label>
                                    <div className={styles.checkboxGroupHorizontal}>
                                        {["Online Application", "Video Chat", "Video Walkthrough"].map((opt) => (
                                            <label key={opt} className={styles.checkboxOption}>
                                                <input type="checkbox" checked={additionalOptions.includes(opt)} onChange={(e) => e.target.checked ? setAdditionalOptions([...additionalOptions, opt]) : setAdditionalOptions(additionalOptions.filter(o => o !== opt))} />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* JOBS SPECIALIZED FIELDS */}
                        {isJobs && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Job Type</label>
                                    <select className={styles.select} value={jobType} onChange={e => setJobType(e.target.value)}>
                                        <option value="">Select Type</option>
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="temporary">Temporary</option>
                                        <option value="casual">Casual / Freelance</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Company Name</label>
                                    <input type="text" className={styles.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Hiring Company" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Salary From ($)</label>
                                    <input type="text" className={styles.input} value={salaryFrom} onChange={e => setSalaryFrom(e.target.value)} placeholder="Min" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Salary To ($)</label>
                                    <input type="text" className={styles.input} value={salaryTo} onChange={e => setSalaryTo(e.target.value)} placeholder="Max" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Offered By</label>
                                    <div className={styles.radioGroupHorizontal}>
                                        <label className={styles.radioOption}>
                                            <input type="radio" checked={jobOfferedBy === "individual"} onChange={() => setJobOfferedBy("individual")} />
                                            <span>Individual</span>
                                        </label>
                                        <label className={styles.radioOption}>
                                            <input type="radio" checked={jobOfferedBy === "professional"} onChange={() => setJobOfferedBy("professional")} />
                                            <span>Staffing Agency / HR Professional</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* EVENTS SPECIALIZED FIELDS */}
                        {isEvents && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Start Date</label>
                                    <input type="date" className={styles.input} value={eventStartDate} onChange={e => setEventStartDate(e.target.value)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Start Time</label>
                                    <input type="time" className={styles.input} value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>End Date</label>
                                    <input type="date" className={styles.input} value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>End Time</label>
                                    <input type="time" className={styles.input} value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Venue Name</label>
                                    <input type="text" className={styles.input} value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Brampton Community Center" />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Organizer Name</label>
                                    <input type="text" className={styles.input} value={organizerName} onChange={e => setOrganizerName(e.target.value)} placeholder="Association or Group" />
                                </div>
                            </>
                        )}
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.stepHeader}>
                        <div className={styles.stepNumber}>2</div>
                        <h2>Price & Media</h2>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Price Type</label>
                            <select className={styles.select} value={priceType} onChange={e => setPriceType(e.target.value)}>
                                <option value="amount">Amount</option>
                                <option value="contact">Please Contact</option>
                                <option value="swap">Swap / Trade</option>
                                <option value="free">Free</option>
                            </select>
                        </div>
                        {priceType === "amount" && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Price ($)</label>
                                <input type="text" className={styles.input} value={priceAmount} onChange={e => setPriceAmount(e.target.value)} placeholder="0.00" />
                            </div>
                        )}
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Upload Photos</label>
                            <p className="text-xs text-gray-400 mb-2 italic">Admins can upload up to 20 images.</p>
                            <div className={styles.mediaGrid}>
                                {imagePreviews.map((url, idx) => (
                                    <div key={idx} className={styles.mediaSlot}>
                                        <img src={url} alt="" className={styles.previewImg} />
                                        <button className={styles.removeImgBtn} onClick={() => removeImage(idx)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {imagePreviews.length < imageLimit && (
                                    <label className={`${styles.mediaSlot} ${styles.mediaSlotEmpty}`}>
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*" 
                                            className={styles.fileInput} 
                                            onChange={handleImageChange} 
                                        />
                                        <span>+</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.stepHeader}>
                        <div className={styles.stepNumber}>3</div>
                        <h2>Location & Contact</h2>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Province</label>
                            <select className={styles.select} value={selectedProvinceCode} onChange={e => setSelectedProvinceCode(e.target.value)}>
                                {locations.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>City</label>
                            <input type="text" className={styles.input} value={city} onChange={e => setCity(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Contact Phone</label>
                            <input type="tel" className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Contact Email</label>
                            <input type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@example.com" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Visibility</label>
                            <label className={styles.checkboxOption}>
                                <input type="checkbox" checked={hidePhone} onChange={e => setHidePhone(e.target.checked)} />
                                <span className="text-sm">Hide phone number on listing</span>
                            </label>
                        </div>
                        <div className={styles.fullWidth}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className={styles.label}>Map Location</label>
                                <button type="button" className="text-xs text-blue-600 font-bold" onClick={handleGetCurrentLocation} disabled={isLocating}>
                                    {isLocating ? "📍 Locating..." : "📍 Use My Current Location"}
                                </button>
                            </div>
                            <div className={styles.mapPreviewWrapper}>
                                <LocationPicker coords={coords} setCoords={setCoords} onLocationSelect={(lat, lng) => fetchAddress(lat, lng)} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.stepHeader}>
                        <div className={styles.stepNumber}>4</div>
                        <h2>Boost Your Ad</h2>
                    </div>
                    <div className={styles.boostContent}>
                        <p className={styles.boostDescription}>
                            Select a premium plan to increase visibility. As an admin, these plans are applied without payment.
                        </p>
                        <div className={styles.planList}>
                            <div 
                                className={`${styles.planCard} ${!boostPlan ? styles.selected : ''}`}
                                onClick={() => setBoostPlan(null)}
                            >
                                <div className={styles.planInfo}>
                                    <h4 className={styles.planName}>Standard Ad</h4>
                                    <p className={styles.planDesc}>Free standard visibility</p>
                                </div>
                                <div className={styles.planPriceWrapper}>
                                    <span className={styles.planPrice}>$0</span>
                                </div>
                            </div>
                            
                            {premiumPlans.map((plan) => (
                                <div 
                                    key={plan.id}
                                    className={`${styles.planCard} ${boostPlan === plan.id ? styles.selected : ''}`}
                                    onClick={() => setBoostPlan(plan.id)}
                                >
                                    <div className={styles.planInfo}>
                                        <h4 className={styles.planName}>{plan.label}</h4>
                                        <div className={styles.planDesc} dangerouslySetInnerHTML={{ __html: plan.description || "" }} />
                                        <span className={styles.planDuration}>{plan.duration_days} Days</span>
                                    </div>
                                    <div className={styles.planPriceWrapper}>
                                        <span className={styles.planCurrency}>$</span>
                                        <span className={styles.planPrice}>{plan.price?.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-4 mt-8 pb-12 sticky bottom-4 bg-white/80 backdrop-blur p-4 rounded-xl border border-gray-100 shadow-lg z-50">
                    <button className={styles.btnSec} onClick={() => router.back()}>Discard Changes</button>
                    <button className={styles.btnPri} onClick={handlePublish} disabled={isPublishing}>
                        {isPublishing ? "Processing..." : (listingId ? "Update Listing (Admin)" : "Publish Listing (Admin)")}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <main className={styles.page}>
            <div className="container mx-auto max-w-4xl px-4">
                <div className={styles.header}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">High Privilege</span>
                    </div>
                    <h1>{listingId ? "Admin Editor: Edit" : "Admin Editor: Create"}</h1>
                </div>

                <div className={styles.formContainer}>
                    {isFetchingListing ? (
                        <div className={styles.loadingContainer}><div className={styles.loader}></div><p>Fetching listing data...</p></div>
                    ) : (
                        phase === "category" ? renderPhase1() : renderPhase2()
                    )}
                </div>
            </div>
        </main>
    );
}
