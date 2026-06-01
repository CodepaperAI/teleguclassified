"use client";

import { useState } from "react";
import { updateCMSPage } from "../actions";
import { useRouter } from "next/navigation";
import styles from "../../users/page.module.css";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import RichTextEditor from "./RichTextEditor";

interface EditorProps {
    page: {
        slug: string;
        title: string;
        content: string;
    };
}

export default function PageEditor({ page }: EditorProps) {
    const [title, setTitle] = useState(page.title);
    const [content, setContent] = useState(page.content);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const result = await updateCMSPage(page.slug, title, content);
            if (result.success) {
                setMessage({ type: 'success', text: 'Page updated successfully!' });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update page' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'An error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <Link href="/admin/pages" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--slate-600)", textDecoration: "none", marginBottom: "1rem" }}>
                    <FaArrowLeft size={14} />
                    Back to Pages
                </Link>
                <h1 className={styles.title}>Edit Page: {page.title}</h1>
                <p className={styles.subtitle}>
                    Update the content of the {page.title} page. This editor supports full formatting, colors, and pasting from other documents.
                </p>
            </div>

            <div className={styles.card} style={{ padding: "2rem" }}>
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {message && (
                        <div style={{
                            padding: "1rem",
                            borderRadius: "6px",
                            background: message.type === 'success' ? "#ecfdf5" : "#fef2f2",
                            color: message.type === 'success' ? "#065f46" : "#991b1b",
                            border: `1px solid ${message.type === 'success' ? "#10b981" : "#ef4444"}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label htmlFor="title" style={{ fontWeight: 600, color: "var(--slate-700)" }}>Page Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                padding: "0.75rem",
                                borderRadius: "6px",
                                border: "1px solid var(--slate-200)",
                                fontSize: "1rem"
                            }}
                            required
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{ fontWeight: 600, color: "var(--slate-700)" }}>Content (Visual Editor)</label>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="submit"
                            disabled={isSaving}
                            style={{
                                padding: "0.75rem 2rem",
                                background: "var(--primary)",
                                color: "white",
                                borderRadius: "6px",
                                border: "none",
                                fontWeight: 600,
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <FaSave />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
