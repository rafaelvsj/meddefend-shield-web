
import { AlertTriangle } from 'lucide-react';

interface WarningHeaderProps {
  isVisible: boolean;
}

const WarningHeader = ({ isVisible }: WarningHeaderProps) => {
  return (
    <div className="text-center mb-16">
      <div className="flex items-center justify-center mb-6">
        <AlertTriangle className="h-12 w-12 text-red-400 mr-4 animate-pulse" />
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          A Epidemia Silenciosa que Ameaça a Medicina
        </h2>
      </div>
      <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
        A realidade da prática médica no Brasil mudou. A judicialização não é mais um risco 
        distante, é uma estatística alarmante.
      </p>
    </div>
  );
};

export default WarningHeader;
