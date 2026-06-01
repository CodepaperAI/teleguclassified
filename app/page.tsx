import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryShortcuts from "@/components/CategoryShortcuts";
import FeaturedListings from "@/components/FeaturedListings";
import MainFeed from "@/components/MainFeed";
import Footer from "@/components/Footer";
import MobileSearch from "@/components/MobileSearch";

export default function Home() {
  return (
    <main>
      <div className="mobile-only">
        <MobileSearch />
      </div>
      <Hero />
      <CategoryShortcuts />
      <MainFeed />
    </main>
  );
}
