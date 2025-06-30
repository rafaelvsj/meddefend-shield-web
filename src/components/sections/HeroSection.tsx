
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
    <section id="home" className="bg-gradient-to-b from-slate-950 via-gray-950 to-black min-h-screen flex items-center overflow-hidden relative">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-indigo-950/20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-32 relative z-10">
        <div className="text-center max-w-5xl mx-auto" data-animate id="hero-content">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-relaxed transition-all duration-1000 tracking-tight drop-shadow-2xl ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="block mb-4 text-white">Mais processos judiciais do que médicos no Brasil.</span>
            <span className="block mb-4 text-white">Sua prática clínica está</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-relaxed py-2">protegida?</span>
          </h1>
          <p className={`text-xl md:text-2xl text-gray-100 mb-10 leading-relaxed font-light font-inter max-w-4xl mx-auto transition-all duration-1000 delay-300 drop-shadow-lg ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            A MedDefend é a primeira plataforma com inteligência artificial que transforma sua documentação médica em uma sólida defesa jurídica. Reduza o risco de litígios e dedique seu tempo ao que realmente importa{': '}seus pacientes.
          </p>
          <div className={`transition-all duration-1000 delay-500 ${visibleElements.has('hero-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 rounded-full font-semibold font-inter shadow-2xl">
              <a href="/checkout.html">Experimente Gratuitamente por 3 Dias</a>
            </Button>
          </div>
          <p className={`text-sm text-gray-300 mt-6 font-light font-inter transition-all duration-1000 delay-700 ${visibleElements.has('hero-content') ? 'opacity-100' : 'opacity-0'}`}>
            Acesso completo. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
