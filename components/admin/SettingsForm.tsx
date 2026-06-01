"use client";

import { useState, useRef } from "react";
import { SiteSettings, updateSettings } from "@/app/(admin)/admin/settings/actions";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { FaSave, FaUpload, FaSpinner, FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaImage } from "react-icons/fa";
import styles from "./SettingsForm.module.css";

interface SettingsFormProps {
    initialSettings: SiteSettings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [settings, setSettings] = useState<SiteSettings>(initialSettings || {
        id: 1,
        social_links: {},
        contact_email: "",
        contact_phone: "",
        about_us: "",
        hero_description: "",
        home_banner_url: "",
        website_fee: 4.95,
        is_pricing_enabled: false,
        is_hst_enabled: false,
        global_free_limit: 0,
        global_free_image_limit: 5
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Handle numeric inputs
        if (type === 'number') {
            setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
            return;
        }
        
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [name]: value
            }
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `banner-${Date.now()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            setSettings(prev => ({ ...prev, home_banner_url: publicUrl }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please ensure the 'site-assets' bucket exists and has public write access.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateSettings(settings);
            alert("Settings updated successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.container}>

            {/* Social Links */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Social Media Links</h3>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaFacebook style={{ marginRight: '8px', color: '#1877F2' }} /> Facebook URL</label>
                        <input
                            type="url"
                            name="facebook"
                            value={settings.social_links.facebook || ""}
                            onChange={handleSocialChange}
                            placeholder="https://facebook.com/yourpage"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaTwitter style={{ marginRight: '8px', color: '#1DA1F2' }} /> Twitter (X) URL</label>
                        <input
                            type="url"
                            name="twitter"
                            value={settings.social_links.twitter || ""}
                            onChange={handleSocialChange}
                            placeholder="https://twitter.com/yourhandle"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaInstagram style={{ marginRight: '8px', color: '#E4405F' }} /> Instagram URL</label>
                        <input
                            type="url"
                            name="instagram"
                            value={settings.social_links.instagram || ""}
                            onChange={handleSocialChange}
                            placeholder="https://instagram.com/yourprofile"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaYoutube style={{ marginRight: '8px', color: '#FF0000' }} /> YouTube URL</label>
                        <input
                            type="url"
                            name="youtube"
                            value={settings.social_links.youtube || ""}
                            onChange={handleSocialChange}
                            placeholder="https://youtube.com/channel/..."
                            className={styles.input}
                        />
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Contact Information</h3>
                <div className={styles.grid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaEnvelope style={{ marginRight: '8px' }} /> Contact Email</label>
                        <input
                            type="email"
                            name="contact_email"
                            value={settings.contact_email || ""}
                            onChange={handleChange}
                            placeholder="admin@example.com"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaPhone style={{ marginRight: '8px' }} /> Contact Phone</label>
                        <input
                            type="tel"
                            name="contact_phone"
                            value={settings.contact_phone || ""}
                            onChange={handleChange}
                            placeholder="+1 (555) 000-0000"
                            className={styles.input}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Pricing & Monetization</h3>
                <div className={styles.grid}>
                    <div className={`${styles.formGroupRow} ${styles.fullWidth}`}>
                        <div>
                            <label className={styles.label} style={{ fontSize: '1rem', fontWeight: '600' }}>Master Pricing Toggle</label>
                            <p className={styles.helperText}>Enable or disable all monetization features globally. When OFF, the app remains in "Free Mode".</p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="is_pricing_enabled"
                                checked={settings.is_pricing_enabled || false}
                                onChange={(e) => setSettings(prev => ({ ...prev, is_pricing_enabled: e.target.checked }))}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={`${styles.formGroupRow} ${styles.fullWidth}`}>
                        <div>
                            <label className={styles.label} style={{ fontSize: '1rem', fontWeight: '600' }}>Enable 13% HST Tax</label>
                            <p className={styles.helperText}>When enabled, an additional 13% HST will be applied to all paid listings and boosts.</p>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                name="is_hst_enabled"
                                checked={settings.is_hst_enabled || false}
                                onChange={(e) => setSettings(prev => ({ ...prev, is_hst_enabled: e.target.checked }))}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Website URL Fee ($)</label>
                        <input
                            type="number"
                            name="website_fee"
                            value={settings.website_fee ?? 4.95}
                            onChange={handleChange}
                            placeholder="4.95"
                            step="0.01"
                            min="0"
                            className={styles.input}
                        />
                        <p className={styles.helperText}>Fee charged when users add a website URL to their listing.</p>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Global Free Listings</label>
                        <input
                            type="number"
                            name="global_free_limit"
                            value={settings.global_free_limit ?? 0}
                            onChange={handleChange}
                            className={styles.input}
                            min="0"
                        />
                        <p className={styles.helperText}>Number of free listings allowed per user across all categories.</p>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Global Free Image Limit</label>
                        <input
                            type="number"
                            name="global_free_image_limit"
                            value={settings.global_free_image_limit ?? 5}
                            onChange={handleChange}
                            className={styles.input}
                            min="0"
                        />
                        <p className={styles.helperText}>Max images allowed for free listings.</p>
                    </div>
                </div>
            </div>

            {/* General Content */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>General Content</h3>

                <div className={styles.formGroup}>
                    <label className={styles.label}>About Us (Footer Description)</label>
                    <textarea
                        name="about_us"
                        value={settings.about_us || ""}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Brief description about your community for the footer..."
                    />
                </div>

                <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                    <label className={styles.label}>Hero Description (Main Heading Subtitle)</label>
                    <textarea
                        name="hero_description"
                        value={settings.hero_description || ""}
                        onChange={handleChange}
                        className={styles.textarea}
                        placeholder="Text that appears under the main heading on the home page..."
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                    <label className={styles.label}><FaImage style={{ marginRight: '8px' }} /> Home Page Banner</label>
                    <div className={styles.imageUpload}>
                        <div className={styles.preview}>
                            {settings.home_banner_url ? (
                                <Image
                                    src={settings.home_banner_url}
                                    alt="Home Banner"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <div className={styles.noImage}>No Image</div>
                            )}
                        </div>
                        <div className={styles.uploadActions}>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={styles.uploadBtn}
                            >
                                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                                {uploading ? "Uploading..." : "Upload New Image"}
                            </button>
                            <p className={styles.helperText}>Recommended size: 1920x600px • JPG, PNG, WEBP</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className={styles.saveBtn}
                >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </form>
    );
}
