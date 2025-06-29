
interface ScenarioDescriptionProps {
  isVisible: boolean;
}

const ScenarioDescription = ({ isVisible }: ScenarioDescriptionProps) => {
  return (
    <div className={`bg-gray-800 p-8 rounded-lg mb-16 border-l-4 border-red-600 shadow-lg transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <p className="text-lg leading-relaxed mb-4 text-gray-200">
        <strong className="text-red-400">Imagine:</strong> Um médico utiliza Claude para redigir um relatório. A IA gera texto fluente, mas contém uma <span className="text-red-400 font-bold">alucinação</span> - afirma que o paciente 'não apresenta alergias' quando ele tem alergia grave à penicilina.
      </p>
      <p className="text-lg leading-relaxed text-gray-200">
        Meses depois, outro médico prescreve penicilina baseado nessa documentação. <span className="text-red-400 font-bold">Resultado: choque anafilático e processo milionário.</span>
      </p>
    </div>
  );
};

export default ScenarioDescription;
