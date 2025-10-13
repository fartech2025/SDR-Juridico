@echo off
setlocal EnableExtensions

REM --------------------------------------------------------------
REM  Teste de Conexão Supabase Local + Vite
REM  1) Inicia Supabase via CLI
REM  2) Aguarda containers subirem
REM  3) Faz health check no endpoint REST
REM  4) Mostra status e mantém janela aberta
REM --------------------------------------------------------------

set "WORKDIR=%~dp0"
set "ANON_KEY="
set "SUPABASE_URL=http://localhost:54321"
set "CHECK_URL=%SUPABASE_URL%/rest/v1/?apikey="

echo [1/5] Iniciando Supabase local...
call npx.cmd supabase@latest start --no-verify >nul 2>&1
if errorlevel 1 (
  echo ERRO: Nao foi possivel iniciar o Supabase.
  echo Verifique se o Docker Desktop esta aberto e rodando.
  goto pause_exit
)

echo [2/5] Aguardando services subirem...
REM Aguarda ate 30s
set /a "__wait=0"
:wait_loop
if %__wait% GEQ 30 goto timeout
timeout /t 1 >nul
set /a "__wait+=1"

REM Checa se o container esta de pe (API)
for /f "tokens=1" %%i in ('docker ps --filter "name=supabase-local-dev-api" --format "{{.Names}}"') do (
  if /I "%%i"=="supabase-local-dev-api" goto health_check
)
goto wait_loop

:timeout
echo ERRO: Timeout esperando o container supabase-local-dev-api subir.
goto stop_and_exit

:health_check
echo [3/5] Obtendo anon key local...
for /f "tokens=2 delims==" %%i in ('npx.cmd supabase@latest status --output env ^| findstr /C:"SUPABASE_ANON_KEY"') do set "ANON_KEY=%%i"
if not defined ANON_KEY (
  echo ERRO: Nao foi possivel ler a anon key do status.
  goto stop_and_exit
)

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

