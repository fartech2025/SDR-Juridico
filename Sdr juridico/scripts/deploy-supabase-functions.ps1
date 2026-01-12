param(
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
  [string[]]$Functions = @(
    'google-calendar-oauth',
    'google-calendar-sync',
    'google-calendar-sync-cron'
  )
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Error 'Supabase CLI not found. Install with: iwr https://get.supabase.com | iex'
  exit 1
}

if ($ProjectRef) {
  Write-Host "Linking project $ProjectRef..."
  supabase link --project-ref $ProjectRef
} else {
  Write-Host 'SUPABASE_PROJECT_REF not set. Skipping link step.'
}

foreach ($fn in $Functions) {
  Write-Host "Deploying function $fn..."
  supabase functions deploy $fn
}

Write-Host 'Supabase functions deploy complete.'
