\
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$logs = Join-Path (Split-Path -Parent $root) "logs"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$stamp = (Get-Date).ToString("yyyyMMdd-HHmmss")

$targets = @(
    @{ ns="frontend"; name="frontend-deploy" },
    @{ ns="backend";  name="backend-deploy"  },
    @{ ns="database"; name="db-deploy"       }
)

foreach ($t in $targets) {
    $file = Join-Path $logs "$($t.ns)-$($t.name)-$stamp.txt"
    Write-Host "=> Exportando logs de $($t.name) ($($t.ns)) para $file" -ForegroundColor Cyan
    kubectl logs deploy/$($t.name) -n $($t.ns) --all-containers --prefix > $file
}
Write-Host "Concluído. Arquivos de log em: $logs" -ForegroundColor Green
