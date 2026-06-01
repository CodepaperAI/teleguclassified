import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import AppWrapper from "@/components/AppWrapper";
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Canada Telugu Classifieds | Buy, Sell, Services & Real Estate",
  description: "The ultimate classifieds platform for the Telugu community in Canada. Buy, Sell, find Services and Real Estate listings.",
  verification: {
    google: "D5eMjTAQ_RnGZDrSmSIgNrWUfD3K3XD1bLYMcNBMx1M",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </AppProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {process.env.NEXT_PUBLIC_GTM_ID && (
           <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        <Analytics />
      </body>
    </html>
  );
}
