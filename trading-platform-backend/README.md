# Trading Platform Backend

This is the backend service for the Trading Platform application. It provides a comprehensive API for authentication, user management, courses, community channels, and more.

## Features

- User authentication with JWT and MFA (Multi-Factor Authentication)
- Role-based access control (RBAC)
- Course management with Stripe payment integration
- Real-time community messaging with WebSockets
- AI-powered chatbot using Spring AI
- GDPR compliance with data encryption and IP masking

## Technologies

- Java 17
- Spring Boot 3.x
- Spring Security
- WebSockets (STOMP + SockJS)
- MySQL Database
- Docker & Kubernetes
- Stripe API Integration
- Elastic Email for MFA

## Prerequisites

- Java 17+
- Maven 3.x
- MySQL 8.0
- Docker & Docker Compose (for containerization)
- Minikube (for local Kubernetes deployment)

## Setup

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/username/trading-platform-backend.git
cd trading-platform-backend
```

2. Configure environment variables in `application.properties` or use environment variables:
   - JWT secret
   - Database credentials
   - Elastic Email API key
   - Stripe API key
   - AES encryption key

3. Run the application using Maven:
```bash
mvn spring-boot:run
```

The application will be available at http://localhost:8080

### Docker Deployment

1. Build and run using Docker Compose:
```bash
docker-compose up -d
```

### Kubernetes Deployment

1. For Windows, run the deploy script:
```bash
cd k8s
.\deploy-minikube.bat
```

2. For Linux/Mac:
```bash
cd k8s
chmod +x deploy-minikube.sh
./deploy-minikube.sh
```

## API Documentation

The API is organized around REST principles. All endpoints accept and return JSON.

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login (returns JWT or MFA requirement)
- POST `/api/auth/verify-mfa` - Verify MFA code
- POST `/api/auth/resend-mfa` - Resend MFA code

### Users

- GET `/api/users` - Get all users (admin only)
- GET `/api/users/{id}` - Get user details
- PUT `/api/users/{id}` - Update user
- DELETE `/api/users/{id}` - Delete user (admin only)

### Courses

- GET `/api/courses` - Get all courses
- GET `/api/users/{id}/purchased-courses` - Get user's purchased courses
- POST `/api/stripe/create-session` - Create Stripe checkout session
- POST `/api/stripe/webhook` - Stripe webhook handler

### Community

- GET `/api/community/channels` - Get visible channels
- GET `/api/community/channels/{id}/messages` - Get channel messages
- POST `/api/community/channels/{id}/messages` - Send message
- PUT `/api/community/channels/{id}/messages/{messageId}` - Edit message
- DELETE `/api/community/channels/{id}/messages/{messageId}` - Delete message

## Security

This application implements several security features:

- JWT authentication with role-based authorization
- Multi-factor authentication (MFA) via email
- AES encryption for sensitive data
- GDPR compliance with IP masking
- Secure WebSocket communication
- Password hashing with BCrypt

## License

This project is proprietary and not licensed for public use. 