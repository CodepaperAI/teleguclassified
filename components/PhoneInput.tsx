"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./PhoneInput.module.css";

interface Country {
    name: string;
    code: string;
    dial_code: string;
}

const countries: Country[] = [
    { name: "Canada", code: "ca", dial_code: "+1" },
    { name: "United States", code: "us", dial_code: "+1" },
    { name: "India", code: "in", dial_code: "+91" },
    { name: "United Kingdom", code: "gb", dial_code: "+44" },
    { name: "Australia", code: "au", dial_code: "+61" },
    { name: "United Arab Emirates", code: "ae", dial_code: "+971" },
    { name: "Singapore", code: "sg", dial_code: "+65" },
    { name: "Germany", code: "de", dial_code: "+49" },
    { name: "France", code: "fr", dial_code: "+33" },
    { name: "New Zealand", code: "nz", dial_code: "+64" },
    { name: "Ireland", code: "ie", dial_code: "+353" },
    { name: "South Africa", code: "za", dial_code: "+27" },
    { name: "Japan", code: "jp", dial_code: "+81" },
    { name: "China", code: "cn", dial_code: "+86" },
    { name: "Sri Lanka", code: "lk", dial_code: "+94" },
    { name: "Pakistan", code: "pk", dial_code: "+92" },
    { name: "Bangladesh", code: "bd", dial_code: "+880" },
    { name: "Nigeria", code: "ng", dial_code: "+234" },
    { name: "Italy", code: "it", dial_code: "+39" },
    { name: "Spain", code: "es", dial_code: "+34" },
    { name: "Netherlands", code: "nl", dial_code: "+31" },
    { name: "Switzerland", code: "ch", dial_code: "+41" },
    { name: "Sweden", code: "se", dial_code: "+46" },
    { name: "Norway", code: "no", dial_code: "+47" },
    { name: "Denmark", code: "dk", dial_code: "+45" },
    { name: "Finland", code: "fi", dial_code: "+358" },
    { name: "Brazil", code: "br", dial_code: "+55" },
    { name: "Mexico", code: "mx", dial_code: "+52" },
    { name: "Argentina", code: "ar", dial_code: "+54" },
    { name: "Malaysia", code: "my", dial_code: "+60" },
    { name: "Thailand", code: "th", dial_code: "+66" },
    { name: "Vietnam", code: "vn", dial_code: "+84" },
    { name: "Indonesia", code: "id", dial_code: "+62" },
    { name: "Philippines", code: "ph", dial_code: "+63" },
    { name: "Saudi Arabia", code: "sa", dial_code: "+966" },
    { name: "Qatar", code: "qa", dial_code: "+974" },
    { name: "Kuwait", code: "kw", dial_code: "+965" },
    { name: "Israel", code: "il", dial_code: "+972" },
    { name: "Turkey", code: "tr", dial_code: "+90" },
    { name: "Egypt", code: "eg", dial_code: "+20" },
    { name: "Kenya", code: "ke", dial_code: "+254" },
    { name: "Ghana", code: "gh", dial_code: "+233" },
    { name: "Portugal", code: "pt", dial_code: "+351" },
    { name: "Poland", code: "pl", dial_code: "+48" },
    { name: "South Korea", code: "kr", dial_code: "+82" },
    { name: "Russia", code: "ru", dial_code: "+7" },
    { name: "Ukraine", code: "ua", dial_code: "+380" },
    { name: "Greece", code: "gr", dial_code: "+30" },
    { name: "Belgium", code: "be", dial_code: "+32" },
    { name: "Austria", code: "at", dial_code: "+43" },
];

interface PhoneInputProps {
    value: string;
    onChange: (fullNumber: string) => void;
    onCountryChange?: (countryCode: string) => void;
    disabled?: boolean;
    required?: boolean;
}

export default function PhoneInput({ value, onChange, onCountryChange, disabled, required }: PhoneInputProps) {
    const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Canada
    const [phoneNumber, setPhoneNumber] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // IP-based country detection
        const detectCountry = async () => {
            try {
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                if (data.country_code) {
                    const detected = countries.find(c => c.code.toUpperCase() === data.country_code.toUpperCase());
                    if (detected) {
                        setSelectedCountry(detected);
                        onCountryChange?.(detected.code);
                    }
                }
            } catch (error) {
                console.error("Failed to detect country:", error);
            }
        };
        detectCountry();
    }, []);

    // Parse incoming value to set country and phone number
    useEffect(() => {
        if (value && value.startsWith('+')) {
            // Find matching country by dial code
            const matchedCountry = countries.find(c => value.startsWith(c.dial_code));
            if (matchedCountry) {
                setSelectedCountry(matchedCountry);
                onCountryChange?.(matchedCountry.code);
                // Extract phone number without dial code
                const number = value.substring(matchedCountry.dial_code.length);
                setPhoneNumber(number);
            }
        } else if (value) {
            // If no + prefix, just set the number
            setPhoneNumber(value.replace(/\D/g, ''));
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setPhoneNumber(val);
        onChange(`${selectedCountry.dial_code}${val}`);
    };

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        onCountryChange?.(country.code);
        setIsOpen(false);
        setSearchTerm("");
        onChange(`${country.dial_code}${phoneNumber}`);
    };

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.dial_code.includes(searchTerm)
    );

    return (
        <div className={styles.phoneInputContainer}>
            <div className={styles.countrySelector} ref={dropdownRef}>
                <button
                    type="button"
                    className={styles.selectorButton}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <div className={styles.flagWrapper}>
                        <img
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png 2x`}
                            width="20"
                            alt={selectedCountry.name}
                            className={styles.flagImage}
                        />
                    </div>
                    <span>{selectedCountry.dial_code}</span>
                    <span className={styles.chevron}>{isOpen ? "▴" : "▾"}</span>
                </button>

                {isOpen && (
                    <div className={styles.dropdown}>
                        <div className={styles.searchWrapper}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search country..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.countryList}>
                            {filteredCountries.map((country) => (
                                <div
                                    key={country.code}
                                    className={`${styles.countryOption} ${selectedCountry.code === country.code ? styles.selected : ""}`}
                                    onClick={() => handleCountrySelect(country)}
                                >
                                    <div className={styles.flagWrapper}>
                                        <img
                                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                                            srcSet={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`}
                                            width="20"
                                            alt={country.name}
                                            className={styles.flagImage}
                                        />
                                    </div>
                                    <span className={styles.countryName}>{country.name}</span>
                                    <span className={styles.dialCode}>{country.dial_code}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <input
                type="tel"
                className={styles.inputField}
                placeholder="Phone number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                disabled={disabled}
                required={required}
            />
        </div>
    );
}

