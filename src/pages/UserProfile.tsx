import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    specialization: 'Cardiologia'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Implementar salvamento dos dados do perfil
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Sidebar com avatar e informações básicas */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative mb-4 inline-block">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <h2 className="text-xl font-semibold">{formData.fullName || 'Usuário'}</h2>
                <p className="text-muted-foreground">{formData.specialization}</p>
                
                <div className="mt-4 space-y-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Verificado
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Informações pessoais */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais e dados de contato</CardDescription>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? 'Salvar' : 'Editar'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      placeholder="São Paulo, SP"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre você..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de atividade */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade da Conta</CardTitle>
                <CardDescription>Resumo da sua atividade na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">24</div>
                    <div className="text-sm text-muted-foreground">Análises realizadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">8</div>
                    <div className="text-sm text-muted-foreground">Modelos utilizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">96%</div>
                    <div className="text-sm text-muted-foreground">Taxa de precisão</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;