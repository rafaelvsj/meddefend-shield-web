
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section id="home" className="bg-gradient-to-b from-slate-950 via-gray-950 to-black min-h-screen flex items-center overflow-hidden relative">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-indigo-950/20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-32 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="animate-scroll-reveal-up scroll-reveal text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-relaxed transition-all duration-1000 tracking-tight drop-shadow-2xl">
            <span className="text-white">Mais processos judiciais do que médicos no Brasil. Sua prática clínica está </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">protegida?</span>
          </h1>
          <p className="animate-scroll-reveal-up scroll-reveal scroll-stagger-2 text-lg sm:text-xl md:text-2xl text-gray-100 mb-10 leading-relaxed font-light font-inter max-w-4xl mx-auto transition-all duration-1000 drop-shadow-lg">
            A MedDefend é a primeira plataforma com inteligência artificial que transforma sua documentação médica em uma sólida defesa jurídica. Reduza o risco de litígios e dedique seu tempo ao que realmente importa{': '}seus pacientes.
          </p>
          <div className="animate-scroll-reveal-up scroll-reveal scroll-stagger-3">
            <Button asChild size="lg" className="bg-green-600 text-white hover:bg-green-700 px-10 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border-0 rounded-full font-semibold font-inter shadow-2xl">
              <a href="/checkout">Experimente agora</a>
            </Button>
          </div>
          <p className="animate-scroll-reveal-fade scroll-reveal scroll-stagger-4 text-sm text-gray-300 mt-6 font-light font-inter">
            Acesso completo. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
