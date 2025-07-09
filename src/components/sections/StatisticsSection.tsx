
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const StatisticsSection = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [counters, setCounters] = useState({
    processes: 0,
    growth: 0,
    days: 0
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
    if (visibleElements.has('statistics')) {
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

      animateCounter(573, (val) => setCounters(prev => ({ ...prev, processes: val })));
      animateCounter(198, (val) => setCounters(prev => ({ ...prev, growth: val })));
      animateCounter(747, (val) => setCounters(prev => ({ ...prev, days: val })));
    }
  }, [visibleElements]);

  return (
    <section className="py-32 bg-black" data-animate id="statistics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-20 transition-all duration-1000 ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-inter text-white mb-8 tracking-tight">
            A Epidemia Silenciosa que Ameaça a Medicina
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 font-light font-inter max-w-4xl mx-auto leading-relaxed">
            A realidade da prática médica no Brasil mudou. A judicialização não é mais um risco distante, é uma estatística alarmante.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className={`text-center p-12 bg-gray-900 border-premium shadow-premium-lg rounded-3xl transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-2xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-inter text-gradient mb-6">+{counters.processes} mil</div>
              <div className="text-xl font-semibold font-inter text-white mb-4">Processos na Saúde</div>
              <p className="text-gray-300 font-light font-inter leading-relaxed">O número já supera o total de médicos ativos no país. É mais de 1 processo por médico.</p>
            </CardContent>
          </Card>

          <Card className={`text-center p-12 bg-gray-900 border-premium shadow-premium-lg rounded-3xl transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-2xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-inter text-gradient mb-6">{counters.growth}%</div>
              <div className="text-xl font-semibold font-inter text-white mb-4">Aumento de Litígios</div>
              <p className="text-gray-300 font-light font-inter leading-relaxed">Crescimento exponencial na última década, gerando um ambiente de constante insegurança.</p>
            </CardContent>
          </Card>

          <Card className={`text-center p-12 bg-gray-900 border-premium shadow-premium-lg rounded-3xl transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-2xl ${visibleElements.has('statistics') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-inter text-gradient mb-6">{counters.days} Dias</div>
              <div className="text-xl font-semibold font-inter text-white mb-4">Tempo Médio de Conclusão</div>
              <p className="text-gray-300 font-light font-inter leading-relaxed">Anos de desgaste financeiro e emocional para os profissionais envolvidos.</p>
            </CardContent>
          </Card>
        </div>

        <div className={`bg-gradient-to-r from-gray-800 to-gray-900 p-12 rounded-3xl text-center border-premium shadow-premium transition-all duration-1000 delay-800 hover:shadow-premium-lg ${visibleElements.has('statistics') ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-light font-inter italic leading-relaxed">
            "A principal vulnerabilidade não está no seu ato clínico, mas na forma como ele é documentado. Ambiguidade e omissões em prontuários são o principal combustível para processos judiciais."
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
