# CloudOps: DevOps Monitoring & Automation Dashboard

CloudOps is a full-stack web application designed to monitor, manage, and automate cloud infrastructure operations. It provides real-time insights into system performance, resource usage, and deployment pipelines, helping DevOps teams improve efficiency and reliability.

## Features

### Real-time Monitoring Dashboard
- CPU, memory, and disk usage
- Service health tracking

### Automation Tools
- Auto-scaling simulation
- Scheduled task execution

### Alerts & Notifications
- Threshold-based alerts
- Email and console notifications

### Deployment Tracking
- CI/CD pipeline visualization
- Deployment logs

### Authentication & Security
- User login and role-based access
- Secure API handling

## Tech Stack

### Frontend
- React
- Vite
- TypeScript

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### DevOps Tools (Conceptual / Integrated)
- Docker for containerization
- AWS / Cloud APIs for optional integration
- Git and GitHub

## Presentation Deployment

This repository includes a demo-ready mode for college presentations. It runs with seeded demo data, browser demo authentication, and no PostgreSQL/Redis dependency. It still collects live CPU, memory, disk, network, and uptime metrics from the backend host. If Docker Desktop is running and accessible, the Containers page shows real local containers; otherwise it falls back to seeded demo containers.

1. Install dependencies:
   ```bash
   npm install
   npm --prefix backend install
   ```

2. Start the backend in one terminal:
   ```bash
   npm run backend:presentation
   ```

3. Start the frontend in another terminal:
   ```bash
   npm run dev:presentation
   ```

4. Open:
   ```text
   http://127.0.0.1:8080
   ```

For a static frontend build:

```bash
npm run build:presentation
```
