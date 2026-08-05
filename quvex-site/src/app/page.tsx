import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import About from "@/components/landing/About";
import Portfolio from "@/components/landing/Portfolio";
import QuizSection from "@/components/landing/QuizSection";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Portfolio />
      <QuizSection />
      <Contact />
      <Footer />
    </>
  );
}
