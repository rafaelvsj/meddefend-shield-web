import { Button } from '@/components/ui/button';
interface UrgencyCTAProps {
  isVisible: boolean;
}
const UrgencyCTA = ({
  isVisible
}: UrgencyCTAProps) => {
  return <div className={`text-center transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="bg-gray-800 p-8 rounded-lg border-2 border-gray-600 shadow-lg">
        <h3 className="text-3xl font-bold text-white mb-4">
          Pare de Arriscar Sua Carreira com IA Genérica
        </h3>
        <p className="text-lg text-gray-300 mb-6">
          A pergunta não é <strong>SE</strong> você será processado, mas <strong>QUANDO</strong>
        </p>
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <a href="#pricing">🛡️ Proteja-se Agora</a>
        </Button>
        <p className="text-sm text-gray-400 mt-4">Não deixe sua documentação se tornar sua maior vulnerabilidade</p>
      </div>
    </div>;
};
export default UrgencyCTA;