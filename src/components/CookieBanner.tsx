
import { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const preferences = localStorage.getItem('cookiePreferences');
    if (!preferences) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    setIsVisible(false);
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="bg-gray-900/95 backdrop-blur-sm border-gray-700/50 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Cookie className="h-8 w-8 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-2">
                Cookies na MedDefend
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Usamos cookies para melhorar sua experiência médica, personalizar funcionalidades 
                e analisar o uso da plataforma. Alguns cookies são essenciais para o funcionamento básico.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={acceptAll}
                  className="bg-green-600 hover:bg-green-500 text-white text-sm"
                >
                  Aceitar Todos
                </Button>
                <Button 
                  onClick={acceptNecessary}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 text-sm"
                >
                  Apenas Necessários
                </Button>
                <Button 
                  asChild
                  variant="ghost"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  <a href="/cookies" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Personalizar</span>
                  </a>
                </Button>
              </div>
            </div>
            <Button
              onClick={dismiss}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieBanner;
