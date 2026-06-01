"use client";

import React, { useEffect, useState } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
    isOpen: boolean;
    title: string;
    message?: string;
    type?: 'alert' | 'confirm';
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    children?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, title, message, type, confirmText, onConfirm, onCancel, onClose, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const isMatched = !confirmText || inputValue === confirmText;

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setInputValue("");
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);


    if (!isVisible && !isOpen) return null;

    const handleClose = onClose || onCancel;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : styles.closing}`} onClick={handleClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    {onClose && (
                        <button className={styles.closeHeaderBtn} onClick={onClose}>&times;</button>
                    )}
                </div>
                <div className={styles.body}>
                    {message && <p className={styles.message}>{message}</p>}
                    {confirmText && (
                        <div className={styles.confirmSection}>
                            <p className={styles.confirmPrompt}>Please type <strong>{confirmText}</strong> to confirm:</p>
                            <input
                                type="text"
                                className={styles.confirmInput}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={confirmText}
                                autoFocus
                            />
                        </div>
                    )}
                    {children}
                </div>
                {(type || onConfirm || onCancel) && (
                    <div className={styles.footer}>
                        {type === 'confirm' && onCancel && (
                            <button className={styles.cancelBtn} onClick={onCancel}>
                                Cancel
                            </button>
                        )}
                        {onConfirm && (
                            <button 
                                className={styles.confirmBtn} 
                                onClick={onConfirm}
                                disabled={!isMatched}
                            >
                                {type === 'confirm' ? 'Confirm' : 'OK'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dialog;
