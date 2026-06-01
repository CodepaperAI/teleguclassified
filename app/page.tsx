import type { Metadata } from "next";
import BlogLanding from "@/components/BlogLanding";
import { getSiteUrl } from "@/lib/upliftai";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Canada Telugu Classifieds Blog",
  description: "Guides, safety tips, and community updates for Telugu life in Canada.",
  alternates: {
    canonical: getSiteUrl()
  },
  openGraph: {
    title: "Canada Telugu Classifieds Blog",
    description: "Guides, safety tips, and community updates for Telugu life in Canada.",
    url: getSiteUrl(),
    type: "website"
  }
};

export default function HomePage() {
  return <BlogLanding />;
}
