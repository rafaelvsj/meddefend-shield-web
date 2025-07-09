import { useState } from 'react';
import { Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import Header from '@/components/sections/Header';
import FooterSection from '@/components/sections/FooterSection';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const scrollToSection = (sectionId: string) => {
    // No-op for blog page
  };

  const blogPosts = [
    {
      id: 1,
      title: 'Como a IA está Revolucionando a Medicina Defensiva',
      excerpt: 'Descubra como a inteligência artificial está transformando a prática médica e melhorando a qualidade do atendimento.',
      author: 'Dr. João Silva',
      date: '2024-03-15',
      readTime: '5 min',
      category: 'Tecnologia',
      tags: ['IA', 'Medicina', 'Inovação'],
      image: '/api/placeholder/400/250'
    },
    {
      id: 2,
      title: 'Linguagem Neutra na Medicina: Guia Completo',
      excerpt: 'Aprenda as melhores práticas para usar linguagem neutra e inclusiva em documentos médicos.',
      author: 'Dra. Maria Santos',
      date: '2024-03-10',
      readTime: '8 min',
      category: 'Boas Práticas',
      tags: ['Linguagem', 'Inclusão', 'Documentação'],
      image: '/api/placeholder/400/250'
    },
    {
      id: 3,
      title: 'Análise de Texto Médico: O que Você Precisa Saber',
      excerpt: 'Entenda a importância da análise de texto médico e como ela pode prevenir problemas legais.',
      author: 'Dr. Carlos Oliveira',
      date: '2024-03-05',
      readTime: '6 min',
      category: 'Análise',
      tags: ['Análise', 'Texto', 'Prevenção'],
      image: '/api/placeholder/400/250'
    },
    {
      id: 4,
      title: 'Ferramentas de IA para Profissionais da Saúde',
      excerpt: 'Conheça as principais ferramentas de inteligência artificial disponíveis para médicos.',
      author: 'Dra. Ana Costa',
      date: '2024-03-01',
      readTime: '7 min',
      category: 'Ferramentas',
      tags: ['IA', 'Ferramentas', 'Saúde'],
      image: '/api/placeholder/400/250'
    },
    {
      id: 5,
      title: 'Segurança de Dados na Medicina Digital',
      excerpt: 'Saiba como proteger dados sensíveis de pacientes em um mundo cada vez mais digital.',
      author: 'Dr. Pedro Almeida',
      date: '2024-02-28',
      readTime: '9 min',
      category: 'Segurança',
      tags: ['Segurança', 'Dados', 'LGPD'],
      image: '/api/placeholder/400/250'
    },
    {
      id: 6,
      title: 'O Futuro da Medicina Preventiva com IA',
      excerpt: 'Explore como a inteligência artificial está moldando o futuro da medicina preventiva.',
      author: 'Dra. Laura Mendes',
      date: '2024-02-25',
      readTime: '10 min',
      category: 'Futuro',
      tags: ['IA', 'Prevenção', 'Futuro'],
      image: '/api/placeholder/400/250'
    }
  ];

  const categories = ['Todos', 'Tecnologia', 'Boas Práticas', 'Análise', 'Ferramentas', 'Segurança', 'Futuro'];
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-medical-slate-50">
      <Header scrollToSection={scrollToSection} />
      
      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-medical-blue-600 to-medical-blue-700 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Blog MedDefend
              </h1>
              <p className="text-xl opacity-90 mb-8">
                Conteúdo especializado sobre medicina defensiva, inteligência artificial e melhores práticas médicas
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-medical-slate-400" />
                <Input
                  placeholder="Pesquisar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-medical-slate-200 focus:border-medical-blue-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 
                    "bg-medical-blue-600 hover:bg-medical-blue-700" : 
                    "border-medical-slate-200 text-medical-slate-600 hover:text-medical-slate-800"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-white border border-medical-slate-200 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="aspect-video bg-medical-slate-100 relative overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-medical-blue-600 text-white">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-medical-slate-800 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-medical-slate-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-medical-slate-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-medical-slate-500">
                        {post.readTime} de leitura
                      </span>
                      <Button 
                        size="sm" 
                        className="bg-medical-blue-600 hover:bg-medical-blue-700"
                      >
                        Ler mais
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          <section className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-medical-blue-600 to-medical-blue-700 text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Mantenha-se Atualizado
                </h2>
                <p className="text-medical-blue-100 mb-6">
                  Receba nossos artigos mais recentes diretamente em seu e-mail
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <Input
                    placeholder="Seu e-mail"
                    className="bg-white text-medical-slate-800 border-0"
                  />
                  <Button className="bg-white text-medical-blue-600 hover:bg-medical-slate-100">
                    Inscrever-se
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default Blog;