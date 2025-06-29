
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());

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

  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
        <div className="text-center max-w-5xl mx-auto" data-animate id="hero-content">
          <h1 className={`text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent mb-8 leading-tight transition-all duration-1000 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Mais processos judiciais do que médicos no Brasil. Sua prática clínica está
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> protegida?</span>
          </h1>
          <p className={`text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed font-light transition-all duration-1000 delay-300 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            A MedDefend é a primeira plataforma com inteligência artificial que transforma sua documentação médica em uma sólida defesa jurídica. Reduza o risco de litígios e dedique seu tempo ao que realmente importa: seus pacientes.
          </p>
          <div className={`transition-all duration-1000 delay-500 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-10 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 rounded-2xl font-semibold">
              <a href="/checkout.html">Experimente Gratuitamente por 3 Dias</a>
            </Button>
          </div>
          <p className={`text-sm text-slate-500 mt-6 font-light transition-all duration-1000 delay-700 ${visibleElements.has('hero-content') ? 'opacity-100' : 'opacity-0'}`}>
            Acesso completo. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
