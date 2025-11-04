@echo off
setlocal EnableExtensions

REM Este arquivo foi descontinuado pois o projeto usa Supabase Cloud
REM e não mais Supabase local com Docker.

echo.
echo ====================================
echo Teste de Conexao Supabase Cloud
echo ====================================
echo.
echo O projeto esta configurado para usar Supabase Cloud.
echo Nenhuma instancia local do Supabase esta disponivel.
echo.
echo Para testar, execute:
echo   cd app && npm run dev
echo.
echo Acesse http://localhost:5173 no seu navegador.
echo.
pause

echo [4/5] Testando endpoint REST...
set "CURL_CMD=curl --silent --show-error --fail "%CHECK_URL%%ANON_KEY%""
%CURL_CMD% >nul 2>&1
if errorlevel 1 (
  echo ERRO: Falha ao acessar %SUPABASE_URL%/rest/v1/ com a anon key.
  goto stop_and_exit
)

echo [5/5] Supabase local respondendo corretamente.
echo URL: %SUPABASE_URL%
echo ANON KEY: %ANON_KEY%

goto pause_exit

:stop_and_exit
echo Encerrando Supabase local...
call npx.cmd supabase@latest stop >nul 2>&1

:pause_exit
echo.
echo Pressione qualquer tecla para sair.
pause >nul
exit /b 0

