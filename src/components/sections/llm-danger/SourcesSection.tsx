
interface SourcesSectionProps {
  isVisible: boolean;
}

const SourcesSection = ({ isVisible }: SourcesSectionProps) => {
  return (
    <div className={`mb-16 bg-gray-800 p-6 rounded-lg border border-gray-700 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <h4 className="text-lg font-bold text-white mb-4">Fontes das Informações:</h4>
      <ul className="text-sm text-gray-300 space-y-1">
        <li>• Vectara Hallucination Leaderboard (github.com/vectara/hallucination-leaderboard)</li>
        <li>• Conselho Federal de Medicina + CNJ (via APM, 2024)</li>
        <li>• ChartRequest Medical Malpractice Database</li>
      </ul>
    </div>
  );
};

export default SourcesSection;
