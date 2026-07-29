NPM ?= npm
PYTHON ?= python
DEV_PORT ?= 5173
PREVIEW_PORT ?= 4173

.DEFAULT_GOAL := build

.PHONY: help install dev serve test check build verify preview clean

help:
	@echo "Voice Arcana development commands"
	@echo ""
	@echo "  make install   Install npm dependencies"
	@echo "  make dev       Start the Vite development server"
	@echo "  make serve     Preview source files with Python"
	@echo "  make test      Run domain unit tests"
	@echo "  make check     Run syntax checks and tests"
	@echo "  make build     Build production files into dist/"
	@echo "  make verify    Run checks and a production build"
	@echo "  make preview   Build and preview the production site"
	@echo "  make clean     Remove the generated dist/ directory"

install:
	$(NPM) install

dev:
	$(NPM) run dev -- --host 127.0.0.1 --port $(DEV_PORT)

serve:
	$(PYTHON) tools/dev-server/server.py --host 127.0.0.1 --port $(PREVIEW_PORT)

test:
	$(NPM) test

check:
	$(NPM) run check

build:
	$(NPM) run build

verify: check build

preview: build
	$(NPM) run preview -- --host 127.0.0.1 --port $(PREVIEW_PORT)

clean:
	node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
