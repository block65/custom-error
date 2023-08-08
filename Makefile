
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
	NODE_OPTIONS=--experimental-vm-modules pnpm exec jest

node_modules: package.json
	pnpm install

dist: node_modules tsconfig.json $(SRCS)
	pnpm exec tsc

.PHONY: dev
dev:
	pnpm exec tsc -w
