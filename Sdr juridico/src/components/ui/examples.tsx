/**
 * Exemplos de Uso dos Componentes UI
 * 
 * Este arquivo demonstra como usar os componentes do Design System
 * em páginas e formulários reais do projeto.
 */

import { useState } from 'react'
import { Search, Mail, Plus, Edit2, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Select,
  Badge,
  Alert,
  Spinner,
} from '@/components/ui'

// ===== EXEMPLO 1: Formulário de Contato =====
export function ExampleContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setShowSuccess(true)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Entre em Contato</CardTitle>
      </CardHeader>

      <CardBody>
        {showSuccess && (
          <Alert 
            variant="success" 
            title="Mensagem Enviada!"
            onClose={() => setShowSuccess(false)}
          >
            Entraremos em contato em breve.
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Digite seu nome..."
            required
            error={errors.name}
          />

          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            icon={<Mail className="w-4 h-4" />}
            required
            error={errors.email}
            helperText="Usaremos para responder sua mensagem"
          />

          <Select label="Assunto" required>
            <option value="">Selecione um assunto...</option>
            <option value="info">Informações</option>
            <option value="support">Suporte</option>
            <option value="bug">Reportar Bug</option>
          </Select>

          <Textarea
            label="Mensagem"
            placeholder="Digite sua mensagem..."
            rows={5}
            required
            error={errors.message}
          />
        </form>
      </CardBody>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="ghost" type="button">
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          type="submit"
          loading={isSubmitting}
        >
          Enviar Mensagem
        </Button>
      </CardFooter>
    </Card>
  )
}

// ===== EXEMPLO 2: Lista de Processos =====
export function ExampleProcessList() {
  const processes = [
    { id: 1, number: '1234567-89.2024.8.26.0100', status: 'active', priority: 'high' },
    { id: 2, number: '9876543-21.2024.8.26.0100', status: 'pending', priority: 'medium' },
    { id: 3, number: '5555555-55.2024.8.26.0100', status: 'closed', priority: 'low' },
  ]

  const statusMap = {
    active: { label: 'Ativo', variant: 'success' as const },
    pending: { label: 'Pendente', variant: 'warning' as const },
    closed: { label: 'Encerrado', variant: 'neutral' as const },
  }

  const priorityMap = {
    high: { label: 'Alta', variant: 'danger' as const },
    medium: { label: 'Média', variant: 'warning' as const },
    low: { label: 'Baixa', variant: 'info' as const },
  }

  return (
    <div className="space-y-4">
      {/* Header com busca */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">Processos</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Buscar processo..."
            icon={<Search className="w-4 h-4" />}
          />
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Lista de cards */}
      <div className="grid gap-4">
        {processes.map(process => (
          <Card key={process.id} hover>
            <CardBody className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold text-text">
                    {process.number}
                  </span>
                  <Badge variant={statusMap[process.status].variant}>
                    {statusMap[process.status].label}
                  </Badge>
                  <Badge variant={priorityMap[process.priority].variant}>
                    Prioridade: {priorityMap[process.priority].label}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted">
                  Última atualização: há 2 horas
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<Edit2 className="w-4 h-4" />}
                >
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Excluir
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ===== EXEMPLO 3: Estado de Loading =====
export function ExampleLoadingState() {
  return (
    <Card className="max-w-md mx-auto">
      <CardBody className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" label="Carregando processos..." />
        
        <Alert variant="info" className="mt-6">
          Buscando informações do servidor...
        </Alert>
      </CardBody>
    </Card>
  )
}

// ===== EXEMPLO 4: Dashboard com Cards Interativos =====
export function ExampleDashboard() {
  const stats = [
    { label: 'Processos Ativos', value: 24, variant: 'success' as const },
    { label: 'Pendentes', value: 8, variant: 'warning' as const },
    { label: 'Atrasados', value: 3, variant: 'danger' as const },
    { label: 'Finalizados', value: 156, variant: 'info' as const },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label} hover interactive>
          <CardBody className="text-center py-6">
            <div className="text-4xl font-bold text-text mb-2">
              {stat.value}
            </div>
            <div className="text-sm text-text-muted mb-3">
              {stat.label}
            </div>
            <Badge variant={stat.variant}>
              Ver detalhes
            </Badge>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

// ===== EXEMPLO 5: Usando Design Tokens Diretamente =====
export function ExampleDirectTokens() {
  return (
    <div className="space-y-4">
      {/* Cores de marca */}
      <div className="flex gap-2">
        <div className="h-20 w-20 rounded-lg bg-brand-primary" />
        <div className="h-20 w-20 rounded-lg bg-brand-secondary" />
        <div className="h-20 w-20 rounded-lg bg-brand-accent" />
      </div>

      {/* Cores semânticas */}
      <div className="flex gap-2">
        <div className="h-20 w-20 rounded-lg bg-success" />
        <div className="h-20 w-20 rounded-lg bg-warning" />
        <div className="h-20 w-20 rounded-lg bg-danger" />
        <div className="h-20 w-20 rounded-lg bg-info" />
      </div>

      {/* Superfícies */}
      <Card>
        <CardBody className="space-y-3">
          <div className="p-4 rounded-lg bg-surface">
            Surface (padrão)
          </div>
          <div className="p-4 rounded-lg bg-surface-2">
            Surface 2
          </div>
          <div className="p-4 rounded-lg bg-surface-alt">
            Surface Alternativa
          </div>
          <div className="p-4 rounded-lg bg-surface-raised">
            Surface Elevada
          </div>
        </CardBody>
      </Card>

      {/* Sombras */}
      <div className="flex gap-4">
        <div className="h-20 w-20 rounded-lg bg-surface shadow-xs" />
        <div className="h-20 w-20 rounded-lg bg-surface shadow-sm" />
        <div className="h-20 w-20 rounded-lg bg-surface shadow-md" />
        <div className="h-20 w-20 rounded-lg bg-surface shadow-lg" />
        <div className="h-20 w-20 rounded-lg bg-surface shadow-xl" />
      </div>
    </div>
  )
}
