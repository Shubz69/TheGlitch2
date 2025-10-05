#!/bin/bash

# Start Minikube if not running
if [ "$(minikube status -o json | jq -r '.Host')" != "Running" ]; then
  echo "Starting Minikube..."
  minikube start
fi

# Set environment to use Minikube's Docker daemon
eval $(minikube docker-env)

# Build Docker images
echo "Building Docker images..."
cd ../
docker build -t trading-platform-backend:latest .
cd ../trading-platform-frontend
docker build -t trading-platform-frontend:latest .

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
cd ../trading-platform-backend/k8s
kubectl apply -f namespace.yaml
kubectl apply -f mysql.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl -n trading-platform wait --for=condition=available --timeout=300s deployment/mysql
kubectl -n trading-platform wait --for=condition=available --timeout=300s deployment/backend
kubectl -n trading-platform wait --for=condition=available --timeout=300s deployment/frontend

# Enable Ingress addon if not enabled
if [ "$(minikube addons list -o json | jq -r '.ingress.Status')" != "enabled" ]; then
  echo "Enabling Ingress addon..."
  minikube addons enable ingress
fi

# Get the Minikube IP
MINIKUBE_IP=$(minikube ip)
echo "Application deployed. Access it at http://$MINIKUBE_IP"

# Add hosts entry (requires sudo)
echo "To access the application, add the following line to your /etc/hosts file:"
echo "$MINIKUBE_IP trading-platform.local" 