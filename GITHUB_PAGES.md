# 🌐 GitHub Pages - BancoEnem

## 📋 Configuração do GitHub Pages

Este projeto está configurado para usar GitHub Pages para hospedar a interface web.

### 🚀 Como Configurar

#### 1. No seu repositório GitHub:
1. Vá em **Settings** > **Pages**
2. Em **Source**, selecione "**GitHub Actions**"
3. O workflow `.github/workflows/pages.yml` será executado automaticamente

#### 2. URLs de Acesso:
- **GitHub Pages**: `https://seu-usuario.github.io/BancoEnem/`
- **Domínio personalizado**: Configure em `CNAME` se tiver

### 📁 Arquivos para GitHub Pages

#### Arquivos Principais:
- `index.html` - Página principal da interface
- `_config.yml` - Configuração do Jekyll
- `.nojekyll` - Força uso de arquivos estáticos
- `README.md` - Documentação (visível no Pages)

#### Workflow:
- `.github/workflows/pages.yml` - Deploy automático

### 🔧 Personalizações

#### Para usar domínio personalizado:
1. Renomeie `CNAME.example` para `CNAME`
2. Adicione seu domínio no arquivo `CNAME`
3. Configure DNS do seu domínio

#### Para customizar a página:
- Edite `index.html` conforme necessário
- Ajuste `_config.yml` para suas configurações
- Adicione arquivos CSS/JS na pasta `assets/` se necessário

### 🌟 Funcionalidades da Página

#### Interface Web Completa:
- ✅ Visão geral do projeto
- ✅ Lista de comandos disponíveis
- ✅ Status do sistema em tempo real
- ✅ Métricas de performance
- ✅ Links para documentação

#### Responsiva:
- ✅ Desktop e mobile
- ✅ Navegação por abas
- ✅ Design moderno

### 🔍 Monitoramento

#### Verificar deploy:
1. Vá em **Actions** no GitHub
2. Verifique se o workflow "Deploy GitHub Pages" passou
3. Acesse a URL do GitHub Pages

#### Em caso de erro:
1. Verifique os logs no **Actions**
2. Confirme que o branch `main` tem as alterações
3. Verifique se Pages está habilitado nas configurações

### 📊 Estatísticas Atuais

- **95 questões** extraídas
- **12 temas** classificados
- **13 imagens** processadas
- **100%** taxa de sucesso nos testes

---

**🎯 Página GitHub Pages configurada e pronta para deploy!**