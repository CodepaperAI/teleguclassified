import type { Metadata } from "next";
import BlogLanding from "@/components/BlogLanding";
import { getSiteUrl } from "@/lib/upliftai";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest Canada Telugu Classifieds blog articles and community guides.",
  alternates: {
    canonical: `${getSiteUrl()}/blog`
  },
  openGraph: {
    title: "Blog | Canada Telugu Classifieds",
    description: "Latest Canada Telugu Classifieds blog articles and community guides.",
    url: `${getSiteUrl()}/blog`,
    type: "website"
  }
};

export default function BlogPage() {
  return <BlogLanding />;
}
