import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Trash2, Eye, Clock, CheckCircle, AlertCircle, Settings, RefreshCw, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PipelineTestPanel from "@/components/PipelineTestPanel";

interface KnowledgeBaseFile {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  status: string;
  content: string | null;
  created_at: string;
  processed_at: string | null;
}

const AdminKnowledgeBase = () => {
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewContent, setViewContent] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [qualityReport, setQualityReport] = useState<any>(null);
  const [selectedFileForQuality, setSelectedFileForQuality] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar arquivos da base de conhecimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConfiguration = async () => {
    setTesting(true);
    try {
      console.log('[AdminKnowledgeBase] Testando configuração do sistema...');
      
      // 1. Testar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Falha na autenticação: ' + (authError?.message || 'Usuário não encontrado'));
      }
      console.log('[AdminKnowledgeBase] ✅ Autenticação OK:', user.id);
      
      // 2. Testar inserção na knowledge_base
      console.log('[AdminKnowledgeBase] Testando inserção na knowledge_base...');
      
      // Verificar session e token
      const { data: session } = await supabase.auth.getSession();
      console.log('[AdminKnowledgeBase] 🔍 Session info:', {
        sessionExists: !!session.session,
        accessToken: session.session?.access_token ? 'EXISTS' : 'MISSING',
        userId: session.session?.user?.id,
        userEmail: session.session?.user?.email
      });
      
      const testRecord = {
        file_name: `teste-${Date.now()}.txt`,
        original_name: 'arquivo-teste.txt',
        file_type: 'text/plain',
        file_size: 123,
        status: 'pending',
        created_by: user.id
      };
      
      console.log('[AdminKnowledgeBase] 🔍 Tentando inserir registro:', testRecord);
      console.log('[AdminKnowledgeBase] 🔍 User ID do registro:', user.id);
      console.log('[AdminKnowledgeBase] 🔍 User ID da session:', session.session?.user?.id);
      
      const { data: insertData, error: insertError } = await supabase
        .from('knowledge_base')
        .insert(testRecord)
        .select()
        .single();
      
      console.log('[AdminKnowledgeBase] 📊 Resultado da inserção:', { insertData, insertError });
      
      if (insertError) {
        console.error('[AdminKnowledgeBase] ❌ ERRO CRÍTICO NA INSERÇÃO:', insertError);
        console.error('[AdminKnowledgeBase] ❌ Detalhes do erro:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        
        toast({
          title: "❌ FALHA NA INSERÇÃO",
          description: `Erro: ${insertError.message} | Código: ${insertError.code}`,
          variant: "destructive",
        });
        
        throw new Error('INSERÇÃO FALHOU: ' + insertError.message);
      }
      
      if (!insertData) {
        console.error('[AdminKnowledgeBase] ❌ ERRO: Inserção não retornou dados');
        throw new Error('Inserção não retornou dados');
      }
      
      console.log('[AdminKnowledgeBase] ✅ Inserção OK:', insertData);
      
      // 3. Verificar se o registro realmente existe
      console.log('[AdminKnowledgeBase] 🔍 Verificando se registro existe...');
      const { data: checkData, error: checkError } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', insertData.id)
        .single();
      
      if (checkError || !checkData) {
        console.error('[AdminKnowledgeBase] ❌ ERRO: Registro não encontrado após inserção');
        throw new Error('Registro não encontrado após inserção');
      }
      
      console.log('[AdminKnowledgeBase] ✅ Verificação OK:', checkData);
      
      // 4. Testar process-document
      console.log('[AdminKnowledgeBase] Testando process-document...');
      const { data: processData, error: processError } = await supabase.functions
        .invoke('process-document', {
          body: { fileId: insertData.id }
        });
      
      if (processError) {
        console.warn('[AdminKnowledgeBase] ⚠️ Process-document com erro:', processError);
      } else {
        console.log('[AdminKnowledgeBase] ✅ Process-document OK:', processData);
      }
      
      toast({
        title: "✅ TESTE PASSOU COMPLETAMENTE",
        description: `Auth: OK | Insert: OK | Verify: OK | Process: ${processError ? 'Erro' : 'OK'}`,
      });
      
      // Recarregar para mostrar o registro de teste
      await loadFiles();
      
    } catch (error) {
      console.error('[AdminKnowledgeBase] ❌ ERRO CRÍTICO NO TESTE:', error);
      console.error('[AdminKnowledgeBase] ❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('[AdminKnowledgeBase] ❌ Tipo do erro:', typeof error);
      console.error('[AdminKnowledgeBase] ❌ Detalhes completos:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        // TypeScript compatibility fix
      });
      
      toast({
        title: "❌ ERRO CRÍTICO DETECTADO",
        description: `${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    console.log(`[AdminKnowledgeBase] Iniciando upload de ${selectedFiles.length} arquivo(s)`);
    setUploading(true);
    
    try {
      // Verificar autenticação do usuário
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`[AdminKnowledgeBase] Usuário autenticado: ${user.id}`);
      
      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          console.log(`[AdminKnowledgeBase] [${index + 1}/${selectedFiles.length}] Processando: ${file.name}`);
          console.log(`- Tipo: ${file.type || 'desconhecido'}`);
          console.log(`- Tamanho: ${file.size} bytes`);
          
          // Gerar nome único para o arquivo
          const fileExt = file.name.split('.').pop() || 'bin';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${index}.${fileExt}`;
          console.log(`[AdminKnowledgeBase] Nome no storage: ${fileName}`);
          
          // Upload para storage
          console.log(`[AdminKnowledgeBase] Fazendo upload para storage...`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('knowledge-base')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`[AdminKnowledgeBase] Erro no upload para storage:`, uploadError);
            throw new Error(`Storage: ${uploadError.message}`);
          }

          console.log(`[AdminKnowledgeBase] Upload para storage bem-sucedido:`, uploadData);

          // Criar registro na tabela knowledge_base
          console.log(`[AdminKnowledgeBase] Criando registro na tabela...`);
          const knowledgeBaseRecord = {
            file_name: fileName,
            original_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            status: 'pending',
            created_by: user.id
          };

          const { data: insertData, error: insertError } = await supabase
            .from('knowledge_base')
            .insert(knowledgeBaseRecord)
            .select()
            .single();

          if (insertError) {
            console.error(`[AdminKnowledgeBase] Erro ao inserir no banco:`, insertError);
            
            // Tentar limpar arquivo do storage
            try {
              await supabase.storage.from('knowledge-base').remove([fileName]);
              console.log(`[AdminKnowledgeBase] Arquivo removido do storage devido ao erro no banco`);
            } catch (cleanupError) {
              console.error(`[AdminKnowledgeBase] Erro ao limpar storage:`, cleanupError);
            }
            
            throw new Error(`Database: ${insertError.message}`);
          }

          console.log(`[AdminKnowledgeBase] Registro criado:`, insertData);

          // Escolher função de processamento baseada na configuração
          const useOptimized = true; // Sempre usar versão otimizada
          const functionName = useOptimized ? 'process-document-optimized' : 'process-document';
          
          // Chamar processamento automático
          console.log(`[AdminKnowledgeBase] Chamando função ${functionName}...`);
          const { data: processData, error: processError } = await supabase.functions
            .invoke(functionName, {
              body: { fileId: insertData.id }
            });

          if (processError) {
            console.error(`[AdminKnowledgeBase] Erro no processamento:`, processError);
            
            // Atualizar status para erro
            await supabase
              .from('knowledge_base')
              .update({ status: 'error' })
              .eq('id', insertData.id);
              
            return { 
              success: false, 
              fileName: file.name, 
              error: `Processing: ${processError.message}` 
            };
          } else {
            console.log(`[AdminKnowledgeBase] Processamento iniciado:`, processData);
            return { success: true, fileName: file.name };
          }

        } catch (error) {
          console.error(`[AdminKnowledgeBase] Erro geral no arquivo ${file.name}:`, error);
          return { 
            success: false, 
            fileName: file.name, 
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
      });

      console.log(`[AdminKnowledgeBase] Executando ${uploadPromises.length} uploads em paralelo...`);
      
      // Fechar modal imediatamente após upload concluído
      setSelectedFiles([]);
      setIsDialogOpen(false);
      
      // Continuar processamento em background
      try {
        const results = await Promise.all(uploadPromises);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`[AdminKnowledgeBase] Resultados - Sucessos: ${successful.length}, Falhas: ${failed.length}`);
        
        if (failed.length > 0) {
          console.error('[AdminKnowledgeBase] Detalhes das falhas:', failed);
        }

        if (successful.length > 0) {
          toast({
            title: "Upload concluído",
            description: `${successful.length} arquivo(s) enviado(s) para processamento${failed.length > 0 ? `. ${failed.length} falharam.` : '.'}`,
          });
        }

        if (failed.length > 0) {
          toast({
            title: failed.length === results.length ? "Falha completa" : "Falha parcial",
            description: `${failed.length} arquivo(s) falharam no upload. Verifique o console para detalhes.`,
            variant: "destructive",
          });
        }

        console.log(`[AdminKnowledgeBase] Recarregando lista de arquivos...`);
        await loadFiles();
      } catch (bgError) {
        console.error('[AdminKnowledgeBase] Erro no processamento em background:', bgError);
        toast({
          title: "Erro no processamento",
          description: "Alguns arquivos podem não ter sido processados corretamente",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('[AdminKnowledgeBase] Erro crítico no upload:', error);
      toast({
        title: "Erro crítico",
        description: error instanceof Error ? error.message : "Falha crítica durante o upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      console.log('[AdminKnowledgeBase] Processo de upload finalizado');
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Deletar registro da tabela
      const { error: deleteError } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', fileId);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Arquivo removido com sucesso",
      });

      loadFiles();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover arquivo",
        variant: "destructive",
      });
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      console.log('[AdminKnowledgeBase] Iniciando retry de documentos falhados...');
      
      const { data, error } = await supabase.functions
        .invoke('retry-failed-documents', {
          body: { action: 'retry_failed' }
        });

      if (error) {
        throw new Error(`Erro no retry: ${error.message}`);
      }

      console.log('[AdminKnowledgeBase] Resultado do retry:', data);
      
      toast({
        title: "Retry concluído",
        description: data.message,
      });

      // Recarregar lista
      await loadFiles();
      
    } catch (error) {
      console.error('[AdminKnowledgeBase] Erro no retry:', error);
      toast({
        title: "Erro no retry",
        description: error instanceof Error ? error.message : "Falha ao reprocessar documentos",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleValidateQuality = async (fileId?: string) => {
    setValidating(true);
    try {
      const action = fileId ? 'validate_document' : 'validate_batch';
      const body = fileId ? { action, documentId: fileId } : { action, batchSize: 10 };

      console.log('[AdminKnowledgeBase] 🔍 Iniciando validação de qualidade...');
      
      const { data, error } = await supabase.functions
        .invoke('quality-validator', { body });

      if (error) {
        throw new Error(`Erro na validação: ${error.message}`);
      }

      console.log('[AdminKnowledgeBase] ✅ Resultado da validação:', data);
      
      if (fileId) {
        setQualityReport(data.report);
        setSelectedFileForQuality(fileId);
        toast({
          title: "✅ Validação Individual",
          description: `${data.report.documentName}: ${(data.report.overallQuality * 100).toFixed(1)}% | ${data.report.chunkCount} chunks | ${data.report.corruptedChunks} corrompidos`,
        });
      } else {
        toast({
          title: "✅ Validação em Lote",
          description: `${data.summary.totalDocuments} docs | Média: ${(data.summary.averageQuality * 100).toFixed(1)}% | ${data.summary.poorQuality} ruins`,
        });
        setQualityReport(data);
      }
      
    } catch (error) {
      console.error('[AdminKnowledgeBase] ❌ Erro na validação:', error);
      toast({
        title: "❌ Erro na validação",
        description: error instanceof Error ? error.message : "Falha ao validar qualidade",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCleanupCorrupted = async () => {
    try {
      console.log('[AdminKnowledgeBase] Iniciando limpeza de documentos corrompidos...');
      
      const { data, error } = await supabase.functions
        .invoke('quality-validator', {
          body: { action: 'cleanup_corrupted' }
        });

      if (error) {
        throw new Error(`Erro na limpeza: ${error.message}`);
      }

      toast({
        title: "Limpeza concluída",
        description: data.message,
      });

      await loadFiles();
      
    } catch (error) {
      console.error('[AdminKnowledgeBase] Erro na limpeza:', error);
      toast({
        title: "Erro na limpeza",
        description: error instanceof Error ? error.message : "Falha ao limpar documentos",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, createdAt?: string) => {
    const now = new Date();
    const created = createdAt ? new Date(createdAt) : now;
    const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" />Processado</Badge>;
      case 'processing':
        if (hoursSinceCreated > 1) {
          return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Travado ({hoursSinceCreated.toFixed(1)}h)</Badge>;
        }
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Processando</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Erro</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h2>
          <p className="text-muted-foreground">
            Gerencie documentos e conteúdo da base de conhecimento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={testConfiguration}
            disabled={testing}
          >
            <Settings className="w-4 h-4 mr-2" />
            {testing ? 'Testando...' : 'Testar Config'}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleRetryFailed}
            disabled={retrying}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retrying ? 'Reprocessando...' : 'Retry Falhas'}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => handleValidateQuality()}
            disabled={validating}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {validating ? 'Validando...' : 'Validar Qualidade'}
          </Button>

          <Button 
            variant="destructive" 
            onClick={handleCleanupCorrupted}
            size="sm"
          >
            Limpar Corrompidos
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Arquivos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Arquivos</DialogTitle>
                <DialogDescription>
                  Adicione novos documentos à base de conhecimento. Você pode selecionar múltiplos arquivos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Selecionar Arquivos</Label>
                  <Input
                    id="file"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Formatos suportados: PDF, DOC, DOCX, TXT, MD. Você pode selecionar múltiplos arquivos.
                  </p>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Arquivos selecionados:</p>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded">
                          <span>{file.name} ({formatFileSize(file.size)})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleFileUpload}
                    disabled={selectedFiles.length === 0 || uploading}
                  >
                    {uploading ? `Enviando ${selectedFiles.length} arquivo(s)...` : `Enviar ${selectedFiles.length} arquivo(s)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter(f => f.status === 'processed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter(f => f.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter(f => f.status === 'error').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Arquivos
            {files.filter(f => f.status === 'error').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {files.filter(f => f.status === 'error').length} com erro
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Lista de todos os documentos na base de conhecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.original_name}</TableCell>
                    <TableCell>{file.file_type}</TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(file.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {file.content && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setViewContent(file.content)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{file.original_name}</DialogTitle>
                                <DialogDescription>Conteúdo do arquivo</DialogDescription>
                              </DialogHeader>
                              <div className="whitespace-pre-wrap text-sm">
                                {viewContent}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id, file.file_name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Nova seção de teste do pipeline */}
      <PipelineTestPanel />
    </div>
  );
};

export default AdminKnowledgeBase;