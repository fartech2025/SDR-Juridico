# 🚀 GUIA DE INTEGRAÇÃO SUPABASE - CÓDIGO PRONTO

**Data:** 6 de janeiro de 2026  
**Status:** ✅ CRIADO (Aguardando Configuração de Credenciais)

---

## 📋 O QUE FOI CRIADO

### 1. ✅ Cliente Supabase
**Arquivo:** `src/lib/supabaseClient.ts`

```typescript
// Inicializa conexão com Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
```

**Tipos TypeScript:**
- `Leads` - Contatos quentes
- `Clientes` - Clientes jurídicos
- `Casos` - Processos/casos
- `Documentos` - Arquivos de casos
- `Agenda` - Reuniões e eventos

---

### 2. ✅ Serviço de Leads
**Arquivo:** `src/services/leadsService.ts`

**Métodos disponíveis:**

```typescript
// Buscar todos os leads
const leads = await leadsService.getLeads()

// Buscar um lead específico
const lead = await leadsService.getLead(id)

// Buscar leads por status
const emContato = await leadsService.getLeadsByStatus('em_contato')

// Buscar apenas leads quentes
const quentes = await leadsService.getHotLeads()

// Criar novo lead
const novoLead = await leadsService.createLead({
  nome: 'João Silva',
  email: 'joao@email.com',
  telefone: '11999999999',
  empresa: 'Tech Corp',
  status: 'novo',
  heat: 'quente',
})

// Atualizar lead
const atualizado = await leadsService.updateLead(id, {
  status: 'em_contato',
  heat: 'morno',
})

// Deletar lead
await leadsService.deleteLead(id)
```

---

### 3. ✅ Hook React `useLeads`
**Arquivo:** `src/hooks/useLeads.ts`

**Como usar no componente:**

```tsx
import { useLeads } from '@/hooks/useLeads'

export function LeadsPage() {
  // Hook carrega automaticamente ao montar
  const { 
    leads, 
    loading, 
    error, 
    fetchLeads,
    fetchByStatus,
    fetchHotLeads,
    createLead,
    updateLead,
    deleteLead,
  } = useLeads()

  // Estados:
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} />

  // Usar leads
  return (
    <div>
      {leads.map((lead) => (
        <LeadCard 
          key={lead.id} 
          lead={lead}
          onUpdate={(updates) => updateLead(lead.id, updates)}
          onDelete={() => deleteLead(lead.id)}
        />
      ))}
    </div>
  )
}
```

---

## 🔧 PASSO A PASSO - CONFIGURAÇÃO

### Passo 1: Credenciais Supabase

1. Abra https://supabase.com
2. Escolha seu projeto (ou crie novo)
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public** → será `VITE_SUPABASE_ANON_KEY`

### Passo 2: Variáveis de Ambiente

Na pasta do projeto:
```bash
cd "/Users/fernandodias/Projeto-ENEM/Sdr juridico"
```

Crie `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** Adicione `.env.local` ao `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

### Passo 3: Restart Server

```bash
# Parar servidor atual (Ctrl+C)
# Reiniciar
npm run dev
```

### Passo 4: Verificar Conexão

Abra DevTools (F12) e execute:
```javascript
// Testar se cliente está funcionando
import { supabase } from './src/lib/supabaseClient'
const { data, error } = await supabase.from('leads').select().limit(1)
console.log('Leads:', data)
console.log('Erro:', error)
```

---

## 📊 ESTRUTURA DO BANCO

### Tabela: `leads`

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  status TEXT DEFAULT 'novo',
  heat TEXT DEFAULT 'frio',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `clientes`

```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  cnpj TEXT UNIQUE,
  responsavel TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `casos`

```sql
CREATE TABLE casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID REFERENCES clientes(id),
  status TEXT DEFAULT 'aberto',
  prioridade TEXT DEFAULT 'media',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `documentos`

```sql
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  caso_id UUID REFERENCES casos(id),
  url TEXT NOT NULL,
  tipo TEXT,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `agenda`

```sql
CREATE TABLE agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  tipo TEXT DEFAULT 'reuniao',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 EXEMPLOS PRÁTICOS

### Exemplo 1: Listar Leads com Dark Mode + Font Scale

```tsx
import { useLeads } from '@/hooks/useLeads'
import { useFont } from '@/contexts/FontContext'
import { useTheme } from '@/contexts/ThemeContext'

export function LeadsPage() {
  const { leads, loading, error } = useLeads()
  const { fontSize } = useFont()
  const { isDark } = useTheme()

  return (
    <div style={{ fontSize: `${fontSize}px` }} 
         className={isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}>
      {leads.map((lead) => (
        <div key={lead.id} className="border rounded p-4 mb-2">
          <h3>{lead.nome}</h3>
          <p>{lead.email}</p>
          <span className={`
            px-2 py-1 rounded text-sm
            ${lead.heat === 'quente' ? 'bg-red-500' : 'bg-blue-500'}
          `}>
            {lead.heat}
          </span>
        </div>
      ))}
    </div>
  )
}
```

### Exemplo 2: Criar Novo Lead com Validação

```tsx
import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { toast } from 'sonner'

export function CreateLeadForm() {
  const { createLead } = useLeads()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    heat: 'frio' as const,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nome || !formData.email) {
      toast.error('Preencha nome e email')
      return
    }

    setLoading(true)
    try {
      await createLead({
        ...formData,
        status: 'novo',
      })
      toast.success('Lead criado com sucesso!')
      setFormData({ nome: '', email: '', telefone: '', empresa: '', heat: 'frio' })
    } catch (error) {
      toast.error('Erro ao criar lead')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nome"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Criando...' : 'Criar Lead'}
      </button>
    </form>
  )
}
```

### Exemplo 3: Filtrar Leads Quentes

```tsx
import { useLeads } from '@/hooks/useLeads'

export function HotLeadsWidget() {
  const { leads } = useLeads()
  
  const hotLeads = leads.filter(lead => lead.heat === 'quente')

  return (
    <div className="bg-linear-to-br from-red-500 to-red-600 p-6 rounded-lg text-white">
      <h2>🔥 Leads Quentes</h2>
      <p className="text-3xl font-bold">{hotLeads.length}</p>
      <ul className="mt-4 space-y-2">
        {hotLeads.map((lead) => (
          <li key={lead.id} className="text-sm">
            {lead.nome} - {lead.empresa}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## 🔐 Segurança

### RLS (Row Level Security) - Recomendado

```sql
-- Habilitar RLS na tabela leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver todos
CREATE POLICY "Users can view all leads" ON leads
FOR SELECT USING (auth.role() = 'authenticated');

-- Usuários autenticados podem inserir
CREATE POLICY "Users can insert leads" ON leads
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Usuários autenticados podem atualizar
CREATE POLICY "Users can update leads" ON leads
FOR UPDATE USING (auth.role() = 'authenticated');

-- Usuários autenticados podem deletar
CREATE POLICY "Users can delete leads" ON leads
FOR DELETE USING (auth.role() = 'authenticated');
```

### Políticas detalhadas por tabela (autenticados)

```sql
-- LEADS
alter table if exists public.leads enable row level security;
create policy "leads_select_authenticated" on public.leads for select using ( auth.role() = 'authenticated' );
create policy "leads_insert_authenticated" on public.leads for insert with check ( auth.role() = 'authenticated' );
create policy "leads_update_authenticated" on public.leads for update using ( auth.role() = 'authenticated' );
create policy "leads_delete_authenticated" on public.leads for delete using ( auth.role() = 'authenticated' );

-- CLIENTES
alter table if exists public.clientes enable row level security;
create policy "clientes_select_authenticated" on public.clientes for select using ( auth.role() = 'authenticated' );
create policy "clientes_insert_authenticated" on public.clientes for insert with check ( auth.role() = 'authenticated' );
create policy "clientes_update_authenticated" on public.clientes for update using ( auth.role() = 'authenticated' );
create policy "clientes_delete_authenticated" on public.clientes for delete using ( auth.role() = 'authenticated' );

-- CASOS
alter table if exists public.casos enable row level security;
create policy "casos_select_authenticated" on public.casos for select using ( auth.role() = 'authenticated' );
create policy "casos_insert_authenticated" on public.casos for insert with check ( auth.role() = 'authenticated' );
create policy "casos_update_authenticated" on public.casos for update using ( auth.role() = 'authenticated' );
create policy "casos_delete_authenticated" on public.casos for delete using ( auth.role() = 'authenticated' );

-- DOCUMENTOS
alter table if exists public.documentos enable row level security;
create policy "documentos_select_authenticated" on public.documentos for select using ( auth.role() = 'authenticated' );
create policy "documentos_insert_authenticated" on public.documentos for insert with check ( auth.role() = 'authenticated' );
create policy "documentos_update_authenticated" on public.documentos for update using ( auth.role() = 'authenticated' );
create policy "documentos_delete_authenticated" on public.documentos for delete using ( auth.role() = 'authenticated' );

-- AGENDA
alter table if exists public.agenda enable row level security;
create policy "agenda_select_authenticated" on public.agenda for select using ( auth.role() = 'authenticated' );
create policy "agenda_insert_authenticated" on public.agenda for insert with check ( auth.role() = 'authenticated' );
create policy "agenda_update_authenticated" on public.agenda for update using ( auth.role() = 'authenticated' );
create policy "agenda_delete_authenticated" on public.agenda for delete using ( auth.role() = 'authenticated' );
```

As mesmas políticas foram geradas como migração em supabase/migrations/20260106_rls_policies.sql. Para aplicar localmente:

```bash
npx supabase@latest db reset
```

### Variáveis de Ambiente

**Nunca** compartilhar `.env.local`:

```bash
# Adicionar ao .gitignore
.env
.env.local
.env.*.local
*.key
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Copiar URL e API Key do Supabase
- [ ] Criar arquivo `.env.local` com as credenciais
- [ ] Adicionar `.env.local` ao `.gitignore`
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Testar conexão no DevTools Console
- [ ] Usar `useLeads` em um componente
- [ ] Testar listar leads
- [ ] Testar criar lead
- [ ] Testar atualizar lead
- [ ] Testar deletar lead
- [ ] Implementar RLS no Supabase
- [ ] Criar hooks para Clientes, Casos, Documentos, Agenda
- [ ] Integrar formulários CRUD completos

---

## 🎯 PRÓXIMAS ETAPAS

### Fase 1: Leads (Agora)
- ✅ Cliente criado
- ✅ Serviço criado
- ✅ Hook criado
- ⏳ Integrar em página

### Fase 2: Clientes
- ⏳ Criar serviço `clientesService.ts`
- ⏳ Criar hook `useClientes.ts`
- ⏳ Integrar em página

### Fase 3: Casos
- ⏳ Criar serviço `casosService.ts`
- ⏳ Criar hook `useCasos.ts`
- ⏳ Integrar em página

### Fase 4: Documentos + Agenda
- ⏳ Criar serviço `documentosService.ts`
- ⏳ Criar serviço `agendaService.ts`
- ⏳ Criar hooks correspondentes

### Fase 5: Autenticação
- ⏳ Login com Supabase Auth
- ⏳ Logout
- ⏳ Proteção de rotas

---

## 🚀 STATUS

**Código:** ✅ PRONTO  
**Docs:** ✅ COMPLETO  
**Ação Necessária:** Configurar credenciais `.env.local`  
**Tempo Estimado:** 5 minutos de configuração

---

**Próximo:** Configure `.env.local` com suas credenciais Supabase e teste a conexão! 🎯
