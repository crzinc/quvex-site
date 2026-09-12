import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Pricing from "@/components/landing/Pricing";
import About from "@/components/landing/About";
import HowItWorks from "@/components/landing/HowItWorks";
import Portfolio from "@/components/landing/Portfolio";
import QuizSection from "@/components/landing/QuizSection";
import Faq from "@/components/landing/Faq";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Pricing />
        <About />
        <HowItWorks />
        <Portfolio />
        <QuizSection />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
