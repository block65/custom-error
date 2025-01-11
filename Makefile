
SRCS = $(wildcard lib/**)

all: dist

.PHONY: clean distclean
distclean:
	rm -rf node_modules

.PHONY: clean
clean: node_modules
	pnpm exec tsc -b --clean

.PHONY: test
test: node_modules
	pnpm exec vitest

node_modules: package.json
	pnpm install

dist: node_modules tsconfig.json $(SRCS)
	pnpm exec tsc

.PHONY: dev
dev: node_modules
	pnpm exec tsc -w

.PHONY: pretty
pretty: node_modules
	pnpm exec prettier --write .
