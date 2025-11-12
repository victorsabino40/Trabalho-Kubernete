# setup.ps1 (Versão "Inteligente" - Cria ou Atualiza - COM --no-cache)

param(
    [switch]$Recreate,
    [switch]$LoadLocalImages,
    [string]$ClusterName,
    [string]$ManifestsRoot
)

# --- Caminhos (Agora mais robustos) ---
$ScriptDir = $PSScriptRoot 
$ProjectRoot = (Resolve-Path "$ScriptDir\..\..").Path
$FrontendPath = Join-Path $ProjectRoot "HealthTrack\frontend"
$BackendPath = Join-Path $ProjectRoot "HealthTrack\backend"
$InitSqlPath = Join-Path $ProjectRoot "HealthTrack\db\init.sql" 

# Defaults
if (-not $ClusterName) { $ClusterName = "healthtrack" }
if (-not $ManifestsRoot) { $ManifestsRoot = "..\manifests" } 

Write-Host "=> Verificando kind..." -ForegroundColor Cyan
$kindCmd = Get-Command kind -ErrorAction SilentlyContinue
if (-not $kindCmd) {
    if (Test-Path ".\kind.exe") {
        $kindCmd = (Resolve-Path ".\kind.exe").Path
    } else {
        Write-Error "kind não encontrado. Coloque 'kind.exe' nesta pasta (kubernetes\scripts) ou instale e garanta que esteja no PATH."
        exit 1
    }
}

# --- LÓGICA DE CRIAÇÃO/ATUALIZAÇÃO ---
$clusterExists = & $kindCmd get clusters | Select-String -Quiet $ClusterName

if ($Recreate) {
    Write-Host "=> Removendo cluster anterior (se existir)..." -ForegroundColor Yellow
    & $kindCmd delete cluster --name $ClusterName | Out-Null
    $clusterExists = $false
}

if (-not $clusterExists) {
    Write-Host "=> Criando cluster kind (1 nó)..." -ForegroundColor Cyan
    & $kindCmd create cluster --name $ClusterName --config "$ManifestsRoot\kind-config.yaml"
    if ($LASTEXITCODE -ne 0) { throw "Falha ao criar cluster kind." }
} else {
    Write-Host "=> Cluster '$ClusterName' já existe. Pulando criação." -ForegroundColor Green
}
# --- FIM DA LÓGICA ---


if ($LoadLocalImages) {
    Write-Host "=> (PASSO 1/3) Buildando imagens locais (sem cache)..." -ForegroundColor Cyan
    
    Write-Host "=> Buildando healthtrack-frontend:latest..."
    # --- CORREÇÃO: Adicionado --no-cache ---
    docker build --no-cache -t healthtrack-frontend:latest $FrontendPath
    
    Write-Host "=> Buildando healthtrack-backend:latest..."
    # --- CORREÇÃO: Adicionado --no-cache ---
    docker build --no-cache -t healthtrack-backend:latest $BackendPath

    Write-Host "=> (PASSO 2/3) Carregando imagens no cluster..." -ForegroundColor Cyan
    & $kindCmd load docker-image healthtrack-frontend:latest --name $ClusterName
    & $kindCmd load docker-image healthtrack-backend:latest --name $ClusterName
}

Write-Host "=> Aplicando namespaces e manifestos (Create/Update)..." -ForegroundColor Cyan
kubectl apply -f "$ManifestsRoot\00-namespaces.yaml"

Write-Host "=> Aguardando namespaces..."
Start-Sleep -Seconds 2

kubectl apply -f "$ManifestsRoot\10-frontend-configmap.yaml"
kubectl apply -f "$ManifestsRoot\11-backend-configmap.yaml"
kubectl apply -f "$ManifestsRoot\12-database-configmap.yaml"

Write-Host "=> Recriando ConfigMap 'db-init-sql' com o script de tabelas..." -ForegroundColor Cyan
kubectl delete configmap db-init-sql -n database --ignore-not-found=true
kubectl create configmap db-init-sql --from-file=$InitSqlPath -n database

kubectl apply -f "$ManifestsRoot\20-database-pv-pvc.yaml"
kubectl apply -f "$ManifestsRoot\30-frontend-deploy-svc.yaml"
kubectl apply -f "$ManifestsRoot\31-backend-deploy-svc.yaml"
kubectl apply -f "$ManifestsRoot\32-database-deploy-svc.yaml"

if ($LoadLocalImages) {
    Write-Host "=> (PASSO 3/3) Forçando reinicialização dos pods para usar as novas imagens..." -ForegroundColor Cyan
    kubectl rollout restart deployment frontend-deploy -n frontend
    kubectl rollout restart deployment backend-deploy -n backend
}

Write-Host "=> Aguardando deployments ficarem 'Available'..." -ForegroundColor Cyan
kubectl wait --for=condition=available --timeout=180s deployment/frontend-deploy -n frontend
kubectl wait --for=condition=available --timeout=180s deployment/backend-deploy -n backend
kubectl wait --for=condition=available --timeout=180s deployment/db-deploy -n database

Write-Host "=> Resumo do cluster" -ForegroundColor Green
kubectl get pods -A
kubectl get svc -A
kubectl get pvc,pv -A
kubectl get namespaces