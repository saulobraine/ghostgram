# Docker development commands for GhostGram API

## Build and Run
```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up --build -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Development Workflow
```bash
# Start services in detached mode
docker-compose up -d postgres redis

# Build and run API in development mode
docker-compose up --build ghostgram-api

# Run Prisma Studio
# Access at http://localhost:5555
docker-compose up prisma-studio
```

## Database Management
```bash
# Run database migrations
docker-compose exec ghostgram-api npm run prisma:migrate

# Generate Prisma client
docker-compose exec ghostgram-api npm run prisma:generate

# Access database CLI
docker-compose exec postgres psql -U ghostgram -d ghostgram
```

## Logs and Debugging
```bash
# View logs
docker-compose logs -f ghostgram-api

# View API logs
docker-compose exec ghostgram-api tail -f logs/*.log

# Access running container
docker-compose exec ghostgram-api sh
```

## Health Checks
- API: http://localhost:3001/health
- PostgreSQL: port 5432
- Redis: port 6379
- Prisma Studio: http://localhost:5555