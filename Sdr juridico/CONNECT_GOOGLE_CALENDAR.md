# 🚀 Conectar Google Calendar - Guia Rápido

Agora ficou **super simples** conectar Google Calendar!

## ⚡ Comando Único:

```bash
npm run connect:google
```

É isso! Apenas execute este comando e siga as instruções na tela.

## 📋 O que o comando faz:

1. ✅ Carrega as variáveis de ambiente do projeto
2. ✅ Verifica se você está logado
3. ✅ Cria a integração automaticamente
4. ✅ Gera o link de vinculação com Google
5. ✅ Mostra as instruções finais

## 🔗 Fluxo Completo:

1. **Execute:** `npm run connect:google`
2. **Você verá um link OAuth** - cole no navegador
3. **Autorize no Google** - clique em "Autorizar"
4. **Será redirecionado** para Configurações
5. **Volta para a Agenda** e tente gerar um Google Meet! 🎉

## ⚠️ Pré-requisitos:

- ✅ Já estar logado na aplicação web (http://localhost:5174)
- ✅ Estar em uma organização
- ✅ Ter credenciais Google configuradas no Google Cloud Console

## 🆘 Se der erro:

### "Você não está logado"
→ Faça login primeiro em http://localhost:5174

### "Organização não encontrada"
→ Você precisa estar em uma organização. Acesse http://localhost:5174 e crie uma.

### "Variáveis Supabase não encontradas"
→ Verifique se o arquivo `.env` existe na raiz do projeto com:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 📚 Outros Comandos Disponíveis:

```bash
# Setup rápido com suas próprias credenciais Google
npm run setup:google:quick

# Diagnóstico do Google Calendar
npm run diagnose:google-calendar

# Testes do Google Calendar
npm run test:google-calendar
```

---

**Pronto? Execute:** `npm run connect:google` 🚀
