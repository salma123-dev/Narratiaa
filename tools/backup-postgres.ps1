param(
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,
    [string]$OutputDirectory = ".\backups"
)

$resolvedDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedDirectory -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $resolvedDirectory "narratiaa-$timestamp.dump"

& pg_dump --format=custom --no-owner --no-privileges --file=$outputFile $DatabaseUrl
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Host "Backup created: $outputFile"
