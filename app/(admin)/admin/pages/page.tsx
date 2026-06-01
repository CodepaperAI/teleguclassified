import { getCMSPages } from "./actions";
import Link from "next/link";
import { FaEdit, FaEye } from "react-icons/fa";
import styles from "../users/page.module.css"; // Reuse table styles

export default async function AdminPagesListing() {
    const pages = await getCMSPages();

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Pages</h1>
                <p className={styles.subtitle}>Manage legal, policy, and guideline pages of the platform.</p>
            </div>

            <div className={styles.card}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Page Title</th>
                                <th>Slug</th>
                                <th>Last Updated</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map((page) => (
                                <tr key={page.id}>
                                    <td>
                                        <span style={{ fontWeight: 600, color: "var(--slate-800)" }}>{page.title}</span>
                                    </td>
                                    <td>
                                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "0.85rem" }}>
                                            /{page.slug}
                                        </code>
                                    </td>
                                    <td>
                                        {new Date(page.updated_at).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                            <Link
                                                href={`/${page.slug}`}
                                                target="_blank"
                                                className={styles.link}
                                                style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary)" }}
                                            >
                                                <FaEye size={14} />
                                                View
                                            </Link>
                                            <Link
                                                href={`/admin/pages/${page.slug}`}
                                                style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "var(--primary)", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "0.85rem" }}
                                            >
                                                <FaEdit size={14} />
                                                Edit
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
