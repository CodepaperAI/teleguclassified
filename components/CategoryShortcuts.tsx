"use client";

import { useState } from "react";
import styles from "./CategoryShortcuts.module.css";
import Link from "next/link";
import CategoryPopup from "./CategoryPopup";
import { FaCartShopping, FaHouse, FaWrench, FaBriefcase, FaCalendarDays } from "react-icons/fa6";

const shortcuts = [
    {
        id: "buysell",
        title: "Buy/Sell",
        icon: <FaCartShopping />,
        color: "#0284c7",
        bg: "#e0f2fe",
        type: "popup"
    },
    {
        id: "housing",
        title: "Real Estate",
        icon: <FaHouse />,
        color: "#ea580c",
        bg: "#ffedd5",
        type: "popup"
    },
    {
        id: "services",
        title: "Services",
        icon: <FaWrench />,
        color: "#9333ea",
        bg: "#f3e8ff",
        type: "popup"
    },
    {
        id: "jobs",
        title: "Jobs",
        icon: <FaBriefcase />,
        color: "#16a34a",
        bg: "#dcfce7",
        type: "popup"
    },
    {
        id: "events",
        title: "Events",
        icon: <FaCalendarDays />,
        color: "#e11d48",
        bg: "#ffe4e6",
        type: "popup"
    },
];

export default function CategoryShortcuts() {
    const [openCatId, setOpenCatId] = useState<string | null>(null);

    return (
        <div className={styles.wrapper}>
            <div className="container">
                <h2 className={styles.sectionTitle}>Categories</h2>
                <div className={styles.grid}>
                    {shortcuts.map((item, idx) => (
                        <div
                            key={idx}
                            className={styles.card}
                            onClick={() => setOpenCatId(item.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className={styles.icon}
                                style={{ backgroundColor: item.bg, color: item.color }}
                            >
                                {item.icon}
                            </div>
                            <span className={styles.title}>{item.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <CategoryPopup
                categoryId={openCatId}
                onClose={() => setOpenCatId(null)}
            />
        </div>
    );
}
