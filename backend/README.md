# CloudOps Backend API

A comprehensive backend API for the CloudOps monitoring dashboard, built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Updates**: WebSocket integration for live data streaming
- **System Monitoring**: CPU, memory, disk, and network metrics collection
- **Container Management**: Docker integration for container monitoring and control
- **CI/CD Integration**: Pipeline status tracking and triggering
- **Alert System**: Configurable alerts with severity levels and notifications
- **Cloud Provider Integration**: Support for AWS, Azure, and GCP
- **User Management**: Profile and settings management
- **Database**: PostgreSQL with optimized schemas and indexing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker (optional, for container features)

## Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb cloudops

   # Run schema
   psql -d cloudops -f database/schema.sql
   ```

5. **Start Redis:**
   ```bash
   redis-server
   ```

6. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

For development:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### System Metrics
- `GET /api/metrics/current` - Get current system metrics
- `GET /api/metrics/history` - Get historical metrics
- `GET /api/metrics/summary` - Get metrics summary

### Containers
- `GET /api/containers` - List all containers
- `GET /api/containers/:id` - Get container details
- `GET /api/containers/:id/logs` - Get container logs
- `POST /api/containers/:id/start` - Start container
- `POST /api/containers/:id/stop` - Stop container

### CI/CD Pipelines
- `GET /api/pipelines` - Get pipeline status
- `POST /api/pipelines/:id/trigger` - Trigger pipeline
- `GET /api/pipelines/:id/history` - Get pipeline history

### Alerts
- `GET /api/alerts/active` - Get active alerts
- `GET /api/alerts/history` - Get alert history
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Cloud Services
- `GET /api/cloud/providers` - Get cloud providers
- `POST /api/cloud/providers/:provider/connect` - Connect provider
- `POST /api/cloud/providers/:provider/disconnect` - Disconnect provider
- `GET /api/cloud/metrics` - Get cloud metrics
- `GET /api/cloud/resources` - Get cloud resources

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `GET /api/settings/system` - Get system settings (admin)
- `PUT /api/settings/system` - Update system settings (admin)

## Real-time Events

The API supports WebSocket connections for real-time updates:

- `metrics:update` - System metrics updates
- `alert:new` - New alerts
- `container:update` - Container status changes
- `pipeline:update` - Pipeline status changes
- `system:alert` - System-wide alerts
- `system:maintenance` - Maintenance mode notifications

## Database Schema

The database includes tables for:
- Users and authentication
- System metrics and monitoring
- Alerts and notifications
- Container management
- CI/CD pipelines
- Cloud provider integrations
- User and system settings

## Security Features

- JWT authentication with refresh tokens
- Role-based access control (user/admin)
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- SQL injection prevention
- Password hashing with bcrypt

## Monitoring & Logging

- Winston-based logging with multiple transports
- Request/response logging
- Error tracking
- Performance monitoring
- Health check endpoint

## Development

### Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Project Structure
```
backend/
├── src/
│   ├── config/          # Database, Redis, etc.
│   ├── middleware/      # Auth, error handling
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic
│   ├── socket/         # WebSocket handlers
│   ├── utils/          # Utilities
│   └── server.ts       # Main server file
├── database/
│   └── schema.sql      # Database schema
├── logs/               # Log files
├── .env.example        # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the server:
   ```bash
   npm start
   ```

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Use conventional commits

## License

MIT License</content>
<parameter name="filePath">c:\Users\manje\Desktop\cloudops\backend\README.md