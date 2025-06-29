import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PricingSectionProps {
  scrollToSection: (sectionId: string) => void;
}

const PricingSection = ({ scrollToSection }: PricingSectionProps) => {
  const [pricingToggle, setPricingToggle] = useState('annual');
  const [visibleElements, setVisibleElements] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="precos" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50" data-animate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-20 transition-all duration-1000 ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-6">
            Escolha o Plano Ideal para Sua Segurança
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 font-light mb-12 max-w-4xl mx-auto">
            Proteção jurídica inteligente para médicos modernos. Planos flexíveis com desconto anual.
          </p>
          
          {/* Toggle mensal/anual */}
          <div className="flex items-center justify-center mb-16">
            <span className={`mr-4 text-lg font-medium ${pricingToggle === 'monthly' ? 'text-blue-900' : 'text-slate-600'}`}>
              Mensal
            </span>
            <button
              onClick={() => setPricingToggle(pricingToggle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg ${
                pricingToggle === 'annual' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
                  pricingToggle === 'annual' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-4 text-lg font-medium ${pricingToggle === 'annual' ? 'text-blue-900' : 'text-slate-600'}`}>
              Anual
            </span>
            {pricingToggle === 'annual' && (
              <span className="ml-3 px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 text-sm font-semibold rounded-full border border-emerald-200">
                Economize 25%
              </span>
            )}
          </div>
        </div>

        {/* All plans in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Plano Free */}
          <Card className={`p-6 text-center bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl rounded-3xl transition-all duration-1000 delay-200 hover:scale-105 hover:shadow-2xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
              <p className="text-slate-600 mb-6 text-sm font-light">Para conhecer o básico</p>
              <div className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent mb-2">
                Gratuito
              </div>
              <div className="text-sm text-slate-500 mb-8 font-light">
                10 créditos únicos<br/>
                (não renováveis)
              </div>
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Assistente de Escrita Defensiva</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Acesso limitado à biblioteca</span>
                </div>
              </div>
              <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-105 rounded-xl font-medium" asChild>
                <a href="/dashboard_usuario.html">Começar Grátis</a>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Starter */}
          <Card className={`p-6 text-center bg-gradient-to-br from-white to-blue-50 border-0 shadow-xl rounded-3xl transition-all duration-1000 delay-300 hover:scale-105 hover:shadow-2xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-6 text-sm font-light">Ideal para consultório individual</p>
              <div className="mb-6">
                {pricingToggle === 'monthly' ? (
                  <div className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent">
                    R$ 49,90<span className="text-base text-slate-500">/mês</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-1">
                      R$ 37,43<span className="text-base text-slate-500">/mês</span>
                    </div>
                    <div className="text-sm text-slate-500 font-light">
                      R$ 449,10 cobrados anualmente
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-500 mb-8 font-light">
                50 créditos/mês
              </div>
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Assistente de Escrita Ilimitado</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Checklist Contextual Inteligente</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Biblioteca Completa de Modelos</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Histórico de Documentos</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 rounded-xl font-medium border-0 shadow-xl" asChild>
                <a href="/checkout.html">Assinar Agora</a>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Profissional */}
          <Card className={`p-6 text-center relative border-2 border-emerald-300 bg-gradient-to-br from-white to-green-50 shadow-xl rounded-3xl transition-all duration-1000 delay-400 hover:scale-105 hover:shadow-2xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">MAIS POPULAR</span>
            </div>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Profissional</h3>
              <p className="text-slate-600 mb-6 text-sm font-light">Para médicos em alta demanda</p>
              <div className="mb-6">
                {pricingToggle === 'monthly' ? (
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                    R$ 129,90<span className="text-base text-slate-500">/mês</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-1">
                      R$ 97,43<span className="text-base text-slate-500">/mês</span>
                    </div>
                    <div className="text-sm text-slate-500 font-light">
                      R$ 1.169,10 cobrados anualmente
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-500 mb-8 font-light">
                150 créditos/mês
              </div>
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Assistente de Escrita Ilimitado</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Checklist Contextual Inteligente</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Biblioteca Completa de Modelos</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Histórico de Documentos</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Suporte prioritário</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all duration-300 hover:scale-105 rounded-xl font-medium border-0 shadow-xl" asChild>
                <a href="/checkout.html">Assinar Agora</a>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Ultra */}
          <Card className={`p-6 text-center bg-gradient-to-br from-white to-purple-50 border-0 shadow-xl rounded-3xl transition-all duration-1000 delay-500 hover:scale-105 hover:shadow-2xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ultra</h3>
              <p className="text-slate-600 mb-6 text-sm font-light">Para uso intensivo</p>
              <div className="mb-6">
                {pricingToggle === 'monthly' ? (
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    R$ 349,90<span className="text-base text-slate-500">/mês</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent mb-1">
                      R$ 262,43<span className="text-base text-slate-500">/mês</span>
                    </div>
                    <div className="text-sm text-slate-500 font-light">
                      R$ 3.149,10 cobrados anualmente
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-500 mb-8 font-light">
                Uso justo ≈ 1.000 créditos¹
              </div>
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Assistente de Escrita Ilimitado</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Checklist Contextual Inteligente</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Biblioteca Completa de Modelos</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Histórico de Documentos</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Suporte prioritário</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Análise de uso personalizada</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 rounded-xl font-medium border-0 shadow-xl" asChild>
                <a href="/checkout.html">Assinar Agora</a>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Clínicas */}
          <Card className={`p-6 text-center bg-gradient-to-br from-white to-indigo-50 border-0 shadow-xl rounded-3xl transition-all duration-1000 delay-600 hover:scale-105 hover:shadow-2xl ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <CardContent className="p-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Clínicas</h3>
              <p className="text-slate-600 mb-6 text-sm font-light">Para equipes médicas</p>
              <div className="mb-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-1">
                  Sob consulta
                </div>
                <div className="text-sm text-slate-500 font-light">
                  A partir de R$ 1.490/mês<br/>
                  + R$ 2/usuário ativo
                </div>
              </div>
              <div className="text-sm text-slate-500 mb-8 font-light">
                Pool compartilhado<br/>
                para toda equipe
              </div>
              <div className="text-left mb-8 space-y-3">
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Todos os benefícios Pro</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Gestão de usuários</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Relatórios conformidade</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">API para integração</span>
                </div>
                <div className="flex items-center group">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 transition-all duration-300 group-hover:scale-125" />
                  <span className="text-sm text-slate-700 font-light">Suporte dedicado</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 rounded-xl font-medium border-0 shadow-xl" onClick={() => scrollToSection('contato')}>
                Solicitar Proposta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Notas e condições */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${visibleElements.has('precos') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-gradient-to-r from-white to-slate-50 p-8 rounded-3xl border border-slate-200 shadow-xl">
            <h4 className="font-semibold text-slate-900 mb-6 text-lg">Condições e Formas de Pagamento</h4>
            <div className="grid md:grid-cols-2 gap-8 text-sm text-slate-600 font-light">
              <div>
                <p className="mb-3"><strong className="font-medium">Formas de Pagamento:</strong> Cartão de Crédito, Pix, Apple Pay, Google Pay</p>
                <p className="mb-3"><strong className="font-medium">Cobrança:</strong> Recorrente mensal ou anual até cancelamento</p>
                <p><strong className="font-medium">Moeda:</strong> Todos os valores em Real Brasileiro (BRL)</p>
              </div>
              <div>
                <p className="mb-3"><strong className="font-medium">Política de Créditos:</strong> Créditos não utilizados não acumulam para o próximo período</p>
                <p className="mb-3"><strong className="font-medium">¹ Uso Justo:</strong> Após ~1.000 queries/mês aplicar throttling ou cobrar R$ 0,25 por lote adicional de 100 queries</p>
                <p><strong className="font-medium">Cancelamento:</strong> Sem multa, cancele quando quiser</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
