import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Features from "@/components/landing/features";
import Hero from "@/components/landing/hero";

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
