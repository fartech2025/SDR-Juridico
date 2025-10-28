# BancoEnem - Extrator de Questões ENEM 2024

## 📝 Descrição
Sistema automatizado para extração e processamento de questões do ENEM 2024, gerando saídas estruturadas em JSON, SQL e imagens organizadas.

## 🚀 Funcionalidades
- ✅ Extração automática de questões de PDF
- ✅ Classificação temática inteligente (16 categorias)
- ✅ Processamento e marcação de imagens
- ✅ Exportação em múltiplos formatos (JSON, SQL)
- ✅ **Integração com Supabase** (banco na nuvem)
- ✅ **Sincronização automática** de dados
- ✅ **Backup e restauração** via Supabase
- ✅ Organização automática de arquivos

## 📂 Estrutura do Projeto
```
BancoEnem/
├── main.py                              # Script principal de extração
├── main_extended.py                     # Script com integração Supabase
├── supabase_integration.py             # Módulo de integração Supabase
├── supabase_setup.py                   # Configurador Supabase
├── test_project.py                      # Script de validação e testes
├── update_project.py                    # Script de atualização automática
├── requirements.txt                     # Dependências do projeto
├── README.md                            # Documentação
├── .gitignore                           # Configuração Git
├── .env                                 # Variáveis de ambiente (ignorado)
├── 2024_PV_impresso_D1_CD1.pdf         # PDF fonte do ENEM 2024
├── enem.db                              # Base de dados SQLite
└── output/                              # Pasta de saída
    ├── enem2024_lc_questions_content.json  # Dados estruturados JSON
    ├── enem2024_import.sql              # Script SQL de importação
    └── images/                          # Imagens extraídas e marcadas
        └── ENEM2024_LC_Q001_IMG01.png   # Exemplo de imagem
```

## 🛠️ Dependências
```bash
pip install -r requirements.txt
```

**Principais dependências:**
- PyMuPDF (extração de PDF)
- Pillow (processamento de imagens) 
- pandas (manipulação de dados)
- supabase (integração com banco na nuvem)
- python-dotenv (gerenciamento de variáveis)

## 📋 Como Usar

### Instalação Inicial
1. Clone ou baixe o projeto
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

### Uso Básico
1. Certifique-se que o arquivo `2024_PV_impresso_D1_CD1.pdf` está no diretório
2. Execute o script:
   ```bash
   python main.py
   ```
3. Os arquivos processados serão salvos na pasta `output/`

### Scripts Auxiliares
- **Validação do projeto:**
  ```bash
  python3 test_project.py
  ```
- **Atualização automática:**
  ```bash
  python3 update_project.py
  ```

### 🌐 Integração com Supabase
- **Configuração inicial:**
  ```bash
  python3 supabase_setup.py
  ```
- **Processo completo (extração + sync):**
  ```bash
  python3 main_extended.py --full
  ```
- **Apenas sincronização:**
  ```bash
  python3 main_extended.py --sync
  ```
- **Status do sistema:**
  ```bash
  python3 main_extended.py --status
  ```

## 🎯 Categorias Temáticas Detectadas
- Cultura popular (Parintins)
- Saúde (câncer de mama)
- Literatura / Poema
- Variação linguística regional
- Esporte e Inclusão (paralímpico)
- Música e Instrumentos
- Mídias sociais / Letramento midiático
- Esporte / Programa olímpico
- Arte / Fotografia
- Tecnologia linguística / Línguas indígenas
- Campanha social / Doação
- Prosa contemporânea / Dramaticidade
- Questões de línguas estrangeiras (inglês/espanhol)
- Debate contemporâneo
- Interpretação de texto (categoria geral)

## 📊 Saídas Geradas
- **JSON**: Estrutura completa com metadados, conteúdo e referências de imagens
- **SQL**: Script pronto para importação em banco de dados
- **Imagens**: Arquivos PNG com identificação visual automática

## 🔧 Versão
- **Atual**: 1.0.0 (Outubro 2024)
- **Python**: 3.x
- **Status**: Funcional e testado

## 📈 Estatísticas
- Questões processadas: Variável conforme PDF
- Formatos de saída: 3 (JSON, SQL, PNG)
- Categorias temáticas: 16
- Processamento: Automático

## ☁️ Integração Supabase

### Configuração
1. **Crie uma conta no Supabase** (https://supabase.com)
2. **Crie um novo projeto**
3. **Configure as credenciais:**
   ```bash
   python3 supabase_setup.py
   ```
4. **Crie a tabela no SQL Editor do Supabase** (SQL é gerado automaticamente)

### Funcionalidades
- ✅ **Sincronização bidirecional** (local ↔ nuvem)
- ✅ **Backup automático** dos dados
- ✅ **Versionamento** com timestamps
- ✅ **Estatísticas em tempo real**
- ✅ **Estrutura otimizada** com índices

### Estrutura da Tabela
```sql
enem_questions (
  id TEXT PRIMARY KEY,           -- ID único da questão
  number INTEGER,                -- Número da questão
  page INTEGER,                  -- Página do PDF
  theme TEXT,                    -- Tema classificado
  text_full TEXT,               -- Texto completo
  content JSONB,                -- Conteúdo estruturado
  images JSONB,                 -- Metadados das imagens
  created_at TIMESTAMP,         -- Data de criação
  updated_at TIMESTAMP          -- Data de atualização
)
```

### Comandos Úteis
```bash
# Status completo
python3 main_extended.py --status

# Processo completo (extração + sync)
python3 main_extended.py --full

# Apenas sincronização para Supabase
python3 main_extended.py --sync

# Configuração interativa
python3 supabase_setup.py
```