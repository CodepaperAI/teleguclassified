"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import styles from './PhotoLightbox.module.css';

interface PhotoLightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ images, initialIndex, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Touch swipe tracking refs
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsMounted(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialIndex]);

    const resetTransform = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    useEffect(() => {
        resetTransform();
    }, [currentIndex, resetTransform]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') handleClose();
            if (e.key === 'ArrowLeft' && images.length > 1) goPrev();
            if (e.key === 'ArrowRight' && images.length > 1) goNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, images.length, handleClose, goNext, goPrev]);

    // Touch swipe handlers — swipe left = next, swipe right = prev
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (scale !== 1) return; // Don't navigate while zoomed in
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        // Only fire if horizontal movement is dominant and large enough
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
            if (deltaX < 0) goNext();
            else goPrev();
        }
    };

    const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 5));
    const handleZoomOut = () => setScale((prev) => {
        const nextScale = Math.max(prev - 0.5, 1);
        if (nextScale === 1) setPosition({ x: 0, y: 0 });
        return nextScale;
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale === 1) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    if (!isMounted && !isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
            onClick={handleClose}
            onWheel={handleWheel}
        >
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close Preview">
                    <X size={24} />
                </button>

                {/* Counter e.g. "2 / 5" */}
                {images.length > 1 && (
                    <div className={styles.counter}>
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {/* Prev / Next navigation buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            className={`${styles.navBtn} ${styles.prevBtn}`}
                            onClick={goPrev}
                            aria-label="Previous Image"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <button
                            className={`${styles.navBtn} ${styles.nextBtn}`}
                            onClick={goNext}
                            aria-label="Next Image"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </>
                )}

                {/* Main image — drag on desktop, swipe on mobile */}
                <div
                    className={styles.imageWrapper}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <img
                        ref={imgRef}
                        src={images[currentIndex]}
                        alt={`Listing Image ${currentIndex + 1}`}
                        className={styles.mainImage}
                        draggable={false}
                    />
                </div>

                {/* Dot indicators — tap to jump to any image */}
                {images.length > 1 && (
                    <div className={styles.dots}>
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to image ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Zoom controls bar */}
                <div className={styles.controls}>
                    <button
                        className={styles.controlBtn}
                        onClick={handleZoomOut}
                        disabled={scale <= 1}
                        title="Zoom Out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
                    <button
                        className={styles.controlBtn}
                        onClick={handleZoomIn}
                        disabled={scale >= 5}
                        title="Zoom In"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <button
                        className={styles.controlBtn}
                        onClick={resetTransform}
                        title="Reset View"
                        aria-label="Reset Zoom and Pan"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoLightbox;
