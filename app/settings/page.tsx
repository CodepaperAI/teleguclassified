"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SettingsPage() {
    return (
        <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ maxWidth: "800px", margin: "100px auto", textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚙️</div>
                <h1 style={{ fontSize: "2rem", marginBottom: "16px", color: "#1a1a1a" }}>Account Settings</h1>
                <p style={{ color: "#64748b", fontSize: "1.1rem", marginBottom: "32px" }}>
                    Configure your account preferences and notification settings. This feature is coming soon!
                </p>
                <a href="/" style={{
                    background: "#2563eb",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    textDecoration: "none"
                }}>Return to Home</a>
            </main>
            <Footer />
        </div>
    );
}
