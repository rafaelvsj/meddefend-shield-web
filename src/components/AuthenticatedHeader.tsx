import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AuthenticatedHeaderProps {
  scrollToSection: (sectionId: string) => void;
}

const AuthenticatedHeader = ({ scrollToSection }: AuthenticatedHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-transparent backdrop-blur-sm text-foreground fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4 group">
            <img 
              src="/lovable-uploads/6efd3d4d-8293-4655-ae74-c39d2bc96998.png" 
              alt="MedDefend Logo" 
              className="h-12 w-12 transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl"
            />
            <span className="text-xl md:text-2xl lg:text-3xl font-bold font-sabon bg-gradient-to-r from-gray-400 via-gray-200 to-white bg-clip-text text-transparent drop-shadow-lg tracking-wide">
              MedDefend
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Início</button>
            <button onClick={() => scrollToSection('sobre')} className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Sobre</button>
            <button onClick={() => scrollToSection('funcionalidades')} className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Funcionalidades</button>
            <button onClick={() => scrollToSection('precos')} className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Preços</button>
            <button onClick={() => scrollToSection('contato')} className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Contato</button>
            {user ? (
              <a href="/dashboard" className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Dashboard</a>
            ) : (
              <a href="/login" className="text-gray-200 hover:text-white transition-all duration-300 font-medium text-sm hover:scale-105">Login</a>
            )}
          </nav>

          {/* CTA Buttons - Conditional based on auth */}
          <div className="hidden md:flex gap-3">
            {user ? (
              <>
                <Button asChild className="bg-green-600 text-white hover:bg-green-700 transition-all duration-300 hover:scale-105 border-0 rounded-full px-6 py-2 text-sm font-semibold shadow-lg">
                  <a href="/checkout">Fazer Upgrade</a>
                </Button>
                <Button asChild className="bg-white text-black hover:bg-gray-100 transition-all duration-300 hover:scale-105 border-0 rounded-full px-6 py-2 text-sm font-semibold shadow-lg">
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </>
            ) : (
              <Button asChild className="bg-white text-black hover:bg-gray-100 transition-all duration-300 hover:scale-105 border-0 rounded-full px-6 py-2 text-sm font-semibold shadow-lg">
                <a href="/login">Acessar Plataforma</a>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden transition-transform duration-300 hover:scale-110 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-md animate-fade-in rounded-b-2xl border border-white/10">
            <div className="px-2 pt-2 pb-8 space-y-1">
              <button onClick={() => scrollToSection('home')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Início</button>
              <button onClick={() => scrollToSection('sobre')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Sobre</button>
              <button onClick={() => scrollToSection('funcionalidades')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Funcionalidades</button>
              <button onClick={() => scrollToSection('precos')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Preços</button>
              <button onClick={() => scrollToSection('contato')} className="block px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Contato</button>
              {user ? (
                <a href="/dashboard" className="block px-4 py-3 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Dashboard</a>
              ) : (
                <a href="/login" className="block px-4 py-3 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Login</a>
              )}
              <a href="/blog" className="block px-4 py-3 hover:bg-white/10 rounded-xl transition-all duration-300 font-medium text-sm text-gray-200 hover:text-white">Blog</a>
              
              {user ? (
                <>
                  <Button asChild className="w-full mt-2 bg-green-600 text-white hover:bg-green-700 rounded-full text-sm font-semibold">
                    <a href="/checkout">Fazer Upgrade</a>
                  </Button>
                  <Button asChild className="w-full mt-2 bg-white text-black hover:bg-gray-100 rounded-full text-sm font-semibold">
                    <a href="/dashboard">Dashboard</a>
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full mt-2 bg-white text-black hover:bg-gray-100 rounded-full text-sm font-semibold">
                  <a href="/login">Acessar Plataforma</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AuthenticatedHeader;