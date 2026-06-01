"use client";

import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./Profile.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import PhoneInput from "@/components/PhoneInput";
import { deleteMyAccount } from "./actions";

export default function ProfilePage() {
    const supabase = createClient();
    const { user, showAlert, showConfirm, showToast, signOut, isBlocked } = useAppContext();
    const router = useRouter();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [countryCode, setCountryCode] = useState("ca");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        setName(user.user_metadata?.full_name || "");
        setPhone(user.phone || "");
        setEmail(user.email || "");
    }, [user, router]);

    if (!user) return null;

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            // Upload to storage
            const { uploadAvatar, updateProfile } = await import("@/lib/db/profile");
            const avatarUrl = await uploadAvatar(file, user.id);

            // Update profile
            await updateProfile(user.id, { avatar_url: avatarUrl });

            showAlert("Success", "Profile photo updated successfully!");

            // Reload page to reflect changes (simplest way to update user metadata in context)
            window.location.reload();
        } catch (error: any) {
            console.error("Error uploading photo:", error);
            showAlert("Error", `Failed to upload photo: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const updates: any = {
                data: { full_name: name }
            };

            // Only update email/phone if they've actually changed and were previously empty/different
            if (email !== user.email) {
                updates.email = email;
            }
            if (phone !== user.phone) {
                // Phone validation
                const rawPhone = phone.replace(/\D/g, "");
                if (countryCode === "in") {
                    const digitsOnly = rawPhone.replace(/^91/, "");
                    if (digitsOnly.length !== 10) {
                        setError("Please enter a valid 10-digit mobile number for India.");
                        setLoading(false);
                        return;
                    }
                } else if (countryCode === "ca" || countryCode === "us") {
                    const digitsOnly = rawPhone.replace(/^1/, "");
                    if (digitsOnly.length !== 10) {
                        setError("Please enter a valid 10-digit phone number.");
                        setLoading(false);
                        return;
                    }
                } else if (rawPhone.length < 7) {
                    setError("Please enter a valid phone number.");
                    setLoading(false);
                    return;
                }
                updates.phone = phone;
            }

            const { error: authError } = await supabase.auth.updateUser(updates);

            if (authError) throw authError;

            setSuccess("Profile updated successfully!");
            setTimeout(() => {
                setEditMode(false);
                setSuccess("");
                // We don't necessarily need a hard reload if the context updates, 
                // but updateUser might require verification for email/phone changes
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        showConfirm(
            "Delete Account Permanently?",
            "Are you absolutely sure you want to delete your account? This action is permanent and CANNOT be undone. You will lose all your listings, messages, favorites, and profile data.",
            async () => {
                setLoading(true);
                try {
                    const result = await deleteMyAccount();
                    if (result.success) {
                        showToast("Your account has been successfully deleted.", "success");
                        // We sign out through context to clear local state
                        await signOut();
                        router.push("/");
                    } else {
                        showAlert("Deletion Failed", result.error || "An error occurred while deleting your account.");
                    }
                } catch (error: any) {
                    console.error("Error in handleDeleteAccount:", error);
                    showAlert("Error", "A server error occurred. Please try again later.");
                } finally {
                    setLoading(false);
                }
            },
            undefined,
            "DELETE"
        );
    };

    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <main className={styles.container}>
            {/* ... lines 122 to 247 ... */}
            <div className={styles.profileHeader}>
                <div className={styles.avatarSection} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className={styles.avatarLarge}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" />
                        ) : (
                            (name || user.email || "U")[0].toUpperCase()
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                    />
                    <button
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        {loading ? "Uploading..." : "Change Photo"}
                    </button>
                </div>
                <div className={styles.headerInfo}>
                    <h1>
                        {name || user.email || "User"}
                        {isBlocked && (
                            <span className={styles.blockedBadge}>Blocked by Admin</span>
                        )}
                    </h1>
                    <p>Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
            </div>

            <div className={styles.sections}>
                <div className={styles.section}>
                    <div className={styles.headerWithAction}>
                        <h3>Account Details</h3>
                        {!editMode && (
                            <button className={styles.editProfileBtn} onClick={() => setEditMode(true)}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {error && <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

                    <div className={styles.detail}>
                        <label>Full Name</label>
                        {editMode ? (
                            <input
                                type="text"
                                className={styles.inputField}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        ) : (
                            <span>{name || "Not set"}</span>
                        )}
                    </div>
                    <div className={styles.detail}>
                        <label>Email Address</label>
                        {editMode ? (
                            <input
                                type="email"
                                className={styles.inputField}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Add your email address"
                                disabled={user.app_metadata.provider === 'email'}
                            />
                        ) : (
                            <span>{email || "Not set"}</span>
                        )}
                        {editMode && (user.app_metadata.provider === 'email' || user.email) && (
                            <p className={styles.hint}>Registration email cannot be changed.</p>
                        )}
                    </div>
                    <div className={styles.detail}>
                        <label>Phone Number</label>
                        {editMode ? (
                            <div className={styles.phoneInputWrapper}>
                                <PhoneInput
                                    value={phone}
                                    onChange={(val) => setPhone(val)}
                                    onCountryChange={(code) => setCountryCode(code.toLowerCase())}
                                    disabled={user.app_metadata.provider === 'phone' || user.app_metadata.provider === 'sms' || !!user.phone}
                                />
                                {editMode && (user.app_metadata.provider === 'phone' || user.app_metadata.provider === 'sms' || user.phone) && (
                                    <p className={styles.hint}>Registration phone number cannot be changed.</p>
                                )}
                            </div>
                        ) : (
                            <span>{phone || "Not set"}</span>
                        )}
                    </div>

                    {editMode && (
                        <div className={styles.editActions}>
                            {success && <p className={styles.successMessage}>{success}</p>}
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setEditMode(false);
                                    setName(user.user_metadata?.full_name || "");
                                    setPhone(user.phone || "");
                                    setEmail(user.email || "");
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.section}>
                    <h3>Security</h3>
                    <p>Manage your account security and authentication.</p>
                    <button className={styles.secondaryBtn}>Change Password</button>
                </div>

                <div className={styles.section}>
                    <h3>Delete Account</h3>
                    <p>Permanently remove your account and all listings.</p>
                    <button
                        className={styles.dangerBtn}
                        onClick={handleDeleteAccount}
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete My Account"}
                    </button>
                </div>
            </div>
        </main>
    );
}
