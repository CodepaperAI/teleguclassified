"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { generateProductUrl } from "@/lib/utils";

export default function ProductRedirect() {
    const params = useParams();
    const router = useRouter();
    const { listings, isLoadingListings } = useAppContext();

    useEffect(() => {
        if (isLoadingListings) return;

        const product = listings.find(l => l.id === params.id);
        if (product) {
            const newUrl = generateProductUrl({
                id: product.id,
                title: product.title,
                category_id: product.category_id,
                sub_category_label: product.sub_category_label,
                sub_item_label: product.sub_item_label,
                city: product.location?.split(',')[0].trim(), // Extract city from location string if needed
                slug: product.slug
            });
            router.replace(newUrl);
        }
    }, [params.id, listings, isLoadingListings, router]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader">Redirecting to listing...</div>
        </div>
    );
}
