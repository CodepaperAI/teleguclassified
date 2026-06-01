"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./PostAd.module.css";
import { useAppContext } from "@/context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { useCallback } from "react";
import { getActiveCitiesByStateCode, LocationDto } from "@/lib/db/locations";
import { getUserListingCount, getUserPlanListingCount, getUserTotalListingCount } from "@/lib/db/listings";
import { checkHasAdminAccess, getProfile } from "@/lib/db/profile";
import { formatCurrency } from "@/lib/utils";

import dynamic from 'next/dynamic';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map...</div>
});

type Phase = "category" | "details" | "preview";

// We fetch cities dynamically from DB now

export default function PostAdPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PostAdContent />
        </Suspense>
    );
}

function PostAdContent() {
    const supabase = createClient();
    const router = useRouter();
    const { user, isLoadingUser, addListing, categories, locations, isLoadingCategories, showAlert, showToast, premiumPlans, monetizationPlans, isBlocked, blockFeatures, siteSettings } = useAppContext();

    const [isPublishing, setIsPublishing] = useState(false);
    const [isFetchingListing, setIsFetchingListing] = useState(false);

    const searchParams = useSearchParams();

    // Auth check
    useEffect(() => {
        if (!user && !isLoadingCategories) {
            router.push(`/login?returnTo=/post-ad`);
        }
    }, [user, isLoadingCategories, router]);

    const [isCheckingLimit, setIsCheckingLimit] = useState(false);

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

    // Function to get current location
    const handleGetCurrentLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newCoords = { lat: latitude, lng: longitude };
                    setCoords(newCoords);
                    fetchAddress(latitude, longitude);
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    showAlert("Error", "Could not get your location. Please check your browser permissions.");
                    setIsLocating(false);
                }
            );
        } else {
            showAlert("Error", "Geolocation is not supported by your browser.");
            setIsLocating(false);
        }
    };

    // Reverse geocoding using Nominatim (OpenStreetMap)
    const fetchAddress = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                setAddress(`${addr.house_number || ''} ${addr.road || ''}`.trim());
                setCity(addr.city || addr.town || addr.village || '');
                setPostalCode(addr.postcode || '');
            }
        } catch (error) {
            console.error("Error fetching address:", error);
        }
    };

    // Forward geocoding: Get coordinates from City, Province
    const fetchCoordinates = async (query: string) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setCoords({ lat: parseFloat(lat), lng: parseFloat(lon) });
            }
        } catch (error) {
            console.error("Error fetching coordinates:", error);
        }
    };



    const [initialBoostPlan, setInitialBoostPlan] = useState<string | null>(null);
    const [initialStatus, setInitialStatus] = useState<string | null>(null);
    const [initialListingFee, setInitialListingFee] = useState(0);
    const [boostPlan, setBoostPlan] = useState("");

    const boostPlans = [
        { id: "basic", label: "$7 for 7 days", price: 7, duration: 7 },
        { id: "standard", label: "$15 for 20 days", price: 15, duration: 20 },
        { id: "premium", label: "$25 for 30 days", price: 25, duration: 30 },
    ];

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

    // Job Specific States
    const [jobOfferedBy, setJobOfferedBy] = useState("individual");
    const [companyName, setCompanyName] = useState("");
    const [jobType, setJobType] = useState("");
    const [salaryFrom, setSalaryFrom] = useState("");
    const [salaryTo, setSalaryTo] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Event Specific States
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventStartTime, setEventStartTime] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventEndTime, setEventEndTime] = useState("");
    const [organizerName, setOrganizerName] = useState("");
    const [venueName, setVenueName] = useState("");
    const [hideEventLocation, setHideEventLocation] = useState(false);

    // Media States
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);
    const [listingFee, setListingFee] = useState(0);
    const [imageLimit, setImageLimit] = useState(10);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, []);

    const listingId = searchParams.get("id") || searchParams.get("edit");

    // Monetization Info
    const [monetizationMessage, setMonetizationMessage] = useState("");
    const [monetizationType, setMonetizationType] = useState<"info" | "warning" | "success">("info");

    // Fetch listing for edit mode
    useEffect(() => {
        // Wait for user loading
        if (listingId && user && !isLoadingUser) {
            const fetchListing = async () => {
                setIsFetchingListing(true);
                try {
                    const { data, error } = await supabase
                        .from('listings')
                        .select('*')
                        .eq('id', listingId)
                        .single();

                    if (data && !error) {
                        // Check ownership
                        if (data.user_id !== user.id) {
                            showAlert("Permission Denied", "You don't have permission to edit this listing.");
                            router.push("/dashboard");
                            return;
                        }

                        // Populate state
                        setPhase("details");
                        setSelectedCatId(data.category_id || "");
                        setSelectedSubCatId(data.sub_category_id || null);
                        setSelectedListingTypeId(data.listing_type_id || null);
                        setSelectedSubCatLabel(data.sub_category_label || "");
                        setSelectedSubItemLabel(data.sub_item_label || "");
                        setAdType(data.ad_type || "offering");
                        setForSaleBy(data.for_sale_by || "owner");
                        setItemCondition(data.item_condition || "");
                        setInitialBoostPlan(data.boost_plan || 'basic_listing');
                        setInitialStatus(data.status || null);
                        setInitialListingFee((data as any).listing_fee || 0);
                        setListingFee((data as any).listing_fee || 0);
                        setBoostPlan(data.boost_plan || 'basic_listing');
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
                        setBoostPlan(data.boost_plan || "");
                        setInitialBoostPlan(data.boost_plan || null);

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
                            setAdditionalOptions(attrs.additionalOptions || attrs.additional_options || []);
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
    }, [listingId, user, router]);

    // Reset fields when category changes
    useEffect(() => {
        if (!listingId) { // Only reset if not in edit mode (or we might want to reset if category is changed even in edit mode)
            setBedrooms("");
            setBathrooms("");
            setSqft("");
            setAcres("");
            setUnitType("");
            setAgreementType("");
            setMoveInDate("");
            setPetFriendly("");
            setFurnished("");
            setAppliances([]);
            setAirConditioning("");
            setOutdoorSpace([]);
            setSmoking("");
            setAccessibility([]);
            setUtilities([]);
            setWifiMore([]);
            setParking("");
            setTermAgreement([]);
            setAdditionalOptions([]);

            setItemCondition(""); // Reset condition
            setForSaleBy("owner"); // Reset for sale by
            setPriceAmount("");
            setPriceType("amount");
            setCoords(null);

            setJobOfferedBy("individual");
            setCompanyName("");
            setJobType("");
            setSalaryFrom("");
            setSalaryTo("");

            setOrganizerName("");
            setVenueName("");
            setEventStartDate("");
            setEventStartTime("");
            setEventEndDate("");
            setEventEndTime("");
            setForRentBy("owner");
        }
    }, [selectedCatId, listingId]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLevel, setModalLevel] = useState<"subCategory" | "subItem">("subCategory");


    // Sync city when province changes
    useEffect(() => {
        // If switching provinces, reset city to avoid invalid combinations
        // But keep Toronto if ON is default load
        if (selectedProvinceCode !== "ON") {
            setCity("");
            setIsOtherCity(false);
        }

        // Fetch dynamic cities for this province
        let isMounted = true;
        if (selectedProvinceCode) {
            getActiveCitiesByStateCode(selectedProvinceCode).then(data => {
                if (isMounted) setActiveCities(data);
            });
        } else {
            setActiveCities([]);
        }

        return () => { isMounted = false; };
    }, [selectedProvinceCode]);

    const isMonetizationActive = useMemo(() => {
        return siteSettings?.is_pricing_enabled !== false;
    }, [siteSettings]);

    const websiteFee = siteSettings?.website_fee || 4.95;


    const hstCalculation = useMemo(() => {
        if (!isMonetizationActive) return { subtotal: "0.00", hst: "0.00", total: "0.00" };

        const isNewBoost = boostPlan && boostPlan !== "" && boostPlan !== initialBoostPlan;
        const boostPrice = isNewBoost ? (premiumPlans.find(p => p.id === boostPlan)?.price || 0) : 0;
        const websitePrice = websiteUrlEnabled ? websiteFee : 0;
        const professionalJobFee = (selectedCatId === "jobs" && jobOfferedBy === "professional") ? 25.00 : 0;

        const subtotalValue = boostPrice + websitePrice + professionalJobFee + listingFee;
        const isHstEnabled = siteSettings?.is_hst_enabled || false;
        const hstValue = (isHstEnabled && subtotalValue > 0) ? subtotalValue * 0.13 : 0;
        const totalValue = subtotalValue + hstValue;

        return {
            subtotal: formatCurrency(subtotalValue),
            hst: formatCurrency(hstValue),
            total: formatCurrency(totalValue),
            totalValue
        };
    }, [isMonetizationActive, boostPlan, initialBoostPlan, websiteUrlEnabled, selectedCatId, jobOfferedBy, premiumPlans, websiteFee, listingFee, siteSettings?.is_hst_enabled]);

    const totalPrice = hstCalculation.totalValue;

    const currentCategory = useMemo(() =>
        categories.find(c => c.id === selectedCatId),
        [selectedCatId, categories]);

    const subCategories = currentCategory?.subCategories || [];
    const currentSubCategory = useMemo(() =>
        subCategories.find(sc => sc.label === selectedSubCatLabel),
        [subCategories, selectedSubCatLabel]);

    const subItems = currentSubCategory?.subItems || [];

    const isCategorySelectionComplete = useMemo(() => {
        if (!selectedCatId) return false;
        if (!selectedSubCatLabel) return false;
        if (subItems.length > 0 && !selectedSubItemLabel) return false;
        return true;
    }, [selectedCatId, selectedSubCatLabel, subItems, selectedSubItemLabel]);

    // Removal of automatic transition effect
    useEffect(() => {
        if (user) {
            setContactName(prev => prev || user.user_metadata?.full_name || "");
            setEmail(prev => prev || user.email || "");
        }
    }, [user]);

    // Reactively check monetization plan whenever selection changes
    useEffect(() => {
        const checkMonetization = async () => {
            if (!selectedCatId || !selectedSubCatLabel || !user) return;
            // If already active, we don't need to check limits again (ad is already published)
            if (listingId && initialStatus === 'active') return;

            setIsCheckingLimit(true);
            try {
                if (!siteSettings) return;

                if (siteSettings.is_pricing_enabled === false) {
                    setListingFee(0);
                    setImageLimit(10);
                    setMonetizationMessage("Create your new listing absolutely free for now");
                    setMonetizationType("success");
                    return;
                }

                const cat = categories.find(c => c.id === selectedCatId);
                const subCat = cat?.subCategories?.find(s => s.label === selectedSubCatLabel);

                // Determine the effective plan
                const planId = subCat?.monetization_plan_id || cat?.monetization_plan_id;
                const plan = monetizationPlans.find(p => p.id === planId);

                // 1. Check Global Free Limit first
                const globalFreeLimit = siteSettings.global_free_limit ?? 0;
                const totalListingCount = await getUserTotalListingCount(user.id);

                if (totalListingCount < globalFreeLimit) {
                    // Still within global free quota
                    setListingFee(0);
                    const remaining = globalFreeLimit - totalListingCount;
                    const freeImgLimit = siteSettings.global_free_image_limit ?? 5;
                    setImageLimit(freeImgLimit);
                    setMonetizationMessage(`You have <strong>${remaining} free listing${remaining !== 1 ? 's' : ''}</strong> remaining. (Max ${freeImgLimit} image${freeImgLimit !== 1 ? 's' : ''} per free listing)`);
                    setMonetizationType("success");
                    return;
                }

                // 2. Global quota exhausted, apply category/subcategory pricing
                // Note: Monetization plans no longer have free limits, they just provide pricing & image limits
                let nodePrice = subCat?.listing_price ?? cat?.listing_price ?? 0;
                if (nodePrice === 0 && plan?.listing_price) {
                    nodePrice = plan.listing_price;
                }

                setListingFee(nodePrice);
                const paidImgLimit = plan?.paid_image_limit ?? 10;
                setImageLimit(paidImgLimit);

                if (nodePrice > 0) {
                    setMonetizationMessage(`Your Free quota exhausted. This listing requires a one-time fee of <strong>${formatCurrency(nodePrice)}</strong>. (Max ${paidImgLimit} images included)`);
                    setMonetizationType("warning");
                } else {
                    setMonetizationMessage(`Unlimited free listings in this category. (Max ${paidImgLimit} images included)`);
                    setMonetizationType("info");
                }
            } catch (err) {
                console.error("Error checking monetization:", err);
            } finally {
                setIsCheckingLimit(false);
            }
        };

        checkMonetization();
    }, [selectedCatId, selectedSubCatLabel, selectedSubItemLabel, user, categories, monetizationPlans, listingId, siteSettings]);

    const handleAddTag = () => {
        if (!tagInput.trim()) return;

        // Split by comma, trim, filter empty, and remove duplicates
        const newTags = tagInput
            .split(",")
            .map(t => t.trim())
            .filter(t => t !== "" && !tags.includes(t));

        const totalTags = [...tags, ...newTags].slice(0, 5);
        setTags(totalTags);
        setTagInput("");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImagesCount = imagePreviews.length + files.length;

            if (totalImagesCount > imageLimit) {
                showAlert("Image Limit Reached", `Your current plan for this category allows a maximum of ${imageLimit} image${imageLimit !== 1 ? 's' : ''}. ${listingFee > 0 ? "You are on a paid listing." : "This is a free listing."}`);
                return;
            }

            const newBlobs = files.map(file => URL.createObjectURL(file));
            
            setSelectedImages(prev => [...prev, ...files]);
            setImagePreviews(prev => [...prev, ...newBlobs]);
        }
    };

    const removeImage = (index: number) => {
        const urlToRemove = imagePreviews[index];
        
        // Revoke blob URL if it's a local file
        if (urlToRemove.startsWith('blob:')) {
            URL.revokeObjectURL(urlToRemove);
            
            // Find index in selectedImages
            // We need to know how many blobs were before this one in the previews
            const blobsBefore = imagePreviews.slice(0, index).filter(url => url.startsWith('blob:')).length;
            setSelectedImages(prev => prev.filter((_, i) => i !== blobsBefore));
        } else {
            // It was an existing server URL
            setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));
        }

        // Remove from UI previews
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        for (const file of selectedImages) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user!.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('listings')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload error for file:", file.name, uploadError);
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('listings')
                .getPublicUrl(filePath);

            urls.push(publicUrl);
        }
        return urls;
    };

    const handlePublish = async () => {
        if (!user) {
            showAlert("Notice", "Please log in to post an ad.");
            return;
        }
        if (blockFeatures?.posting || (isBlocked && Object.keys(blockFeatures || {}).length === 0)) {
            showAlert("Account Restricted", "Your account has been blocked. You cannot post new ads. Please contact support for assistance.");
            return;
        }

        if (!selectedCatId) {
            showAlert("Notice", "Please select a category.");
            return;
        }
        if (!adTitle) {
            showAlert("Notice", "Please enter an ad title.");
            return;
        }

        setIsPublishing(true);

        try {
            // 0. Generate Unique Slug
            const { generateUniqueSlug } = await import("@/lib/db/listings");
            const slug = await generateUniqueSlug(adTitle, listingId || undefined);

            // 1. Upload new Images
            const newUploadedUrls = await uploadImages();
            const finalImageUrls = [...existingImageUrls, ...newUploadedUrls];

            // 2. Collect category-specific attributes
            const attributes: any = {};
            if (selectedCatId === "housing") {
                if (selectedSubCatLabel === "For Rent") {
                    attributes.for_rent_by = forRentBy;
                }
                if (bedrooms) attributes.bedrooms = bedrooms;
                if (bathrooms) attributes.bathrooms = bathrooms;
                if (sqft) attributes.sqft = sqft;
                if (acres) attributes.acres = acres;
                if (unitType) attributes.unitType = unitType;
                if (agreementType) attributes.agreementType = agreementType;
                if (moveInDate) attributes.moveInDate = moveInDate;
                if (petFriendly) attributes.petFriendly = petFriendly;
                if (furnished) attributes.furnished = furnished;
                if (appliances.length > 0) attributes.appliances = appliances;
                if (airConditioning) attributes.airConditioning = airConditioning;
                if (outdoorSpace.length > 0) attributes.outdoorSpace = outdoorSpace;
                if (smoking) attributes.smoking = smoking;
                if (accessibility.length > 0) attributes.accessibility = accessibility;
                if (utilities.length > 0) attributes.utilities = utilities;
                if (wifiMore.length > 0) attributes.wifiMore = wifiMore;
                if (parking) attributes.parking = parking;
                if (termAgreement.length > 0) attributes.termAgreement = termAgreement;
                if (additionalOptions.length > 0) attributes.additionalOptions = additionalOptions;
            } else if (selectedCatId === "jobs") {
                if (jobOfferedBy) attributes.job_offered_by = jobOfferedBy;
                if (companyName) attributes.company_name = companyName;
                if (jobType) attributes.job_type = jobType;
                if (salaryFrom) attributes.salary_from = salaryFrom;
                if (salaryTo) attributes.salary_to = salaryTo;
            } else if (selectedCatId === "events") {
                if (organizerName) attributes.organizer_name = organizerName;
                if (venueName) attributes.venue_name = venueName;
                if (eventStartDate) attributes.event_start_date = eventStartDate;
                if (eventStartTime) attributes.event_start_time = eventStartTime;
                if (eventEndDate) attributes.event_end_date = eventEndDate;
                if (eventEndTime) attributes.event_end_time = eventEndTime;
                if (hideEventLocation) attributes.hide_event_location = hideEventLocation;
            }

            if (selectedSubItemLabel === "Storage & Parking for Rent") {
                if (storageType) attributes.storage_type = storageType;
            }

            const listingData = {
                user_id: user.id,
                title: adTitle,
                slug: slug,
                description: description,
                price: priceType === "amount" ? (parseFloat(priceAmount) || 0) : null,
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
                city: city,
                postal_code: postalCode,
                province_code: selectedProvinceCode,
                address: address,
                tags: tags,
                latitude: coords?.lat || null,
                longitude: coords?.lng || null,
                images: finalImageUrls,
                youtube_video_url: youtubeVideo,
                website_url: websiteUrlEnabled ? websiteUrl : null,

                // Secure First: 
                // 1. If editing, preserve existing plan UNLESS switching to a free plan
                // 2. If new, only set plan if it's free. Paid plans are set via webhook.
                boost_plan: (boostPlan === 'free' || boostPlan === 'basic_listing') ? null : (premiumPlans.find(p => p.id === boostPlan) ? boostPlan : (listingId ? initialBoostPlan : null)),
                boost_expires_at: (() => {
                    if (boostPlan === 'free' || boostPlan === 'basic_listing') return null;
                    const selectedPlan = premiumPlans.find(p => p.id === boostPlan && p.price === 0);
                    if (selectedPlan) {
                        if (selectedPlan.duration_days === -1) {
                            return new Date('9999-12-31T23:59:59Z').toISOString();
                        }
                        const params = new Date();
                        params.setDate(params.getDate() + selectedPlan.duration_days);
                        return params.toISOString();
                    }
                    return undefined; // Don't change if not setting a new free plan
                })(),
                expires_at: (() => {
                    // Default expiration is 30 days from now
                    const date = new Date();
                    date.setDate(date.getDate() + 30);
                    return date.toISOString();
                })(),
                attributes: attributes,
                listing_fee: ((siteSettings && siteSettings.is_pricing_enabled === false) ? 0 : ((listingFee > 0 || initialListingFee > 0) ? (listingFee || initialListingFee) : 0)),
                status: ((siteSettings && siteSettings.is_pricing_enabled === false) ? 'active' : (
                    (listingFee > 0 || initialListingFee > 0) ||
                    (boostPlan && boostPlan !== "basic_listing" && boostPlan !== "free" && boostPlan !== initialBoostPlan && (premiumPlans.find(p => p.id === boostPlan)?.price || 0) > 0) ||
                    (initialStatus === 'payment_pending' && boostPlan !== "basic_listing" && boostPlan !== "free")
                ) ? 'payment_pending' : 'active')
            };

            let result;
            if (listingId) {
                // Update existing
                result = await supabase
                    .from('listings')
                    .update(listingData)
                    .eq('id', listingId)
                    .select()
                    .single();

                // Delete orphaned images that were removed during this edit
                if (initialImageUrls.length > 0) {
                    const imagesToDelete = initialImageUrls.filter(url => !finalImageUrls.includes(url));
                    if (imagesToDelete.length > 0) {
                        const imagePaths = imagesToDelete
                            .filter((url: string) => url.includes('supabase.co') && url.includes('/public/listings/'))
                            .map((url: string) => {
                                const parts = url.split('/public/listings/');
                                return parts.length > 1 ? parts[1] : null;
                            })
                            .filter((path: string | null): path is string => path !== null);

                        if (imagePaths.length > 0) {
                            const { error: storageError } = await supabase.storage
                                .from('listings')
                                .remove(imagePaths);
                            if (storageError) {
                                console.error("Error deleting removed images from storage:", storageError);
                            }
                        }
                    }
                }
            } else {
                // Insert new
                result = await supabase
                    .from('listings')
                    .insert(listingData)
                    .select()
                    .single();
            }

            const { data, error } = result;

            if (error) throw error;

            // Also add to local state if needed
            addListing({
                ...listingData,
                id: data.id,
                price: priceType === "amount" ? `$${(parseFloat(priceAmount) || 0).toLocaleString()}` : priceType,
                time: listingId ? "Updated just now" : "Just now",
                image: finalImageUrls[0] || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
                location: `${city}, ${selectedProvinceCode}`,
                category: currentCategory?.label || "Other",
                subCategory: selectedSubCatLabel,
                subItem: selectedSubItemLabel,
                actionType: "Contact Seller"
            } as any);

            // Secure First: Check if payment is needed
            const isNewBoost = boostPlan && boostPlan !== "basic_listing" && boostPlan !== "free" && boostPlan !== initialBoostPlan;
            const boostPrice = isNewBoost ? (premiumPlans.find(p => p.id === boostPlan)?.price || 0) : 0;
            const hasWebsiteFee = websiteUrlEnabled && websiteFee > 0;

            const needsPayment = (siteSettings && siteSettings.is_pricing_enabled === false)
                ? false
                : (listingFee > 0 || boostPrice > 0 || hasWebsiteFee);

            if (needsPayment) {
                console.log("Payment required, automatically preparing checkout for listing:", data.id);
                showToast("Ad saved! Redirecting to secure payment checkout...", "info");

                // Determine more descriptive purchase type
                let purchaseType = 'listing_and_boost'; // default
                if (listingFee > 0 && boostPrice > 0 && hasWebsiteFee) purchaseType = 'listing_boost_website';
                else if (listingFee > 0 && boostPrice > 0) purchaseType = 'listing_and_boost';
                else if (listingFee > 0 && hasWebsiteFee) purchaseType = 'listing_and_website';
                else if (boostPrice > 0 && hasWebsiteFee) purchaseType = 'boost_and_website';
                else if (listingFee > 0) purchaseType = 'listing_fee';
                else if (boostPrice > 0) purchaseType = 'boost';
                else if (hasWebsiteFee) purchaseType = 'website_fee';

                try {
                    const response = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            listingId: data.id,
                            planType: isNewBoost ? boostPlan : 'basic_listing',
                            listingFee: listingFee > 0 ? listingFee : undefined,
                            includeWebsite: websiteUrlEnabled,
                            websiteFee: hasWebsiteFee ? websiteFee : undefined,
                            professionalJobFee: (selectedCatId === "jobs" && jobOfferedBy === "professional") ? 25.0 : undefined,
                            purchaseType
                        }),
                    });

                    const checkoutData = await response.json();
                    if (checkoutData.url) {
                        window.location.href = checkoutData.url;
                        return; // Handle redirect
                    } else {
                        throw new Error(checkoutData.error || 'Failed to initiate payment');
                    }
                } catch (paymentErr: any) {
                    console.error("Payment initiation failed:", paymentErr);
                    showAlert("Notice", "Ad saved, but we couldn't start the payment process: " + paymentErr.message);
                }
            } else {
                router.push('/my-ads');
            }
        } catch (error: any) {
            console.error("Error publishing ad:", error);
            let userMessage = error.message;

            // Specialized hint for common Supabase schema cache issues
            if (error.message?.includes("column") && error.message?.includes("not found")) {
                userMessage += "\n\nTip: If you recently added this column, you may need to wait a few seconds or refresh the Supabase schema cache.";
            }

            showAlert("Error", "Failed to publish ad: " + userMessage);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleContinueToDetails = async () => {
        if (!user) {
            router.push(`/login?returnTo=/post-ad`);
            return;
        }

        // If editing, they can proceed
        if (listingId) {
            setPhase("details");
            return;
        }

        // Pricing check
        if (siteSettings?.is_pricing_enabled) {
            setIsCheckingLimit(true);
            try {
                // Determine the applicable pricing (Match useEffect logic)
                const cat = categories.find(c => c.id === selectedCatId);
                const subCat = cat?.subCategories?.find(s => s.label === selectedSubCatLabel);
                const planId = subCat?.monetization_plan_id || cat?.monetization_plan_id;
                const plan = monetizationPlans.find(p => p.id === planId);

                // 1. Check Global Free Limit first
                const globalFreeLimit = siteSettings.global_free_limit ?? 0;
                const totalListingCount = await getUserTotalListingCount(user.id);

                if (totalListingCount < globalFreeLimit) {
                    setListingFee(0);
                    setImageLimit(siteSettings.global_free_image_limit ?? 5);
                } else {
                    // 2. Global quota exhausted, apply category/subcategory pricing
                    let nodePrice = subCat?.listing_price ?? cat?.listing_price ?? 0;
                    if (nodePrice === 0 && plan?.listing_price) {
                        nodePrice = plan.listing_price;
                    }

                    setListingFee(nodePrice);
                    setImageLimit(plan?.paid_image_limit ?? 10);
                }

                setPhase("details");
                return;
            } catch (err) {
                console.error("Error checking listing limit:", err);
            } finally {
                setIsCheckingLimit(false);
            }
        }

        setPhase("details");
    };


    const renderMonetizationBanner = () => {
        if (!monetizationMessage) return null;

        return (
            <div className={`${styles.monetizationBanner} ${monetizationType === 'warning' ? styles.monetizationWarning : monetizationType === 'success' ? styles.monetizationSuccess : styles.monetizationInfo}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span className={styles.monetizationIcon}>
                        {monetizationType === 'warning' ? '⚠️' : monetizationType === 'success' ? '✅' : 'ℹ️'}
                    </span>
                    <p className={styles.monetizationText} dangerouslySetInnerHTML={{ __html: monetizationMessage }} />
                </div>
            </div>
        );
    };

    const renderPhase1 = () => (
        <section className={styles.card}>
            <div className={styles.stepHeader}>
                <div className={styles.stepNumber}>1</div>
                <h2>Select Category</h2>
            </div>

            {isLoadingCategories ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.loader}></div>
                    <p>Loading categories...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className={styles.emptyCategories}>
                    <p>No categories found in database.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button onClick={() => window.location.reload()} className={styles.btnSec}>
                            Retry
                        </button>
                        <a href="/api/migrate" className={styles.btnSec} target="_blank" rel="noopener noreferrer">
                            Run Migration
                        </a>
                    </div>
                </div>
            ) : (
                <div className={styles.categoryGrid}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`${styles.catBtn} ${selectedCatId === cat.id ? styles.catBtnActive : ""}`}
                            onClick={() => {
                                setSelectedCatId(cat.id);
                                setSelectedSubCatLabel("");
                                setSelectedSubItemLabel("");
                                setSelectedSubCatId(null);
                                setModalLevel("subCategory");
                                setIsModalOpen(true);
                            }}
                        >
                            <span className={styles.catIcon}>{cat.icon}</span>
                            <span className={styles.catLabel}>{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {modalLevel === "subItem" && (
                                    <button className={styles.backBtn} onClick={() => setModalLevel("subCategory")}>
                                        ←
                                    </button>
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
                                        setSelectedSubCatId(null);
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
                                                    if (sub.subItems && sub.subItems.length > 0) {
                                                        setModalLevel("subItem");
                                                    } else {
                                                        setIsModalOpen(false);
                                                    }
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
                                        <div
                                            key={idx}
                                            className={styles.modalItem}
                                            onClick={() => {
                                                setSelectedSubItemLabel(item);
                                                setIsModalOpen(false);
                                            }}
                                        >
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedCatId && !isModalOpen && selectedSubCatLabel && (
                <div className={styles.selectionSummary}>
                    <div className={styles.selectionInfo}>
                        <span className={styles.selectionLabel}>Selected:</span>
                        <strong className={styles.selectionText}>{currentCategory?.label} › {selectedSubCatLabel} {selectedSubItemLabel ? `› ${selectedSubItemLabel}` : ""}</strong>
                    </div>
                    <div className={styles.selectionActions}>
                        <button className={styles.changeBtn} onClick={() => setIsModalOpen(true)}>Change</button>
                        {isCategorySelectionComplete && (
                            <button
                                className={styles.continueBtn}
                                onClick={handleContinueToDetails}
                                disabled={isCheckingLimit}
                            >
                                {isCheckingLimit ? "Checking..." : "Continue →"}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );

    const renderPhase2 = () => {
        const isLandForSale = selectedCatId === "housing" && selectedSubItemLabel === "Land for Sale";
        const isRoomRental = selectedCatId === "housing" && selectedSubItemLabel === "Room Rentals & Roommates";
        const isShortTermRental = selectedCatId === "housing" && selectedSubItemLabel === "Short Term Rentals";
        const isStorageParking = selectedCatId === "housing" && selectedSubItemLabel === "Storage & Parking for Rent";
        const isCommercial = selectedCatId === "housing" && selectedSubItemLabel === "Commercial & Office Space for Rent";
        const isTailoredRental = isRoomRental || isShortTermRental || isStorageParking || isCommercial;

        return (
            <div className={styles.detailsLayout}>
                <div className={styles.mainForm}>
                    <section className={styles.card}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>1</div>
                            <h2>Ad Details</h2>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <div className={styles.phase2Summary}>
                                    <div className={styles.phase2Info}>
                                        <strong>Category:</strong> {currentCategory?.label} &gt; {selectedSubCatLabel} {selectedSubItemLabel && `> ${selectedSubItemLabel}`}
                                    </div>
                                    <button className={styles.phase2ChangeBtn} onClick={() => setPhase("category")}>Change category</button>
                                </div>
                            </div>

                            {selectedCatId !== "jobs" && selectedCatId !== "events" && (
                                <div className={`${styles.formGroup} ${isTailoredRental ? styles.fullWidth : ''}`}>
                                    <label className={styles.label}>Ad Type</label>
                                    <div className={styles.radioGroup}>
                                        <label className={styles.radioOption}>
                                            <input type="radio" name="adType" value="offering" checked={adType === "offering"} onChange={() => setAdType("offering")} className={styles.radioInput} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{isTailoredRental ? "I am offering" : "I'm offering"} {isTailoredRental && <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'inline' }}>- You are offering {isRoomRental ? "a room for rent" : isShortTermRental ? "a short term rental" : isCommercial ? "commercial or office space" : "storage or a parking spot"}</span>}</span>
                                            </div>
                                        </label>
                                        <label className={styles.radioOption}>
                                            <input type="radio" name="adType" value="wanted" checked={adType === "wanted"} onChange={() => setAdType("wanted")} className={styles.radioInput} />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{isTailoredRental ? "I want" : "I want to find"} {isTailoredRental && <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'inline' }}>- You are looking for {isRoomRental ? "a room to rent" : isShortTermRental ? "a short term rental" : isCommercial ? "commercial or office space" : "storage or a parking spot"}</span>}</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {isTailoredRental && (
                                <>
                                    {(isShortTermRental || isStorageParking || isCommercial || isRoomRental) && (
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>For Rent By</label>
                                            <div className={styles.radioGroup}>
                                                <label className={styles.radioOption}>
                                                    <input type="radio" name="forRentBy" value="owner" checked={forRentBy === "owner"} onChange={() => setForRentBy("owner")} className={styles.radioInput} />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>Owner {(isShortTermRental || isCommercial || isRoomRental) && <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'inline' }}>- There is a limit of 1 free listings at a time in this category. †</span>}</span>
                                                    </div>
                                                </label>
                                                <label className={styles.radioOption}>
                                                    <input type="radio" name="forRentBy" value="professional" checked={forRentBy === "professional"} onChange={() => setForRentBy("professional")} className={styles.radioInput} />
                                                    <span>Professional</span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {isStorageParking && (
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>More Info:</label>
                                            <div className={styles.radioGroup}>
                                                {["Parking", "Storage"].map(opt => (
                                                    <label key={opt} className={styles.radioOption}>
                                                        <input type="radio" name="storageType" value={opt.toLowerCase()} checked={storageType === opt.toLowerCase()} onChange={() => setStorageType(opt.toLowerCase())} className={styles.radioInput} />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {isCommercial && (
                                        <>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Size (sqft): <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <input type="text" className={styles.input} placeholder="" value={sqft} onChange={(e) => setSqft(e.target.value)} />
                                            </div>

                                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                                <label className={styles.label}>Furnished: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <div className={styles.radioGroupHorizontal}>
                                                    {["Yes", "No"].map(opt => (
                                                        <label key={opt} className={styles.radioOption}>
                                                            <input type="radio" value={opt} checked={furnished === opt} onChange={() => setFurnished(opt)} />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {isShortTermRental && (
                                        <>
                                            <div className={`${styles.formGroup} ${isShortTermRental ? '' : styles.fullWidth}`}>
                                                <label className={styles.label}>Bedrooms: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <select className={styles.select} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                                                    <option value="">- Select -</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5+">5+</option>
                                                </select>
                                            </div>

                                            <div className={`${styles.formGroup} ${isShortTermRental ? '' : styles.fullWidth}`}>
                                                <label className={styles.label}>Bathrooms: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <select className={styles.select} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                                                    <option value="">- Select -</option>
                                                    <option value="1">1</option>
                                                    <option value="1.5">1.5</option>
                                                    <option value="2">2</option>
                                                    <option value="2.5">2.5</option>
                                                    <option value="3+">3+</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {(isRoomRental || isShortTermRental) && (
                                        <>
                                            <div className={`${styles.formGroup} ${isShortTermRental ? '' : styles.fullWidth}`}>
                                                <label className={styles.label}>Furnished: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <div className={styles.radioGroupHorizontal}>
                                                    {["Yes", "No"].map(opt => (
                                                        <label key={opt} className={styles.radioOption}>
                                                            <input type="radio" value={opt} checked={furnished === opt} onChange={() => setFurnished(opt)} />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={`${styles.formGroup} ${isShortTermRental ? '' : styles.fullWidth}`}>
                                                <label className={styles.label}>Pet Friendly: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span></label>
                                                <div className={styles.radioGroupHorizontal}>
                                                    {["Yes", "No", "Limited"].map(opt => (
                                                        <label key={opt} className={styles.radioOption}>
                                                            <input type="radio" value={opt} checked={petFriendly === opt} onChange={() => setPetFriendly(opt)} />
                                                            <span>{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {isShortTermRental && (
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>
                                                Additional Options: <span style={{ fontWeight: 'normal', color: '#64748b' }}>(optional)</span>
                                            </label>
                                            <div className={styles.checkboxGroupVertical} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {["Online Application", "Video Chat", "Video Walkthrough"].map((opt) => (
                                                    <label key={opt} className={styles.checkboxOption}>
                                                        <input
                                                            type="checkbox"
                                                            checked={additionalOptions.includes(opt)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setAdditionalOptions([...additionalOptions, opt]);
                                                                else setAdditionalOptions(additionalOptions.filter(o => o !== opt));
                                                            }}
                                                        />
                                                        <span>{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedCatId !== "services" && selectedCatId !== "jobs" && selectedCatId !== "events" && !isTailoredRental && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        {selectedCatId === "housing" && selectedSubCatLabel === "For Rent" ? "For Rent By" : "For Sale By"}
                                    </label>
                                    <div className={styles.radioGroup}>
                                        <label className={styles.radioOption}>
                                            <input 
                                                type="radio" 
                                                name="byGroup" 
                                                value="owner" 
                                                checked={(selectedCatId === "housing" && selectedSubCatLabel === "For Rent") ? forRentBy === "owner" : forSaleBy === "owner"} 
                                                onChange={() => (selectedCatId === "housing" && selectedSubCatLabel === "For Rent") ? setForRentBy("owner") : setForSaleBy("owner")} 
                                                className={styles.radioInput} 
                                            />
                                            <span>Owner</span>
                                        </label>
                                        <label className={styles.radioOption}>
                                            <input 
                                                type="radio" 
                                                name="byGroup" 
                                                value="professional" 
                                                checked={(selectedCatId === "housing" && selectedSubCatLabel === "For Rent") ? forRentBy === "professional" : forSaleBy === "business"} 
                                                onChange={() => (selectedCatId === "housing" && selectedSubCatLabel === "For Rent") ? setForRentBy("professional") : setForSaleBy("business")} 
                                                className={styles.radioInput} 
                                            />
                                            <span>{(selectedCatId === "housing" && selectedSubCatLabel === "For Rent") ? "Professional" : (selectedCatId === "housing" ? "Professional" : "Business")}</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {selectedCatId !== "housing" && selectedCatId !== "services" && selectedCatId !== "jobs" && selectedCatId !== "events" && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Condition</label>
                                    <select className={styles.select} value={itemCondition} onChange={(e) => setItemCondition(e.target.value)}>
                                        <option value="">- Select -</option>
                                        <option value="new">New</option>
                                        <option value="used_like_new">Used - Like New</option>
                                        <option value="used_good">Used - Good</option>
                                        <option value="used_fair">Used - Fair</option>
                                    </select>
                                </div>
                            )}

                            {selectedCatId === "housing" && !isLandForSale && !isTailoredRental && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Bedrooms</label>
                                        <select className={styles.select} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                                            <option value="">- Select -</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5+">5+</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Bathrooms</label>
                                        <select className={styles.select} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                                            <option value="">- Select -</option>
                                            <option value="1">1</option>
                                            <option value="1.5">1.5</option>
                                            <option value="2">2</option>
                                            <option value="2.5">2.5</option>
                                            <option value="3+">3+</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Size (sqft)</label>
                                        <input type="text" className={styles.input} placeholder="Optional" value={sqft} onChange={(e) => setSqft(e.target.value)} />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Unit Type</label>
                                        <select className={styles.select} value={unitType} onChange={(e) => setUnitType(e.target.value)}>
                                            <option value="">- Select -</option>
                                            {["Apartment", "Basement", "Condo", "House", "Townhouse", "Duplex/Triplex", "Loft"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Agreement Type</label>
                                        <select className={styles.select} value={agreementType} onChange={(e) => setAgreementType(e.target.value)}>
                                            <option value="">- Select -</option>
                                            {["Month-to-month", "1 Year", "Fixed Term"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Move-in Date</label>
                                        <input type="date" className={styles.input} value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
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
                                        <select className={styles.select} value={airConditioning} onChange={(e) => setAirConditioning(e.target.value)}>
                                            <option value="">- Select -</option>
                                            {["Central", "Window Unit", "None"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Parking</label>
                                        <select className={styles.select} value={parking} onChange={(e) => setParking(e.target.value)}>
                                            <option value="">- Select -</option>
                                            {["Included", "Available for Fee", "None"].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
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
                                        <label className={styles.label}>Appliances</label>
                                        <div className={styles.checkboxGroupHorizontal}>
                                            {["Fridge", "Stove", "Washer", "Dryer", "Dishwasher"].map((app) => (
                                                <label key={app} className={styles.checkboxOption}>
                                                    <input type="checkbox" checked={appliances.includes(app)} onChange={(e) => e.target.checked ? setAppliances([...appliances, app]) : setAppliances(appliances.filter(a => a !== app))} />
                                                    <span>{app}</span>
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
                                        <label className={styles.label}>
                                            Additional Options (optional)
                                        </label>
                                        <div className={styles.checkboxGroupHorizontal}>
                                            {["Online Application", "Video Chat", "Video Walkthrough"].map((opt) => (
                                                <label key={opt} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.checkboxInput}
                                                        checked={additionalOptions.includes(opt)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setAdditionalOptions([...additionalOptions, opt]);
                                                            else setAdditionalOptions(additionalOptions.filter(o => o !== opt));
                                                        }}
                                                    />
                                                    <span>{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {isLandForSale && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Size (acres)</label>
                                    <input type="text" className={styles.input} placeholder="(optional)" value={acres} onChange={(e) => setAcres(e.target.value)} />
                                </div>
                            )}

                            {selectedCatId === "jobs" && (
                                <>
                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.label}>Job Offered By</label>
                                        <div className={styles.radioGroup}>
                                            <label className={styles.radioOption}>
                                                <input type="radio" name="jobSaleBy" value="individual" checked={jobOfferedBy === "individual"} onChange={() => setJobOfferedBy("individual")} className={styles.radioInput} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong>Individual - FREE (max 1 standard ad at a time) †</strong>
                                                </div>
                                            </label>
                                            <label className={styles.radioOption}>
                                                <input type="radio" name="jobSaleBy" value="professional" checked={jobOfferedBy === "professional"} onChange={() => setJobOfferedBy("professional")} className={styles.radioInput} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong>Professional Employer</strong>
                                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>A listing fee applies in this category. Includes company logos, taglines & company listing page.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                        <label className={styles.label}>Company (optional)</label>
                                        <input type="text" className={styles.input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Job Type</label>
                                        <select className={styles.select} value={jobType} onChange={(e) => setJobType(e.target.value)}>
                                            <option value="">- Select -</option>
                                            <option value="full-time">Full-time</option>
                                            <option value="part-time">Part-time</option>
                                            <option value="contract">Contract</option>
                                            <option value="temporary">Temporary</option>
                                            <option value="internship">Internship</option>
                                            <option value="volunteer">Volunteer</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>Salary From</label>
                                            <div className={styles.priceInputWrapper}>
                                                <span className={styles.currencySymbol}>$</span>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    value={salaryFrom}
                                                    onChange={(e) => setSalaryFrom(e.target.value)}
                                                    placeholder="Min"
                                                />
                                            </div>
                                        </div>

                                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                            <label className={styles.label}>Salary To</label>
                                            <div className={styles.priceInputWrapper}>
                                                <span className={styles.currencySymbol}>$</span>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    value={salaryTo}
                                                    onChange={(e) => setSalaryTo(e.target.value)}
                                                    placeholder="Max"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedCatId === "events" && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Event Start Date *</label>
                                            <input
                                                type="date"
                                                className={styles.input}
                                                value={eventStartDate}
                                                onChange={(e) => setEventStartDate(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Start Time *</label>
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={eventStartTime}
                                                onChange={(e) => setEventStartTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Event End Date *</label>
                                            <input
                                                type="date"
                                                className={styles.input}
                                                value={eventEndDate}
                                                onChange={(e) => setEventEndDate(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>End Time *</label>
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={eventEndTime}
                                                onChange={(e) => setEventEndTime(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Venue Name *</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="e.g. Community Center, Hall A"
                                            value={venueName}
                                            onChange={(e) => setVenueName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Organizer Name *</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Enter organizer name"
                                            value={organizerName}
                                            onChange={(e) => setOrganizerName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Ad title</label>
                                <input type="text" className={styles.input} value={adTitle} onChange={(e) => setAdTitle(e.target.value)} />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Description</label>
                                <textarea className={styles.textarea} style={{ minHeight: '150px' }} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Tags (optional)</label>
                                <div className={styles.tagInputWrapper}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Enter tags (e.g. car, sedan, cheap)"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.addTagBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddTag();
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                                <span className={styles.instructionText}>
                                    Tip: Put comma between tags and press Add.
                                </span>
                                <div className={styles.tagList}>
                                    {tags.map((tag, index) => (
                                        <div key={index} className={styles.tagChip}>
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                className={styles.removeTagBtn}
                                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <span className={styles.inputSubtext}>Add up to 5 tags to help buyers find your ad.</span>
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>2</div>
                            <h2>Media</h2>
                        </div>
                        <div className={styles.mediaHelpText}>
                            Include pictures with different angles and details. You can upload a maximum of {imageLimit} photos.
                        </div>
                        <div className={styles.mediaGrid}>
                            {imagePreviews.map((url, idx) => (
                                <div key={idx} className={styles.mediaSlot}>
                                    <img src={url} alt={`Preview ${idx}`} className={styles.previewImg} />
                                    <button className={styles.removeImgBtn} onClick={() => removeImage(idx)}>
                                        <img src="/remove-image-icon.png" alt="Remove" className={styles.removeIcon} />
                                    </button>
                                </div>
                            ))}
                            {imagePreviews.length < imageLimit && (
                                <label className={`${styles.mediaSlot} ${styles.mediaSlotEmpty}`}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '1.5rem', color: '#cbd5e1' }}>+</span>
                                </label>
                            )}
                        </div>
                        <button
                            className={styles.promoMainBtn}
                            style={{ width: 'auto', padding: '10px 24px', marginTop: '1.5rem' }}
                            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                        >
                            Select Images
                        </button>

                        <div className={styles.mediaExtraFields}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>YouTube Video (optional)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Example: http://www.youtube.com/watch?v=your-video-id"
                                    value={youtubeVideo}
                                    onChange={(e) => setYoutubeVideo(e.target.value)}
                                />
                            </div>


                            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                                <label className={styles.checkboxOption}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkboxInput}
                                        checked={websiteUrlEnabled}
                                        onChange={(e) => setWebsiteUrlEnabled(e.target.checked)}
                                    />
                                    <span>Link to your website ${isMonetizationActive ? `($${websiteFee.toFixed(2)})` : "(FREE)"}</span>
                                </label>
                                {websiteUrlEnabled && (
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Enter your website URL"
                                        style={{ marginTop: '8px' }}
                                        value={websiteUrl}
                                        onChange={(e) => setWebsiteUrl(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>3</div>
                            <h2>{selectedCatId === "events" ? "Ticket Price" : "Price"}</h2>
                        </div>
                        <div className={styles.priceOptions}>
                            <label className={styles.radioOption}>
                                <input type="radio" name="price" value="amount" checked={priceType === "amount"} onChange={() => setPriceType("amount")} />
                                <span className={styles.priceInputWrapper}>
                                    <span className={styles.currencySymbol}>$</span>
                                    <input type="text" className={styles.input} style={{ width: '150px' }} disabled={priceType !== "amount"} value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} />
                                </span>
                            </label>
                            <label className={styles.radioOption}>
                                <input type="radio" name="price" value="contact" checked={priceType === "contact"} onChange={() => setPriceType("contact")} />
                                <span>Please Contact</span>
                            </label>
                            <label className={styles.radioOption}>
                                <input type="radio" name="price" value="swap" checked={priceType === "swap"} onChange={() => setPriceType("swap")} />
                                <span>Swap/Trade</span>
                            </label>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.stepHeader}>
                            <div className={styles.stepNumber}>4</div>
                            <h2>Location & Contact</h2>
                        </div>

                        <div className={styles.locationContactGrid}>
                            {/* Left Column: Location */}
                            <div className={styles.formColumn}>
                                <h3 className={styles.columnTitle}>Location</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Province/State</label>
                                    <select
                                        className={styles.select}
                                        value={selectedProvinceCode}
                                        onChange={(e) => {
                                            const newProv = e.target.value;
                                            setSelectedProvinceCode(newProv);
                                            // Auto-center map if city is already selected
                                            if (city && city !== "other") {
                                                fetchCoordinates(`${city}, ${newProv}, Canada`);
                                            }
                                        }}
                                    >
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.code}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>City</label>
                                    <div className={styles.locationInputWrapper}>
                                        <span className={styles.locationIcon}>📍</span>
                                        <select
                                            className={styles.select}
                                            value={isOtherCity ? "other" : city}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "other") {
                                                    setIsOtherCity(true);
                                                    setCity("");
                                                } else {
                                                    setIsOtherCity(false);
                                                    setCity(val);
                                                    // Auto-center map
                                                    fetchCoordinates(`${val}, ${selectedProvinceCode}, Canada`);
                                                }
                                            }}
                                        >
                                            <option value="">Select City</option>
                                            {activeCities.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                            <option value="other">Other / Not Listed</option>
                                        </select>
                                    </div>
                                    {isOtherCity && (
                                        <input
                                            type="text"
                                            className={`${styles.input} ${styles.mt2}`}
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            onBlur={() => {
                                                if (city) {
                                                    fetchCoordinates(`${city}, ${selectedProvinceCode}, Canada`);
                                                }
                                            }}
                                            placeholder="Enter your city"
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Address</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Enter street address"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Postal Code</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        placeholder="A1B 2C3"
                                    />
                                </div>

                                {selectedCatId === "events" && (
                                    <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                        <label className={styles.checkboxOption}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkboxInput}
                                                checked={hideEventLocation}
                                                onChange={(e) => setHideEventLocation(e.target.checked)}
                                            />
                                            <span>Hide exact location (show only city)</span>
                                        </label>
                                    </div>
                                )}

                                {selectedCatId !== "services" && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Location</label>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <button
                                                    type="button"
                                                    className={styles.btnSec}
                                                    onClick={handleGetCurrentLocation}
                                                    disabled={isLocating}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    {isLocating ? 'Locating...' : '📍 Use My Current Location'}
                                                </button>
                                            </div>

                                            <div className={styles.mapPreviewWrapper} style={{ height: '300px', cursor: 'pointer' }}>
                                                <LocationPicker
                                                    coords={coords}
                                                    setCoords={setCoords}
                                                    onLocationSelect={(lat, lng) => fetchAddress(lat, lng)}
                                                />
                                            </div>
                                            {coords && (
                                                <p className={styles.coordsLabel} style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                    Drag the marker to pinpoint exact location. Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                            </div>

                            <div className={styles.verticalDivider}></div>

                            <div className={styles.formColumn}>
                                <h3 className={styles.columnTitle}>Contact Info</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contact Name</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Email</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <span className={styles.inputSubtext}>Your email address will not be shared with others.</span>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Phone Number</label>
                                    <input
                                        type="tel"
                                        className={styles.input}
                                        placeholder="(555) 000-0000"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    <span className={styles.inputSubtext}>Your phone number will show up on your Ad.</span>
                                </div>
                                <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                                    <label className={styles.checkboxOption}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkboxInput}
                                            checked={hidePhone}
                                            onChange={(e) => setHidePhone(e.target.checked)}
                                        />
                                        <span>Hide phone number on listing</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {
                        !isStorageParking && siteSettings?.is_pricing_enabled !== false && (
                            <section className={`${styles.card} ${styles.boostCard}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>5</div>
                                    <div className={styles.boostHeaderInfo}>
                                        <h2>Boost Your Ad</h2>
                                    </div>
                                </div>
                                <div className={styles.boostContent}>
                                    <p className={styles.boostDescription}>
                                        Get up to 10x more views by boosting your ad. Select a plan that fits your needs.
                                    </p>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Select a Boost Plan</label>
                                        <div className={styles.planList}>


                                            {/* Static Free Plan */}
                                            <div
                                                className={`${styles.planCard} ${(boostPlan === 'basic_listing' || (!boostPlan && !listingId)) ? styles.selected : ''}`}
                                                onClick={() => setBoostPlan('basic_listing')}
                                                style={{ position: 'relative' }}
                                            >
                                                <div className={styles.planInfo}>
                                                    <h3 className={styles.planName}>Free Plan</h3>
                                                    <p className={styles.planDesc}>Standard visibility</p>
                                                    <span className={styles.planDuration}>
                                                        Always Free
                                                    </span>
                                                </div>
                                                <div className={styles.planPriceWrapper}>
                                                    <div className={styles.planPrice}>
                                                        <span className={styles.planCurrency}>$</span>
                                                        0
                                                    </div>
                                                </div>
                                            </div>

                                            {premiumPlans.map((plan) => (
                                                <div
                                                    key={plan.id}
                                                    className={`${styles.planCard} ${boostPlan === plan.id ? styles.selected : ''}`}
                                                    onClick={() => setBoostPlan(plan.id)}
                                                    style={{ position: 'relative' }}
                                                >
                                                    {plan.is_recommended && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            top: '-10px',
                                                            right: '10px',
                                                            background: '#f59e0b',
                                                            color: 'white',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'bold',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}>
                                                            Recommended
                                                        </span>
                                                    )}
                                                    <div className={styles.planInfo}>
                                                        <h3 className={styles.planName}>{plan.label}</h3>
                                                        <p className={styles.planDesc}>{plan.description || "Boost your ad visibility"}</p>
                                                        <span className={styles.planDuration}>
                                                            {plan.duration_days === -1 ? "Standard free listing" : `${plan.duration_days} Days Active`}
                                                        </span>
                                                    </div>
                                                    <div className={styles.planPriceWrapper}>
                                                        <div className={styles.planPrice}>
                                                            <span className={styles.planCurrency}>$</span>
                                                            {plan.price?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {boostPlan && (
                                        <div className={styles.boostValueProp}>
                                            <div className={styles.valueItem}>
                                                <span className={styles.valueIcon}>✓</span>
                                                <span>Featured placement on top of results</span>
                                            </div>
                                            <div className={styles.valueItem}>
                                                <span className={styles.valueIcon}>✓</span>
                                                <span>High visibility badge</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )
                    }

                    {
                        selectedCatId === "jobs" && (
                            <>
                                <section className={styles.card} style={{ borderLeft: '4px solid #ef4444' }}>
                                    <div className={styles.stepHeader} style={{ marginBottom: '1rem', borderBottom: 'none' }}>
                                        <h2 style={{ fontSize: '1.1rem', color: '#1e293b' }}>Canada Telugu Classifieds Policies</h2>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}>
                                        <p style={{ marginBottom: '1rem' }}>The following content is prohibited from Canada Telugu Classifieds. You will be blocked from Canada Telugu Classifieds for posting:</p>
                                        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <li>Multi-level or work from home jobs where recruitment of other members is part of the job</li>
                                            <li>Pyramid schemes or any job that requires upfront or periodic payments</li>
                                            <li>Jobs that involve sexual activities</li>
                                            <li>Identical jobs that are posted in multiple categories and/or on multiple Canada Telugu Classifieds sites</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className={styles.card}>
                                    <div className={styles.stepHeader} style={{ marginBottom: '1rem', borderBottom: 'none' }}>
                                        <h2 style={{ fontSize: '1.1rem', color: '#1e293b' }}>Terms and Conditions</h2>
                                    </div>
                                    <label className={styles.checkboxOption} style={{ alignItems: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkboxInput}
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            style={{ marginTop: '4px' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
                                            By posting your ad, you are agreeing to our <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>terms of use</a>, <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>privacy policy</a> and <a href="#" style={{ color: '#2563eb', textDecoration: 'underline' }}>site policies</a>.
                                            <br />
                                            Please do not post duplicate ads.
                                        </span>
                                    </label>
                                </section>
                            </>
                        )
                    }


                    <div className={styles.actions}>
                        <button
                            className={styles.btnPri}
                            onClick={() => {
                                // Basic validation before preview
                                if (!adTitle) {
                                    showAlert("Notice", "Please enter an ad title.");
                                    return;
                                }
                                if (imagePreviews.length === 0) {
                                    showAlert("Notice", "Please upload at least one image.");
                                    return;
                                }
                                setPhase("preview");
                                window.scrollTo(0, 0);
                            }}
                            disabled={isPublishing}
                        >
                            {listingId ? "Review Update" : "Review Ad"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Preview Phase
    const renderPreview = () => (
        <section className={styles.card}>
            <div className={styles.stepHeader}>
                <div className={styles.stepNumber}>✓</div>
                <h2>Review Your Ad</h2>
            </div>

            <div className={styles.previewContainer}>
                <div className={styles.previewSection}>
                    <h3>Category</h3>
                    <p>{currentCategory?.label} › {selectedSubCatLabel} {selectedSubItemLabel ? `› ${selectedSubItemLabel}` : ""}</p>
                </div>

                <div className={styles.previewSection}>
                    <h3>Details</h3>
                    <p><strong>Title:</strong> {adTitle}</p>
                    <p><strong>Type:</strong> {adType === 'offering' ? 'Offering' : 'Wanted'}</p>
                    <p><strong>Price:</strong> {priceType === 'amount' ? `$${priceAmount}` : priceType === 'contact' ? 'Please Contact' : 'Swap/Trade'}</p>
                    {description && (
                        <div>
                            <strong>Description:</strong>
                            <p className={styles.previewDesc}>{description}</p>
                        </div>
                    )}
                    {websiteUrlEnabled && websiteUrl && <p><strong>Website:</strong> {websiteUrl}</p>}
                    {youtubeVideo && <p><strong>YouTube Video:</strong> {youtubeVideo}</p>}
                    {tags.length > 0 && <p><strong>Tags:</strong> {tags.join(", ")}</p>}
                </div>

                {/* Attribute Preview - Simplified for brevity, covers key fields */}
                {(selectedCatId === "housing" || selectedCatId === "jobs" || selectedCatId === "events") && (
                    <div className={styles.previewSection}>
                        <h3>Specifics</h3>
                        {selectedCatId === "housing" && (
                            <div className={styles.previewGrid}>
                                {bedrooms && <p><strong>Bedrooms:</strong> {bedrooms}</p>}
                                {bathrooms && <p><strong>Bathrooms:</strong> {bathrooms}</p>}
                                {sqft && <p><strong>Sqft:</strong> {sqft}</p>}
                                {petFriendly && <p><strong>Pet Friendly:</strong> {petFriendly}</p>}
                            </div>
                        )}
                        {selectedCatId === "jobs" && (
                            <div className={styles.previewGrid}>
                                <p><strong>Job Type:</strong> {jobType}</p>
                                {(salaryFrom || salaryTo) && <p><strong>Salary:</strong> ${salaryFrom} - ${salaryTo}</p>}
                            </div>
                        )}
                        {selectedCatId === "events" && (
                            <div className={styles.previewGrid}>
                                <p><strong>When:</strong> {eventStartDate} {eventStartTime} to {eventEndDate} {eventEndTime}</p>
                                <p><strong>Where:</strong> {venueName} ({hideEventLocation ? "City only" : "Exact location"})</p>
                                <p><strong>Organizer:</strong> {organizerName}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.previewSection}>
                    <h3>Location & Contact</h3>
                    <p><strong>Location:</strong> {city}, {selectedProvinceCode}</p>
                    <p><strong>Contact:</strong> {contactName} ({email})</p>
                    {phone && <p><strong>Phone:</strong> {phone} {hidePhone ? '(Hidden)' : ''}</p>}
                </div>

                <div className={styles.previewSection}>
                    <h3>Images</h3>
                    <div className={styles.mediaGrid}>
                        {imagePreviews.map((url, idx) => (
                            <div key={idx} className={styles.mediaSlot}>
                                <img src={url} alt="Preview" className={styles.previewImg} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cost Summary Section */}
                {isMonetizationActive && (
                    <div className={styles.previewSection} style={{ borderTop: '2px solid #3b82f6', paddingTop: '1.5rem' }}>
                        <h3 style={{ color: '#1e40af', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💳</span> Payment Summary
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0 }}><strong>Listing Fee</strong></p>
                                <p style={{ margin: 0, fontWeight: 'bold', color: listingFee > 0 ? '#1e293b' : '#10b981' }}>
                                    {listingFee > 0 ? `$${listingFee.toFixed(2)}` : "FREE"}
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0 }}><strong>Boost Plan</strong></p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                        {premiumPlans.find(p => p.id === boostPlan)?.label || "Basic Listing"}
                                    </p>
                                </div>
                                <p style={{ margin: 0, fontWeight: 'bold', color: (premiumPlans.find(p => p.id === boostPlan)?.price || 0) > 0 ? '#1e293b' : '#10b981' }}>
                                    {(premiumPlans.find(p => p.id === boostPlan)?.price || 0) > 0
                                        ? `$${(premiumPlans.find(p => p.id === boostPlan)?.price || 0).toFixed(2)}`
                                        : "FREE"}
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ margin: 0 }}><strong>Website Addon</strong></p>
                                <p style={{ margin: 0, fontWeight: 'bold', color: websiteUrlEnabled ? '#1e293b' : '#64748b' }}>
                                    {websiteUrlEnabled ? `$${websiteFee.toFixed(2)}` : "OFF"}
                                </p>
                            </div>


                            {selectedCatId === "jobs" && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0 }}><strong>Professional Job Fee</strong></p>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: jobOfferedBy === "professional" ? '#1e293b' : '#10b981' }}>
                                        {jobOfferedBy === "professional" ? "$25.00" : "FREE"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {Number(totalPrice) > 0 && (
                    <div className={styles.previewSection} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {siteSettings?.is_hst_enabled && Number(hstCalculation.hst) > 0 && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, color: '#64748b' }}>Subtotal</p>
                                        <p style={{ margin: 0, fontWeight: '600' }}>{hstCalculation.subtotal}</p>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, color: '#64748b' }}>HST (13%)</p>
                                        <p style={{ margin: 0, fontWeight: '600' }}>{hstCalculation.hst}</p>
                                    </div>
                                    <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                                </>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Total Amount Due</h3>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{hstCalculation.total}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.actions} style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button
                        className={styles.btnSec}
                        onClick={() => setPhase("details")}
                    >
                        ← Edit Details
                    </button>
                    <button
                        className={styles.btnPri}
                        onClick={handlePublish}
                        disabled={isPublishing}
                    >
                        {isPublishing ? "Processing..." : (Number(totalPrice) > 0 ? `Pay & Post Ad ($${totalPrice})` : "✓ Confirm & Post")}
                    </button>
                </div>
            </div>
        </section>
    );

    return (
        <main className={styles.page}>
            <div className="container" style={{ maxWidth: "900px" }}>
                <div className={styles.header}>
                    <h1>
                        {listingId ? "Edit Your Ad" : (phase === "category" ? "Post a New Ad" : phase === "preview" ? "Preview Ad" : "Enter Ad Details")}
                    </h1>
                </div>
                <div className={styles.formContainer}>
                    {renderMonetizationBanner()}
                    {isFetchingListing ? (
                        <div className={styles.loadingContainer} style={{ minHeight: '300px' }}>
                            <div className={styles.loader}></div>
                            <p>Loading listing details...</p>
                        </div>
                    ) : (
                        phase === "category" ? renderPhase1() :
                            phase === "preview" ? renderPreview() : renderPhase2()
                    )}
                </div>
            </div>

            {/* Map Picker Modal */}

        </main>
    );
}
