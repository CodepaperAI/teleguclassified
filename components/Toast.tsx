"use client";

import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
    isVisible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ isVisible, message, type = 'success', onClose }) => {
    const [render, setRender] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setRender(true);
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!render && !isVisible) return null;

    return (
        <div className={`${styles.toast} ${isVisible ? styles.show : styles.hide} ${styles[type]}`}>
            <div className={styles.content}>
                {message}
            </div>
            <div className={styles.progress}></div>
        </div>
    );
};

export default Toast;
