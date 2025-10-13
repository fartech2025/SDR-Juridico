@echo off
setlocal EnableExtensions

echo Iniciando Supabase local...
call npx.cmd supabase@latest start || goto :fail

echo Iniciando Vite (frontend)...
start "Vite Dev" cmd /c "cd /d ""%~dp0app"" && npm.cmd run dev"

echo Pronto. Supabase e Vite iniciados.
exit /b 0

:fail
echo Falha ao iniciar serviços. Verifique o Docker Desktop e a rede.
exit /b 1

