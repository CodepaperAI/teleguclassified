import type { Metadata } from "next";
import BlogLanding from "@/components/BlogLanding";
import { getSiteUrl } from "@/lib/upliftai";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Canada Telugu Classifieds Blog",
  description: "Fresh blog guides for Telugu classifieds, local listings, services, jobs, events, and community life in Canada.",
  alternates: {
    canonical: getSiteUrl()
  },
  openGraph: {
    title: "Canada Telugu Classifieds Blog",
    description: "Fresh blog guides for Telugu classifieds, local listings, services, jobs, events, and community life in Canada.",
    url: getSiteUrl(),
    type: "website"
  }
};

export default function HomePage() {
  return <BlogLanding />;
}
