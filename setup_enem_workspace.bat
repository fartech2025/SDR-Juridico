@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ==============================================================
REM  ENEM Workspace Setup - React (Vite) + Supabase + VS Code
REM  Uso: setup_enem_workspace.bat [--start] [--reset-db] [--types]
REM        --start    Inicia o Supabase e o Vite (tarefas básicas)
REM        --reset-db Reseta o banco e aplica seed.sql (local)
REM        --types    Gera tipos TypeScript a partir do schema local
REM ==============================================================

set "ROOT=%~dp0"
pushd "%ROOT%" >nul 2>&1

echo.
echo [1/8] Verificando Node.js e Docker...
where node >nul 2>nul || (
  echo ERRO: Node.js nao encontrado no PATH. Instale o Node LTS em https://nodejs.org/ e reexecute.
  goto :EOF
)
where docker >nul 2>nul || (
  echo AVISO: Docker nao encontrado no PATH. Instale/abra o Docker Desktop para usar o Supabase local.
)

echo.
echo [2/8] Criando app React (Vite) se necessario...
if not exist "app\package.json" (
  call npm.cmd create vite@latest app -- --template react-ts || goto :fail
)

echo.
echo [3/8] Instalando dependencias do frontend...
pushd "app" >nul 2>&1
if not exist "node_modules" (
  call npm.cmd i || goto :fail
)
REM Garantir @supabase/supabase-js
findstr /I /C:"\"@supabase/supabase-js\"" package.json >nul 2>nul || (
  call npm.cmd i @supabase/supabase-js || goto :fail
)
popd >nul 2>&1

echo.
echo [4/8] Inicializando Supabase local (se necessario)...
if not exist "supabase\config.toml" (
  call npx.cmd supabase@latest init --yes || goto :fail
)

echo.
echo [5/8] Copiando seed SQL (se encontrado)...
set "SEED_SRC=%USERPROFILE%\Downloads\Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql"
if exist "%SEED_SRC%" (
  copy /Y "%SEED_SRC%" "supabase\seed.sql" >nul || goto :fail
  echo Copiado de "%SEED_SRC%" para "supabase\seed.sql".
) else if exist "Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql" (
  copy /Y "Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql" "supabase\seed.sql" >nul || goto :fail
  echo Copiado de "%CD%\Modulo_Inteligencia_Estudantil_ENEM_FINAL.sql" para "supabase\seed.sql".
) else (
  echo AVISO: Arquivo de seed nao encontrado. Coloque seu SQL em supabase\seed.sql para semear o banco.
)

echo.
echo [6/8] Criando configuracoes do VS Code (tarefas e debug)...
if not exist ".vscode" mkdir ".vscode" >nul 2>&1
REM tasks.json via bloco ECHO
> ".vscode\tasks.json" (
  echo {
  echo   "version": "2.0.0",
  echo   "tasks": [
  echo     {
  echo       "label": "Supabase: Start",
  echo       "type": "shell",
  echo       "command": "npx.cmd",
  echo       "args": ["supabase@latest", "start"],
  echo       "presentation": { "reveal": "always", "panel": "dedicated" }
  echo     },
  echo     {
  echo       "label": "Supabase: Stop",
  echo       "type": "shell",
  echo       "command": "npx.cmd",
  echo       "args": ["supabase@latest", "stop"],
  echo       "presentation": { "reveal": "always", "panel": "dedicated" }
  echo     },
  echo     {
  echo       "label": "DB: Reset + Seed",
  echo       "type": "shell",
  echo       "command": "npx.cmd",
  echo       "args": ["supabase@latest", "db", "reset"],
  echo       "options": { "cwd": "${workspaceFolder}" },
  echo       "presentation": { "reveal": "always", "panel": "dedicated" }
  echo     },
  echo     {
  echo       "label": "Types: Generate",
  echo       "type": "shell",
  echo       "command": "powershell",
  echo       "args": ["-NoProfile","-Command", "npx.cmd supabase@latest gen types typescript --local ^| Set-Content -Encoding UTF8 app/src/lib/database.types.ts"],
  echo       "options": { "cwd": "${workspaceFolder}" },
  echo       "presentation": { "reveal": "silent", "panel": "dedicated" }
  echo     },
  echo     {
  echo       "label": "Web: Dev",
  echo       "type": "shell",
  echo       "command": "npm.cmd",
  echo       "args": ["run", "dev"],
  echo       "options": { "cwd": "${workspaceFolder}/app" },
  echo       "isBackground": true,
  echo       "problemMatcher": { "owner": "vite", "pattern": [ { "regexp": "." } ], "background": { "activeOnStart": true, "beginsPattern": "VITE v", "endsPattern": "Local:" } },
  echo       "presentation": { "reveal": "always", "panel": "shared" }
  echo     }
  echo   ]
  echo }
)

REM launch.json via bloco ECHO
> ".vscode\launch.json" (
  echo {
  echo   "version": "0.2.0",
  echo   "configurations": [
  echo     { "name": "Web: Debug (Edge)", "type": "pwa-msedge", "request": "launch", "url": "http://localhost:5173", "webRoot": "${workspaceFolder}/app", "preLaunchTask": "Web: Dev" }
  echo   ]
  echo }
)

echo.
echo [7/8] Criando arquivo de ambiente e cliente Supabase no frontend...
if not exist "app\.env.local" (
  echo VITE_SUPABASE_URL=http://localhost:54321> "app\.env.local"
  echo VITE_SUPABASE_ANON_KEY=>> "app\.env.local"
)

if not exist "app\src\lib" mkdir "app\src\lib" >nul 2>&1
if not exist "app\src\lib\supabaseClient.ts" (
  echo import ^{ createClient ^} from '@supabase/supabase-js' >  "app\src\lib\supabaseClient.ts"
  echo const supabaseUrl = ^(import.meta as any^).env.VITE_SUPABASE_URL as string>> "app\src\lib\supabaseClient.ts"
  echo const supabaseAnonKey = ^(import.meta as any^).env.VITE_SUPABASE_ANON_KEY as string>> "app\src\lib\supabaseClient.ts"
  echo export const supabase = createClient^(supabaseUrl, supabaseAnonKey^)>> "app\src\lib\supabaseClient.ts"
)

echo.
echo [8/8] Etapas finais: use os scripts auxiliares para Start/Reset/Types.
echo - start_enem_services.bat  ^(inicia Supabase e Vite^)
echo - reset_enem_db.bat        ^(reset + seed local^)
echo - gen_types_enem.bat       ^(gerar tipos TypeScript^)

echo.
echo Setup concluido com sucesso.
echo Abra o VS Code nesta pasta e use as tarefas/depuracao prontas.
popd >nul 2>&1
exit /b 0

:fail
echo.
echo FALHA: O processo foi interrompido devido a um erro.
popd >nul 2>&1
exit /b 1
