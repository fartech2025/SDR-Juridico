@echo off
REM Script para executar migrações de simulados no Windows
REM Uso: run_migrations.bat

setlocal enabledelayedexpansion

echo.
echo =====================================
echo   Executar Migrações de Simulados
echo =====================================
echo.

REM Variáveis de cores
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RESET=[0m"

REM Diretório base
set "BASE_DIR=%cd%"

REM Verificar se estamos no diretório correto
if not exist "%BASE_DIR%\package.json" (
    echo Erro: package.json nao encontrado em %BASE_DIR%
    pause
    exit /b 1
)

echo Verificando npm...
where npm >nul 2>nul
if errorlevel 1 (
    echo Erro: npm nao esta instalado
    pause
    exit /b 1
)

echo OK - npm encontrado
echo.

echo Listando migrações...
if not exist "%BASE_DIR%\supabase\migrations" (
    echo Erro: Pasta supabase\migrations nao encontrada
    pause
    exit /b 1
)

for %%F in ("%BASE_DIR%\supabase\migrations\*.sql") do (
    echo   - %%~nxF
)
echo.

echo Executando migrações...
echo.

call npx supabase db push

if errorlevel 1 (
    echo Erro ao executar migrações
    pause
    exit /b 1
)

echo.
echo OK - Migrações executadas com sucesso!
echo.
echo Proximos passos:
echo 1. Iniciar servidor: npm run dev (em /app)
echo 2. Acessar: http://localhost:5173/painel-aluno
echo 3. Verificar console do navegador (F12)
echo 4. Clicar em 'Iniciar' para testar simulado
echo.

pause
