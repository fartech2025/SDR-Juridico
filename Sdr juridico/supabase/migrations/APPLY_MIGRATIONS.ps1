# Script PowerShell para aplicar migrações do SDR Juridico
# Data: 2026-02-03
# Uso: .\APPLY_MIGRATIONS.ps1 [-Mode "new"|"all"]

param(
    [string]$Mode = "new"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SDR Juridico - Aplicador de Migrações SQL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "supabase\migrations")) {
    Write-Host "Erro: Execute este script da raiz do projeto" -ForegroundColor Red
    exit 1
}

# Função para aplicar uma migração
function Apply-Migration {
    param([string]$FilePath)

    $filename = Split-Path $FilePath -Leaf
    Write-Host "[→] Aplicando: $filename" -ForegroundColor Blue

    try {
        $result = & supabase db push $FilePath 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[✓] Sucesso: $filename" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[✗] Erro ao aplicar: $filename" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[✗] Exceção ao aplicar: $filename" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
}

# Determinar quais migrações aplicar
if ($Mode -eq "new") {
    Write-Host "Aplicando APENAS as novas migrações (2026-02-03)..." -ForegroundColor Yellow
    Write-Host ""

    $migrations = @(
        "supabase\migrations\20260203_fix_existing_permissions.sql",
        "supabase\migrations\20260203_add_missing_indexes.sql",
        "supabase\migrations\20260203_document_rbac_tables.sql",
        "supabase\migrations\20260203_cleanup_functions.sql",
        "supabase\migrations\20260203_audit_log.sql"
    )

} elseif ($Mode -eq "all") {
    Write-Host "Aplicando TODAS as migrações em ordem cronológica..." -ForegroundColor Yellow
    Write-Host "ATENÇÃO: Isso pode causar erros se migrações base já foram aplicadas!" -ForegroundColor Red
    Write-Host ""

    $confirm = Read-Host "Continuar? (y/n)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        exit 1
    }

    # Lista todas as migrações exceto as da pasta archive
    $migrations = Get-ChildItem -Path "supabase\migrations" -Filter "*.sql" |
                  Where-Object { $_.FullName -notlike "*\archive\*" } |
                  Sort-Object Name |
                  Select-Object -ExpandProperty FullName

} else {
    Write-Host "Uso: .\APPLY_MIGRATIONS.ps1 [-Mode new|all]" -ForegroundColor Red
    Write-Host ""
    Write-Host "  new  - Aplica apenas migrações de 2026-02-03 (padrão)"
    Write-Host "  all  - Aplica todas as migrações em ordem"
    exit 1
}

# Aplicar migrações
$total = $migrations.Count
$success = 0
$failed = 0

Write-Host "Total de migrações a aplicar: $total"
Write-Host ""

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        if (Apply-Migration -FilePath $migration) {
            $success++
        } else {
            $failed++
            Write-Host ""
            Write-Host "Erro ao aplicar migração. Abortando..." -ForegroundColor Red
            break
        }
        Write-Host ""
    } else {
        Write-Host "[!] Arquivo não encontrado: $migration" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Resumo
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Total de migrações: $total"
Write-Host "Sucesso: $success" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "Falhas: $failed" -ForegroundColor Red
}
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✓ Todas as migrações foram aplicadas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:"
    Write-Host "1. Verificar logs do Supabase Dashboard"
    Write-Host "2. Executar queries de verificação (ver README.md)"
    Write-Host "3. Fazer deploy das edge functions corrigidas"
    exit 0
} else {
    Write-Host "✗ Algumas migrações falharam. Verifique os logs acima." -ForegroundColor Red
    exit 1
}
