
SRCS = $(wildcard lib/**)

all: dist

.PHONY: clean distclean
distclean:
	rm -rf node_modules

.PHONY: clean
clean:
	pnpm exec tsc -b --clean

.PHONY: test
test:
	pnpm exec vitest

node_modules: package.json
	pnpm install

dist: node_modules tsconfig.json $(SRCS)
	pnpm exec tsc

.PHONY: dev
dev:
	pnpm exec tsc -w


.PHONY: pretty
pretty:
	pnpm exec prettier --write .
