# Trading Platform

A full-stack trading platform application with AI-powered features, real-time chat, courses, and community features.

## Project Structure

This is a monorepo containing both the backend and frontend applications:

- **trading-platform-backend/** - Spring Boot Java backend with REST API and WebSocket support
- **trading-platform-frontend/** - React frontend with modern UI/UX

## Features

- 🔐 User Authentication & Authorization (JWT)
- 💬 Real-time Chat & Messaging (WebSocket)
- 🤖 AI-Powered Chatbot
- 📚 Course Management System
- 👥 Community Features
- 🏆 Leaderboard System
- 💳 Payment Integration (Stripe)
- 📧 Email Notifications
- 🔒 Secure Data Encryption

## Tech Stack

### Backend
- Java 17+
- Spring Boot
- Spring Security
- Spring WebSocket
- MySQL Database
- JWT Authentication
- Docker & Kubernetes support

### Frontend
- React
- React Router
- WebSocket Client
- Modern CSS with animations
- Responsive Design

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- MySQL 8.0+
- Maven 3.6+

### Backend Setup
```bash
cd trading-platform-backend
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
```bash
cd trading-platform-frontend
npm install
npm start
```

## Docker Deployment

Both projects include Docker configurations for containerized deployment.

```bash
docker-compose up
```

## Kubernetes Deployment

K8s configuration files are available in `trading-platform-backend/k8s/`

## License

All rights reserved.

