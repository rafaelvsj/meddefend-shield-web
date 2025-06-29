
import { AlertTriangle } from 'lucide-react';

interface WarningHeaderProps {
  isVisible: boolean;
}

const WarningHeader = ({ isVisible }: WarningHeaderProps) => {
  return (
    <div className={`text-center mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="flex items-center justify-center mb-8">
        <AlertTriangle className="h-16 w-16 text-red-600 mr-6" />
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Por Que LLMs Genéricas São Perigosas Na Medicina?
        </h2>
        <AlertTriangle className="h-16 w-16 text-red-600 ml-6" />
      </div>
      <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
        🚨 O Perigo Silencioso das LLMs Genéricas em Documentação Médica
      </p>
    </div>
  );
};

export default WarningHeader;
