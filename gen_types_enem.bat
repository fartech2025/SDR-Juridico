@echo off
setlocal EnableExtensions

echo Gerando tipos TypeScript a partir do schema local...
call npx.cmd supabase@latest gen types typescript --local > "app\src\lib\database.types.ts"
if errorlevel 1 (
  echo Falha ao gerar tipos. Verifique se o Supabase local esta ativo.
  exit /b 1
)
echo Tipos gerados em app\src\lib\database.types.ts

