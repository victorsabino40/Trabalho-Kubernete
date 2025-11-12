<# 
  setup.ps1 — HealthTrack Kubernetes Setup (Kind)
  Uso:
    .\setup.ps1 [-ClusterName healthtrack] [-ManifestsRoot "..\manifests"] [-Recreate] [-LoadLocalImages]
#>

param(
  [string]$ClusterName = "healthtrack",
  [string]$ManifestsRoot = "..\manifests",
  [switch]$Recreate,
  [switch]$LoadLocalImages
)

$ErrorActionPreference = "Stop"

function Resolve-PathSafe([string]$p) {
  $full = Resolve-Path -Path $p -ErrorAction SilentlyContinue
  if ($null -eq $full) { return $null }
  return $full.Path
}

function Find-Bin([string]$name) {
  $local = Join-Path (Get-Location) "$name"
  if (Test-Path $local) { return $local }
  # $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $near = Join-Path $scriptDir $name
  if (Test-Path $near) { return $near }
  $found = (Get-Command $name -ErrorAction SilentlyContinue)
  if ($found) { return $found.Source }
  $exe = "$name.exe"
  $found2 = (Get-Command $exe -ErrorAction SilentlyContinue)
  if ($found2) { return $found2.Source }
  return $null
}

function Ensure-Kind() {
  $global:KIND = Find-Bin "kind"
  if (-not $KIND) {
    throw "kind não encontrado. Coloque 'kind.exe' na mesma pasta deste script ou instale e garanta que esteja no PATH."
  }
}

function Ensure-Kubectl() {
  $global:KUBECTL = Find-Bin "kubectl"
  if (-not $KUBECTL) {
    throw "kubectl não encontrado. Coloque 'kubectl.exe' na mesma pasta deste script ou instale e garanta que esteja no PATH."
  }
}

function Invoke-Cmd([string]$cmd, [string[]]$args) {
  Write-Host ">> $cmd $($args -join ' ')" -ForegroundColor DarkGray
  & $cmd @args
}

function Import-LocalImageToKind([string]$imageTag) {
  Write-Host "=> Importando imagem local para o Kind: $imageTag" -ForegroundColor Yellow
  $exists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -SimpleMatch $imageTag -ErrorAction SilentlyContinue
  if (-not $exists) {
    Write-Host "   (!) Imagem não encontrada localmente: $imageTag — pulando." -ForegroundColor DarkYellow
    return
  }
  $nodeName = "$ClusterName-control-plane"
  $tmpTar = Join-Path $env:TEMP ("img_" + ($imageTag -replace "[:/\\]","_") + ".tar")
  if (Test-Path $tmpTar) { Remove-Item $tmpTar -Force }

  Invoke-Cmd docker @("save","-o",$tmpTar,$imageTag)
  Invoke-Cmd docker @("cp",$tmpTar,"${nodeName}:/image.tar")
  Invoke-Cmd docker @("exec",$nodeName,"ctr","-n","k8s.io","images","import","/image.tar")
  Invoke-Cmd docker @("exec",$nodeName,"bash","-lc","rm -f /image.tar")
  Remove-Item $tmpTar -Force -ErrorAction SilentlyContinue
  Write-Host "   ✓ Importada: $imageTag" -ForegroundColor Green
}

function Wait-Deployment([string]$ns,[string]$name,[int]$timeoutSec=300) {
  Write-Host "=> Aguardando rollout: $ns/$name" -ForegroundColor Cyan
  & $KUBECTL -n $ns rollout status deploy/$name --timeout "${timeoutSec}s"
}

try {
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  if (-not $scriptDir) { $scriptDir = Get-Location }

  $rootCandidate = Resolve-PathSafe $ManifestsRoot
  if (-not $rootCandidate) { $rootCandidate = Resolve-PathSafe (Join-Path $scriptDir $ManifestsRoot) }
  if (-not $rootCandidate) { throw "ManifestsRoot não encontrado: $ManifestsRoot" }
  $MR = $rootCandidate

  Ensure-Kind
  Ensure-Kubectl

  Write-Host "=> (Re)criando cluster kind: $ClusterName" -ForegroundColor Cyan
  if ($Recreate) { Invoke-Cmd $KIND @("delete","cluster","--name",$ClusterName) }

  $kindCfg = Join-Path $MR "kind-config.yaml"
  if (Test-Path $kindCfg) {
    Invoke-Cmd $KIND @("create","cluster","--name",$ClusterName,"--config",$kindCfg)
  } else {
    Invoke-Cmd $KIND @("create","cluster","--name",$ClusterName)
  }

  # -----------------------------------------------------------------
  # ⬇️ ⬇️ ⬇️ INÍCIO DA SOLUÇÃO DEFINITIVA (CORREÇÃO DE RBAC) ⬇️ ⬇️ ⬇️
  # -----------------------------------------------------------------
  Write-Host "=> 🔧 Aplicando correção de permissão do Storage (RBAC)..." -ForegroundColor Yellow
  $RbacUrl = "https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml"
  # Define um caminho dentro da pasta 'storage' para manter organizado
  $RbacFile = Join-Path $MR "storage\01-local-path-rbac-FIX.yaml" 

  if (-not (Test-Path $RbacFile)) {
      Write-Host "   Baixando arquivo de correção RBAC..."
      # Garante que o diretório exista
      New-Item -Path (Split-Path $RbacFile) -ItemType Directory -Force | Out-Null
      Invoke-WebRequest -Uri $RbacUrl -OutFile $RbacFile
  }
  
  # Aplica a correção de permissão
  Invoke-Cmd $KUBECTL @("apply","-f",$RbacFile)
  # -----------------------------------------------------------------
  # ⬆️ ⬆️ ⬆️ FIM DA SOLUÇÃO DEFINITIVA ⬆️ ⬆️ ⬆️
  # -----------------------------------------------------------------

  if ($LoadLocalImages) {
    Import-LocalImageToKind "healthtrack-backend:latest"
    Import-LocalImageToKind "healthtrack-frontend:latest"
  }

  Write-Host "=> Aplicando Namespaces, Storage e Deployments" -ForegroundColor Cyan
  $nsDir = Join-Path $MR "namespaces"
  $stDir = Join-Path $MR "storage"
  $dbDir = Join-Path $MR "database"
  $beDir = Join-Path $MR "backend"
  $feDir = Join-Path $MR "frontend"

  if (Test-Path $nsDir) { Invoke-Cmd $KUBECTL @("apply","-f",$nsDir) }
  
  # Aplica o storage DEPOIS da correção
  if (Test-Path (Join-Path $stDir "pv-pvc.yaml")) { Invoke-Cmd $KUBECTL @("apply","-f",(Join-Path $stDir "pv-pvc.yaml")) }
  
  if (Test-Path $dbDir) { Invoke-Cmd $KUBECTL @("apply","-f",$dbDir) }
  if (Test-Path $beDir) { Invoke-Cmd $KUBECTL @("apply","-f",$beDir) }
  if (Test-Path $feDir) { Invoke-Cmd $KUBECTL @("apply","-f",$feDir) }

  Write-Host "=> Aguardando rollouts" -ForegroundColor Cyan
  Wait-Deployment "database" "db-deploy" 300
  Wait-Deployment "backend" "backend-deploy" 300
  Wait-Deployment "frontend" "frontend-deploy" 300

  $nodePort = & $KUBECTL -n frontend get svc frontend-svc -o jsonpath="{.spec.ports[0].nodePort}" 2>$null
  if (-not $nodePort) { $nodePort = "30080" }
  Write-Host ("OK. Acesse via NodePort: http://localhost:{0}" -f $nodePort) -ForegroundColor Green

  Write-Host "`nChecklist rápido:" -ForegroundColor DarkCyan
  Write-Host "  kubectl get pods -A"
  Write-Host "  kubectl get svc -A"
  Write-Host "  kubectl get pvc,pv -A"
  Write-Host "  kubectl get namespaces"

} catch {
  Write-Error $_.Exception.Message
  exit 1
}