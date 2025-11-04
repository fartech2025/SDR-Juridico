@echo off
setlocal EnableExtensions

echo Iniciando Vite (frontend)...
start "Vite Dev" cmd /c "cd /d ""%~dp0app"" && npm.cmd run dev"

echo Pronto. Vite iniciado.
exit /b 0

:fail
echo Falha ao iniciar serviços. Verifique a conexão de rede.
exit /b 1

