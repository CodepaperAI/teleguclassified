import type { Metadata } from "next";
import { Lato, Outfit } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/upliftai";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-main"
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Canada Telugu Classifieds Blog",
    template: "%s | Canada Telugu Classifieds Blog"
  },
  description: "Guides, community updates, and marketplace advice for Telugu life in Canada."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${outfit.variable}`}>{children}</body>
    </html>
  );
}
