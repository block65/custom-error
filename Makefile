
SRCS = $(wildcard lib/**)

all: typecheck

.PHONY: distclean
distclean:
	rm -rf node_modules

.PHONY: test
test: node_modules
	pnpm exec vitest

node_modules: package.json
	pnpm install

.PHONY: typecheck
typecheck: node_modules tsconfig.json $(SRCS)
	pnpm exec tsc

.PHONY: lint
lint: node_modules
	pnpm exec oxlint

.PHONY: fmt
fmt: node_modules
	pnpm exec oxfmt

.PHONY: publint
publint: typecheck
	npx publint --strict
