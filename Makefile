# WhiteBoard Development Makefile

# Variables
DB_NAME ?= whiteboard
DB_USER ?= whiteboard
DB_PASSWORD ?= whiteboardpassword
DB_PORT ?= 5432
POSTGRES_IMAGE ?= postgres:18
POSTGRES_CONTAINER ?= whiteboard-postgres

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
