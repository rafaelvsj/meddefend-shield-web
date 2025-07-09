import { Mail, Phone, MapPin, Shield, Scale, Cookie } from 'lucide-react';
const FooterSection = () => {
  return <footer className="bg-gradient-to-b from-black via-gray-950 to-slate-950 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="mb-6">
              <img src="/lovable-uploads/38d87268-cc87-427b-8e27-bf6629d3ade4.png" alt="MedDefend Logo" className="h-10 w-10 mb-2" />
              <span className="text-2xl font-bold font-outfit text-white">MedDefend</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              A primeira plataforma com IA especializada em documentação médica defensiva. 
              Protegendo médicos brasileiros desde 2024.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#home" className="text-gray-300 hover:text-white transition-colors">Início</a></li>
              <li><a href="#sobre" className="text-gray-300 hover:text-white transition-colors">Sobre</a></li>
              <li><a href="#funcionalidades" className="text-gray-300 hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#precos" className="text-gray-300 hover:text-white transition-colors">Preços</a></li>
              <li><a href="#contato" className="text-gray-300 hover:text-white transition-colors">Contato</a></li>
              <li><a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Política de Privacidade</span>
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <Scale className="h-4 w-4" />
                  <span>Termos de Uso</span>
                </a>
              </li>
              <li>
                <a href="/cancellation" className="text-gray-300 hover:text-white transition-colors">
                  Cancelamento e Reembolso
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <Cookie className="h-4 w-4" />
                  <span>Política de Cookies</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>suporte@meddefend.tech</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300">
                <Phone className="h-4 w-4" />
                <span>(61) 98540-3873</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-300">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Brasília, DF<br />Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 MedDefend. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
              <span className="text-gray-400">CNPJ: XX.XXX.XXX/0001-XX</span>
              <span className="text-gray-400">Feito com ❤️ para médicos brasileiros</span>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default FooterSection;