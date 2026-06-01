import React from "react";
import styles from "./Table.module.css";

export function Table({ children, className, containerClassName, style }: { children: React.ReactNode; className?: string; containerClassName?: string; style?: React.CSSProperties }) {
    return (
        <div className={`${styles.container} ${containerClassName || ""}`} style={style}>
            <table className={`${styles.table} ${className || ""}`}>{children}</table>
        </div>
    );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <thead className={`${styles.header} ${className || ""}`}>{children}</thead>;
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return <tbody className={`${styles.body} ${className || ""}`}>{children}</tbody>;
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
    return <tr className={`${styles.row} ${className || ""}`}>{children}</tr>;
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
    return <th className={`${styles.headCell} ${className || ""}`}>{children}</th>;
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
    return <td className={`${styles.cell} ${className || ""}`}>{children}</td>;
}
