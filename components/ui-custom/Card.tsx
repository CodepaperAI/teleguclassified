import React from "react";
import styles from "./Card.module.css";

export function Card({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={`${styles.card} ${className || ""}`} style={style}>{children}</div>;
}

export function CardHeader({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={`${styles.header} ${className || ""}`} style={style}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h3 className={`${styles.title} ${className || ""}`}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={`${styles.description} ${className || ""}`}>{children}</p>;
}

export function CardContent({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={`${styles.content} ${className || ""}`} style={style}>{children}</div>;
}
