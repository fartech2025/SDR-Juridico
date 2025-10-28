# BancoEnem - Extrator de Questões ENEM 2024

## 📝 Descrição
Sistema automatizado para extração e processamento de questões do ENEM 2024, gerando saídas estruturadas em JSON, SQL e imagens organizadas.

## 🚀 Funcionalidades
- ✅ Extração automática de questões de PDF
- ✅ Classificação temática inteligente (16 categorias)
- ✅ Processamento e marcação de imagens
- ✅ Exportação em múltiplos formatos (JSON, SQL)
- ✅ Organização automática de arquivos

## 📂 Estrutura do Projeto
```
BancoEnem/
├── main.py                              # Script principal de extração
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
pip install PyMuPDF Pillow pandas
```

## 📋 Como Usar
1. Certifique-se que o arquivo `2024_PV_impresso_D1_CD1.pdf` está no diretório
2. Execute o script:
   ```bash
   python main.py
   ```
3. Os arquivos processados serão salvos na pasta `output/`

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