# WhiteBoard Development Makefile

# Variables
DB_NAME ?= whiteboard
DB_USER ?= whiteboard
DB_PASSWORD ?= whiteboardpassword
DB_PORT ?= 5432
POSTGRES_IMAGE ?= postgres:18
POSTGRES_CONTAINER ?= whiteboard-postgres

REDIS_PORT ?= 6379
REDIS_IMAGE ?= redis:7
REDIS_CONTAINER ?= whiteboard-redis

# Database Management
launch_postgres: ## Start PostgreSQL database with Docker
	@echo "Starting PostgreSQL database..."
	@docker run -d \
		--name $(POSTGRES_CONTAINER) \
		-e POSTGRES_DB=$(DB_NAME) \
		-e POSTGRES_USER=$(DB_USER) \
		-e POSTGRES_PASSWORD=$(DB_PASSWORD) \
		-p $(DB_PORT):5432 \
		$(POSTGRES_IMAGE)
	@echo "PostgreSQL started successfully!"
	@echo "   Database: $(DB_NAME)"
	@echo "   User: $(DB_USER)"
	@echo "   Password: $(DB_PASSWORD)"
	@echo "   Port: $(DB_PORT)"
	@echo ""
	@echo "   DATABASE_URL for your .env file:"
	@echo "   DATABASE_URL=postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:$(DB_PORT)/$(DB_NAME)"
	@echo ""

launch_redis: ## Start Redis with Docker
	@echo "Starting Redis..."
	@docker run -d \
		--name $(REDIS_CONTAINER) \
		-p $(REDIS_PORT):6379 \
		$(REDIS_IMAGE)
	@echo "Redis started successfully!"
	@echo "   Port: $(REDIS_PORT)"
	@echo ""
	@echo "   REDIS_URL for your .env file:"
	@echo "   REDIS_URL=redis://localhost:$(REDIS_PORT)"
	@echo ""
