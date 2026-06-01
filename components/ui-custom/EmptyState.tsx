import React from "react";
import styles from "./EmptyState.module.css";
import { IconType } from "react-icons";

interface EmptyStateProps {
    icon?: IconType;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className={styles.container}>
            {Icon && (
                <div className={styles.iconWrapper}>
                    <Icon className={styles.icon} />
                </div>
            )}
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
}
