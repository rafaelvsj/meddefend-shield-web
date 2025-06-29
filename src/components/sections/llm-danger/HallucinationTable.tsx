
interface HallucinationTableProps {
  isVisible: boolean;
  counters: {
    claudeSonnet: number;
    claudeOpus: number;
    gpt4: number;
    gpt4o: number;
    gemini: number;
    meddefend: number;
  };
}

const HallucinationTable = ({ isVisible, counters }: HallucinationTableProps) => {
  return (
    <div className={`mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h3 className="text-2xl font-bold text-center mb-8 text-white">Taxa de Alucinação por Modelo (Vectara 2025)</h3>
      <div className="overflow-x-auto">
        <table className="w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <thead className="bg-gray-900 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Modelo</th>
              <th className="px-6 py-4 text-center font-semibold">Taxa de Alucinação</th>
              <th className="px-6 py-4 text-center font-semibold">Risco</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="px-6 py-4 font-medium text-gray-200">Claude 3 Sonnet</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-red-400">{counters.claudeSonnet.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-red-900 text-red-300 rounded-full text-sm font-medium">Muito Alto</span></td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-6 py-4 font-medium text-gray-200">Claude 3 Opus</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-red-400">{counters.claudeOpus.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-orange-900 text-orange-300 rounded-full text-sm font-medium">Alto</span></td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-6 py-4 font-medium text-gray-200">GPT-4</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-yellow-400">{counters.gpt4.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-sm font-medium">Moderado</span></td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-6 py-4 font-medium text-gray-200">GPT-4o</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-yellow-400">{counters.gpt4o.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-yellow-900 text-yellow-300 rounded-full text-sm font-medium">Moderado</span></td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="px-6 py-4 font-medium text-gray-200">Gemini 2.0 Flash</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-blue-400">{counters.gemini.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm font-medium">Baixo</span></td>
            </tr>
            <tr className="bg-green-900/30 border-b border-green-700">
              <td className="px-6 py-4 font-bold text-green-300">MedDefend</td>
              <td className="px-6 py-4 text-center text-2xl font-bold text-green-400">&lt;{counters.meddefend.toFixed(1)}%</td>
              <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-green-800 text-green-200 rounded-full text-sm font-bold">Mínimo</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HallucinationTable;
