
import { Card, CardContent } from '@/components/ui/card';

interface RealCasesProps {
  isVisible: boolean;
}

const RealCases = ({ isVisible }: RealCasesProps) => {
  return (
    <div className={`mb-16 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h3 className="text-2xl font-bold text-center mb-8 text-white">Casos Reais Internacionais</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-red-400 mb-2">US$ 216,8 mi</div>
            <p className="text-gray-300">EUA 2023 - Documentação inadequada de AVC</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-4xl font-bold text-red-400 mb-2">US$ 101 mi</div>
            <p className="text-gray-300">EUA 2022 - Registros médicos inadequados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealCases;
