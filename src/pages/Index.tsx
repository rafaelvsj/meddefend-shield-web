
// Import new components
import Header from '@/components/sections/Header';
import HeroSection from '@/components/sections/HeroSection';
import StatisticsSection from '@/components/sections/StatisticsSection';
import LLMDangerSection from '@/components/sections/LLMDangerSection';
import ProductSection from '@/components/sections/ProductSection';
import AboutSection from '@/components/sections/AboutSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import PricingSection from '@/components/sections/PricingSection';
import ContactSection from '@/components/sections/ContactSection';
import FooterSection from '@/components/sections/FooterSection';

const Index = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Header scrollToSection={scrollToSection} />
      <HeroSection />
      <StatisticsSection />
      <LLMDangerSection />
      <ProductSection scrollToSection={scrollToSection} />
      <AboutSection />
      <FeaturesSection />
      <PricingSection scrollToSection={scrollToSection} />
      <ContactSection />
      <FooterSection />
    </div>
  );
};

export default Index;
