import assert from "node:assert";
import { expect, test } from "vitest";
import { CustomError, serializeError } from "../lib/index.js";

function throwUrlError() {
	return new URL("/", "lol");
}

function throwAssertionError() {
	assert(false, "asserting false");
}

test.each([0, "string", BigInt(0), false, Symbol("kaboom"), null, undefined])(
	"dont explode on primitives: %s",
	(primitive) => {
		const result = serializeError(primitive);
		expect(result).toMatchSnapshot();
	},
);

test.each([null, undefined])("dont explode on voids: %s", (primitive) => {
	const result = serializeError(primitive);
	expect(result).toMatchSnapshot();
});

test("AssertionError", async () => {
	const serialized = await new Promise(throwAssertionError).catch(
		serializeError,
	);

	// WARN: this is serialized as a unrecognisable Error, due to Jest not
	// recognising the error as being instanceof Error
	// we cannot use isNativeError to check as it would no longer be isomorphic
	expect(serialized).toMatchSnapshot({
		stack: expect.any(String),
	});
});

test("URLError", async () => {
	const serialized = await new Promise(throwUrlError).catch(serializeError);

	// WARN: this is serialized as a unrecognisable Error, due to Jest not
	// recognising the error as being instanceof Error
	// we cannot use isNativeError to check as it would no longer be isomorphic
	expect(serialized).toMatchSnapshot({
		stack: expect.any(String),
	});
});

test("CustomError with CustomError cause", () => {
	const previousErr = new CustomError("previous").debug({ woo1: "woo1" });
	const current = new CustomError("current", previousErr).debug({
		woo2: "woo2",
	});

	expect(current.cause).toBe(previousErr);

	const result = serializeError(current);

	expect(result).toMatchSnapshot({
		cause: [
			{
				stack: expect.any(String),
			},
		],
		stack: expect.any(String),
	});
});
