
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  scrollToSection: (sectionId: string) => void;
}

const Header = ({ scrollToSection }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-black/95 backdrop-blur-xl text-white shadow-2xl fixed w-full top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <img 
              src="/lovable-uploads/bdba2116-5b5a-4dd6-b6e8-5eb4cd0eb9bb.png" 
              alt="MedDefend Logo" 
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 brightness-0 invert"
            />
            <span className="text-2xl font-bold font-inter">
              MedDefend
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Início</button>
            <button onClick={() => scrollToSection('sobre')} className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Sobre</button>
            <button onClick={() => scrollToSection('funcionalidades')} className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Funcionalidades</button>
            <button onClick={() => scrollToSection('precos')} className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Preços</button>
            <button onClick={() => scrollToSection('contato')} className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Contato</button>
            <a href="/login" className="text-white/80 hover:text-white transition-all duration-300 font-medium text-sm">Login</a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button asChild className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all duration-300 hover:scale-105 border-0 rounded-xl px-6 text-sm font-medium">
              <a href="/checkout.html">Acessar Plataforma</a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden transition-transform duration-300 hover:scale-110"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/10 animate-fade-in rounded-b-2xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button onClick={() => scrollToSection('home')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm">Início</button>
              <button onClick={() => scrollToSection('sobre')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm">Sobre</button>
              <button onClick={() => scrollToSection('funcionalidades')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm">Funcionalidades</button>
              <button onClick={() => scrollToSection('precos')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm">Preços</button>
              <button onClick={() => scrollToSection('contato')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm">Contato</button>
              <a href="/login" className="block px-4 py-3 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-sm">Login</a>
              <Button asChild className="w-full mt-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl text-sm">
                <a href="/checkout.html">Acessar Plataforma</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
