
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ScenarioDescription = () => {
  return (
    <div className="grid md:grid-cols-2 gap-8 mb-16">
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
        <CardContent className="p-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">A epidemia silenciosa</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Médicos brasileiros enfrentam uma crise sem precedentes: mais de <strong className="text-white">400 mil processos judiciais</strong> ativos 
            contra profissionais de saúde. Enquanto isso, ferramentas de IA generativa como ChatGPT e similares criam 
            <strong className="text-red-400"> informações médicas falsas</strong> em até 90% dos casos complexos.
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
        <CardContent className="p-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-400 mr-3" />
            <h3 className="text-2xl font-bold text-white">O risco está crescendo</h3>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Pacientes cada vez mais usam IA para questionar diagnósticos e tratamentos, criando expectativas 
            irreais e aumentando conflitos. <strong className="text-white">Sua documentação médica</strong> é sua única 
            proteção real contra alegações infundadas e processos frivolos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioDescription;
