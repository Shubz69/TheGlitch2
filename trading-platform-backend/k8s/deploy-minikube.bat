@echo off
REM Deploy to Minikube for Windows

REM Check if Minikube is running
echo Checking Minikube status...
minikube status
if %ERRORLEVEL% neq 0 (
    echo Starting Minikube...
    minikube start
)

REM Set environment to use Minikube's Docker daemon
echo Setting Docker environment...
FOR /F "tokens=*" %%i IN ('minikube -p minikube docker-env --shell cmd') DO %%i

REM Build Docker images
echo Building Docker images...
cd ..
docker build -t trading-platform-backend:latest .
cd ..\trading-platform-frontend
docker build -t trading-platform-frontend:latest .

REM Apply Kubernetes configurations
echo Applying Kubernetes configurations...
cd ..\trading-platform-backend\k8s
kubectl apply -f namespace.yaml
kubectl apply -f mysql.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml

REM Wait for deployments to be ready
echo Waiting for deployments to be ready...
kubectl -n trading-platform rollout status deployment/mysql --timeout=300s
kubectl -n trading-platform rollout status deployment/backend --timeout=300s
kubectl -n trading-platform rollout status deployment/frontend --timeout=300s

REM Enable Ingress addon if not enabled
echo Checking Ingress addon...
minikube addons enable ingress

REM Get the Minikube IP
FOR /F "tokens=*" %%i IN ('minikube ip') DO SET MINIKUBE_IP=%%i
echo Application deployed. Access it at http://%MINIKUBE_IP%

REM Add hosts entry instructions
echo To access the application, add the following line to your hosts file:
echo %MINIKUBE_IP% trading-platform.local
echo The hosts file is located at C:\Windows\System32\drivers\etc\hosts
echo. 