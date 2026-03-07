# Local workflow helpers for Docker/Podman + Astro

CONTAINER_TOOL ?= docker
COMPOSE_FILE ?= docker-compose.dev.yml
COMPOSE_PROD_FILE ?= docker-compose.prod.yml
COMPOSE := $(CONTAINER_TOOL) compose -f $(COMPOSE_FILE)
COMPOSE_PROD := $(CONTAINER_TOOL) compose -f $(COMPOSE_PROD_FILE)
SERVICE ?= web

IMAGE ?= localhost/la-ragazza-web:local
CONTAINER_NAME ?= la-ragazza-web
PORT ?= 8080
PUBLIC_SITE_URL ?= https://la-ragazza-web.vercel.app

.PHONY: help dev down logs ps shell build run stop clean prod-up prod-down prod-logs prod-ps

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "%-12s %s\n", $$1, $$2}' Makefile | sort

dev: ## Start development stack with hot reload
	$(COMPOSE) up --build

down: ## Stop development stack and remove volumes
	$(COMPOSE) down -v

logs: ## Tail logs from the web service
	$(COMPOSE) logs -f $(SERVICE)

ps: ## List compose services
	$(COMPOSE) ps

shell: ## Open a shell in the web container
	$(COMPOSE) exec $(SERVICE) sh

build: ## Build production image from Dockerfile
	$(CONTAINER_TOOL) build --build-arg PUBLIC_SITE_URL=$(PUBLIC_SITE_URL) -t $(IMAGE) .

run: ## Run production image at http://localhost:PORT
	$(CONTAINER_TOOL) run --rm --name $(CONTAINER_NAME) -p $(PORT):80 $(IMAGE)

stop: ## Stop production container started with make run
	-$(CONTAINER_TOOL) stop $(CONTAINER_NAME)

clean: ## Remove local production image
	-$(CONTAINER_TOOL) image rm $(IMAGE)

prod-up: ## Build and start production compose stack
	$(COMPOSE_PROD) up --build -d

prod-down: ## Stop production compose stack
	$(COMPOSE_PROD) down

prod-logs: ## Tail logs from production compose stack
	$(COMPOSE_PROD) logs -f web

prod-ps: ## List production compose services
	$(COMPOSE_PROD) ps
