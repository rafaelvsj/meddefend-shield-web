
import { Card, CardContent } from '@/components/ui/card';

interface BrazilianStatisticsProps {
  isVisible: boolean;
  processesVsDoctors: number;
}

const BrazilianStatistics = ({ isVisible, processesVsDoctors }: BrazilianStatisticsProps) => {
  return (
    <div className={`mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h3 className="text-2xl font-bold text-center mb-8 text-white">Realidade Brasileira (CFM/CNJ 2024)</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{processesVsDoctors.toLocaleString()}</div>
            <div className="text-sm text-blue-300">processos vs 562.206 médicos</div>
            <p className="text-xs text-blue-400 mt-2">Mais processos que médicos!</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">198%</div>
            <div className="text-sm text-blue-300">crescimento em processos</div>
            <p className="text-xs text-blue-400 mt-2">(2013-2022)</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">R$ 500 mil</div>
            <div className="text-sm text-blue-300">indenizações máximas</div>
            <p className="text-xs text-blue-400 mt-2">por erros médicos (STJ)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrazilianStatistics;
