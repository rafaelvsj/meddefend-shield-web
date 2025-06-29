
const FooterSection = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo e Tagline */}
          <div>
            <div className="flex items-center space-x-3 mb-4 group">
              <img 
                src="/lovable-uploads/bdba2116-5b5a-4dd6-b6e8-5eb4cd0eb9bb.png" 
                alt="MedDefend Logo" 
                className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-300">MedDefend</span>
            </div>
            <p className="text-blue-200">Protegendo quem cuida.</p>
          </div>

          {/* Navegação */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Navegação</h4>
            <div className="space-y-2">
              <a href="#home" className="block text-blue-200 hover:text-white transition-colors duration-300">Início</a>
              <a href="#sobre" className="block text-blue-200 hover:text-white transition-colors duration-300">Sobre</a>
              <a href="#funcionalidades" className="block text-blue-200 hover:text-white transition-colors duration-300">Funcionalidades</a>
              <a href="#precos" className="block text-blue-200 hover:text-white transition-colors duration-300">Preços</a>
              <a href="#contato" className="block text-blue-200 hover:text-white transition-colors duration-300">Contato</a>
              <a href="/login" className="block text-blue-200 hover:text-white transition-colors duration-300">Login</a>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contato</h4>
            <div className="space-y-2">
              <a href="mailto:suporte@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors duration-300 hover:translate-x-2">
                suporte@meddefend.com.br
              </a>
              <a href="mailto:parcerias@meddefend.com.br" className="block text-blue-200 hover:text-white transition-colors duration-300 hover:translate-x-2">
                parcerias@meddefend.com.br
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-blue-200 text-sm">© 2025 MedDefend. Todos os direitos reservados.</p>
          <a href="/dashboard_admin.html" className="text-blue-200 hover:text-white text-sm transition-all duration-300 mt-4 md:mt-0 hover:scale-105">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
