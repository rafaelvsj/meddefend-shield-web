import { useState, useEffect } from 'react';
import WarningHeader from './llm-danger/WarningHeader';
import ScenarioDescription from './llm-danger/ScenarioDescription';
import HallucinationTable from './llm-danger/HallucinationTable';
import BrazilianStatistics from './llm-danger/BrazilianStatistics';
import RealCases from './llm-danger/RealCases';
import ComparisonSection from './llm-danger/ComparisonSection';
import SourcesSection from './llm-danger/SourcesSection';
import UrgencyCTA from './llm-danger/UrgencyCTA';

const LLMDangerSection = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [counters, setCounters] = useState({
    processesVsDoctors: 0,
    claudeSonnet: 0,
    claudeOpus: 0,
    gpt4: 0,
    gpt4o: 0,
    gemini: 0,
    meddefend: 0
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visibleElements.has('llm-danger')) {
      const animateCounter = (target: number, setter: (value: number) => void, duration: number = 2000) => {
        let start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const current = Math.floor(progress * target);
          setter(current);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      };

      animateCounter(573750, (val) => setCounters(prev => ({ ...prev, processesVsDoctors: val })));
      animateCounter(163, (val) => setCounters(prev => ({ ...prev, claudeSonnet: val / 10 })));
      animateCounter(101, (val) => setCounters(prev => ({ ...prev, claudeOpus: val / 10 })));
      animateCounter(18, (val) => setCounters(prev => ({ ...prev, gpt4: val / 10 })));
      animateCounter(15, (val) => setCounters(prev => ({ ...prev, gpt4o: val / 10 })));
      animateCounter(7, (val) => setCounters(prev => ({ ...prev, gemini: val / 10 })));
      animateCounter(1, (val) => setCounters(prev => ({ ...prev, meddefend: val / 10 })));
    }
  }, [visibleElements]);

  const isVisible = visibleElements.has('llm-danger');

  return (
    <section className="py-24 bg-black" data-animate id="llm-danger">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WarningHeader isVisible={isVisible} />
        <ScenarioDescription isVisible={isVisible} />
        <HallucinationTable isVisible={isVisible} counters={counters} />
        <BrazilianStatistics isVisible={isVisible} processesVsDoctors={counters.processesVsDoctors} />
        <RealCases isVisible={isVisible} />
        <ComparisonSection isVisible={isVisible} />
        <SourcesSection isVisible={isVisible} />
        <UrgencyCTA isVisible={isVisible} />
      </div>
    </section>
  );
};

export default LLMDangerSection;
