@echo off
setlocal EnableExtensions

echo Resetando banco local e aplicando seed.sql...
call npx.cmd supabase@latest db reset
exit /b %ERRORLEVEL%

