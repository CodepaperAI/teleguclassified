"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet with Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
    coords: { lat: number; lng: number } | null;
    setCoords: (coords: { lat: number; lng: number }) => void;
    onLocationSelect?: (lat: number, lng: number) => void;
}

function LocationMarker({ coords, setCoords, onLocationSelect }: LocationPickerProps) {
    const map = useMapEvents({
        click(e) {
            setCoords(e.latlng);
            if (onLocationSelect) onLocationSelect(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    // Center map when coords change (e.g., from current location button)
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, map.getZoom()); // Smooth pan
        }
    }, [coords, map]);

    return coords === null ? null : (
        <Marker
            position={coords}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    setCoords(position);
                    if (onLocationSelect) onLocationSelect(position.lat, position.lng);
                },
            }}
        />
    );
}

export default function LocationPicker({ coords, setCoords, onLocationSelect }: LocationPickerProps) {
    const defaultCenter = { lat: 43.6532, lng: -79.3832 }; // Toronto default

    return (
        <MapContainer
            center={coords || defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker coords={coords} setCoords={setCoords} onLocationSelect={onLocationSelect} />
        </MapContainer>
    );
}
