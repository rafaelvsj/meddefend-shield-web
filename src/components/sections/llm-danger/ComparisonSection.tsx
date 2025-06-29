
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ComparisonSectionProps {
  isVisible: boolean;
}

const ComparisonSection = ({ isVisible }: ComparisonSectionProps) => {
  return (
    <div className={`mb-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h3 className="text-2xl font-bold text-center mb-8 text-white">A Diferença que Pode Salvar Sua Carreira</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {/* LLM Genérica */}
        <Card className="bg-red-900/20 border-red-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <h4 className="text-xl font-bold text-red-300">LLM Genérica (Risco Alto)</h4>
            </div>
            <div className="bg-gray-800 p-4 rounded border-l-2 border-red-400 mb-4">
              <p className="text-gray-200 italic">
                "Paciente com dor abdominal. Exame normal. Liberado."
              </p>
            </div>
            <div className="text-sm text-red-300">
              ❌ Vago e subjetivo<br/>
              ❌ Sem detalhes importantes<br/>
              ❌ Vulnerável juridicamente
            </div>
          </CardContent>
        </Card>

        {/* MedDefend */}
        <Card className="bg-green-900/20 border-green-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <h4 className="text-xl font-bold text-green-300">MedDefend (Proteção)</h4>
            </div>
            <div className="bg-gray-800 p-4 rounded border-l-2 border-green-400 mb-4">
              <p className="text-gray-200 text-sm">
                "Paciente masculino, 45 anos, dor em FID há 6h, intensidade 7/10. Exame: abdome flácido, McBurney negativo, Blumberg negativo. Alvarado 3/10 - baixa probabilidade apendicite. Orientado retorno se piora/febre. Paciente compreendeu conduta."
              </p>
            </div>
            <div className="text-sm text-green-300">
              ✅ Objetivo e detalhado<br/>
              ✅ Protocolo médico seguido<br/>
              ✅ Juridicamente defensável
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComparisonSection;
