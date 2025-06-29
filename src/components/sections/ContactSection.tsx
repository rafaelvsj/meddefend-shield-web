
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ContactSection = () => {
  const [visibleElements, setVisibleElements] = useState(new Set());
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    especialidade: '',
    mensagem: ''
  });

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    window.location.href = '/checkout.html';
  };

  return (
    <section id="contato" className="py-24 bg-gradient-to-br from-white to-slate-50" data-animate>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${visibleElements.has('contato') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Vamos Conversar?
          </h2>
          <p className="text-xl text-gray-600">
            Nossa equipe está pronta para tirar suas dúvidas, agendar uma demonstração ou discutir parcerias estratégicas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulário */}
          <div className={`transition-all duration-1000 delay-200 ${visibleElements.has('contato') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Envie sua mensagem</h3>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  value={formData.nome}
                  onChange={handleFormChange}
                  className="mt-1 transition-all duration-300 focus:scale-105"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                  className="mt-1 transition-all duration-300 focus:scale-105"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleFormChange}
                  className="mt-1 transition-all duration-300 focus:scale-105"
                />
              </div>

              <div>
                <Label htmlFor="especialidade">Especialidade Médica</Label>
                <Input
                  id="especialidade"
                  name="especialidade"
                  type="text"
                  value={formData.especialidade}
                  onChange={handleFormChange}
                  className="mt-1 transition-all duration-300 focus:scale-105"
                />
              </div>

              <div>
                <Label htmlFor="mensagem">Mensagem</Label>
                <Textarea
                  id="mensagem"
                  name="mensagem"
                  rows={4}
                  value={formData.mensagem}
                  onChange={handleFormChange}
                  className="mt-1 transition-all duration-300 focus:scale-105"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                Enviar e Ir para Checkout
              </Button>
            </form>
          </div>

          {/* Informações de Contato */}
          <div className={`space-y-8 transition-all duration-1000 delay-400 ${visibleElements.has('contato') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-0">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Suporte e Dúvidas Gerais</h4>
                <p className="text-gray-600 mb-4">
                  Para perguntas sobre a plataforma, planos ou suporte técnico, preencha o formulário ou envie um e-mail para:
                </p>
                <a href="mailto:suporte@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 hover:underline">
                  suporte@meddefend.com.br
                </a>
              </CardContent>
            </Card>

            <Card className="p-6 hover:scale-105 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-0">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Parcerias Estratégicas</h4>
                <p className="text-gray-600 mb-4">
                  Representa uma associação médica, seguradora ou instituição de saúde? Entre em contato para explorarmos oportunidades.
                </p>
                <a href="mailto:parcerias@meddefend.com.br" className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300 hover:underline">
                  parcerias@meddefend.com.br
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
