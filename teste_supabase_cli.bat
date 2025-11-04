@echo off
setlocal EnableExtensions

REM Este arquivo foi descontinuado pois o projeto usa Supabase Cloud
REM Não usamos mais Supabase local ou Docker.

echo.
echo ====================================
echo Projeto ENEM - Supabase Cloud
echo ====================================
echo.
echo O projeto esta configurado para usar Supabase Cloud.
echo Nao ha instancia local do Supabase.
echo Nao precisa de Docker ou qualquer containeR.
echo.
echo Para testar, execute:
echo   cd app && npm run dev
echo.
echo Acesse http://localhost:5173 no seu navegador.
echo.
echo Para criar as funcoes RPC faltantes:
echo   1. Abra https://supabase.com/dashboard
echo   2. SQL Editor - New Query
echo   3. Cole: SQL_CRIAR_FUNCAO_GET_ALL_TABLES.sql
echo   4. RUN
echo   5. Cole: SQL_CRIAR_FUNCAO_PG_FOREIGN_KEYS.sql
echo   6. RUN
echo.
pause
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

