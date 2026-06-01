"use client";

import React from 'react';
import { useAppContext } from "@/context/AppContext";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
    const { dialog, toast, closeToast } = useAppContext();
    const pathname = usePathname();

    const hideNavFooter = ['/login', '/signup'].includes(pathname);
    const hideFooterOnly = ['/chat'].includes(pathname) || pathname.startsWith('/admin');

    return (
        <>
            {!hideNavFooter && <Navbar />}
            <div style={{ paddingTop: hideNavFooter ? 0 : '70px', minHeight: '100vh' }}>
                {children}
            </div>
            {!hideNavFooter && !hideFooterOnly && <Footer />}
            <BottomNav />
            <Dialog {...dialog} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />
            <Toast {...toast} onClose={closeToast} />
        </>
    );
}
