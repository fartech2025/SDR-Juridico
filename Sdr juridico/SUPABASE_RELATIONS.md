# Relações do Banco de Dados Supabase

## 📊 Estrutura de Tabelas e Relacionamentos

### 🔗 Tabelas Principais

#### 1. **orgs** (Organizações)
- `id` (PK)
- `nome`, `cnpj`, `plano`, `ativo`

#### 2. **USUARIOS** (Perfis de Usuários)
- `user_id` (PK) → Referência para auth.users
- `nome`, `email`, `telefone`, `avatar_url`

#### 3. **org_members** (Membros da Organização)
- `id` (PK)
- `org_id` → orgs.id
- `user_id` → USUARIOS.user_id
- `role`: admin | gestor | advogado | secretaria | leitura

#### 4. **clientes**
- `id` (PK)
- `org_id` → orgs.id
- `owner_user_id` → USUARIOS.user_id (responsável)
- `tipo`, `nome`, `documento`, `email`, `telefone`

#### 5. **leads**
- `id` (PK)
- `org_id` → orgs.id
- `cliente_id` → clientes.id (nullable)
- `assigned_user_id` → USUARIOS.user_id (responsável)
- `status`: novo | em_triagem | qualificado | nao_qualificado | convertido | perdido

#### 6. **casos**
- `id` (PK)
- `org_id` → orgs.id
- `cliente_id` → clientes.id
- `lead_id` → leads.id (nullable)
- `responsavel_user_id` → USUARIOS.user_id
- `status`: aberto | triagem | negociacao | contrato | andamento | encerrado | arquivado

#### 7. **documentos**
- `id` (PK)
- `org_id` → orgs.id
- `cliente_id` → clientes.id (nullable)
- `caso_id` → casos.id (nullable)
- `lead_id` → leads.id (nullable)
- `uploaded_by` → USUARIOS.user_id

#### 8. **agendamentos**
- `id` (PK)
- `org_id` → orgs.id
- `cliente_id` → clientes.id (nullable)
- `caso_id` → casos.id (nullable)
- `lead_id` → leads.id (nullable)
- `owner_user_id` → USUARIOS.user_id

#### 9. **notas**
- `id` (PK)
- `org_id` → orgs.id
- `entidade`: cliente | caso | lead | documento
- `entidade_id`: ID da entidade relacionada
- `created_by` → USUARIOS.user_id

#### 10. **conversas**
- `id` (PK)
- `org_id` → orgs.id
- `cliente_id` → clientes.id (nullable)
- `caso_id` → casos.id (nullable)
- `lead_id` → leads.id (nullable)
- `canal`: whatsapp | email | telefone | webchat | outro

#### 11. **mensagens**
- `id` (PK)
- `org_id` → orgs.id
- `conversa_id` → conversas.id
- `direction`: in | out

#### 12. **integrations**
- `id` (PK)
- `org_id` → orgs.id
- `provider`: datajud | avisa | evolution | twilio | google_calendar | whatsapp

---

## 🔄 Queries com Relações Implementadas

### **Leads**
```typescript
.select('*, cliente:clientes(nome), assigned_user:USUARIOS!assigned_user_id(nome)')
```

### **Clientes**
```typescript
.select('*, owner_user:USUARIOS!owner_user_id(nome)')
```

### **Casos**
```typescript
.select('*, cliente:clientes(nome), lead:leads(nome), responsavel:USUARIOS!responsavel_user_id(nome)')
```

### **Documentos**
```typescript
.select('*, cliente:clientes(nome), caso:casos(titulo), lead:leads(nome), uploader:USUARIOS!uploaded_by(nome)')
```

### **Agendamentos**
```typescript
.select('*, cliente:clientes(nome), caso:casos(titulo), lead:leads(nome), owner:USUARIOS!owner_user_id(nome)')
```

---

## 📋 Fluxo de Dados

```
Lead (novo contato)
    ↓
Cliente (convertido)
    ↓
Caso (processo/demanda)
    ↓ ↓ ↓
Documentos | Agendamentos | Notas
```

---

## 🔐 Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas baseadas em:
- `org_id`: Usuário só vê dados da sua organização
- `user_id`: Usuário só vê seus próprios dados ou dados públicos da org

---

## 📊 Services Atualizados

✅ **leadsService.ts** - Relações: cliente, assigned_user
✅ **clientesService.ts** - Relações: owner_user
✅ **casosService.ts** - Relações: cliente, lead, responsavel
✅ **documentosService.ts** - Relações: cliente, caso, lead, uploader
✅ **agendaService.ts** - Relações: cliente, caso, lead, owner
