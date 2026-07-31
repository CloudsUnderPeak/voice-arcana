# npm scripts are the single source of truth (see package.json); this Makefile is just shortcuts.
.DEFAULT_GOAL := build
.PHONY: install dev test check build preview

install: ; npm install
dev: ; npm run dev
test: ; npm test
check: ; npm run check
build: ; npm run build
preview: ; npm run preview
