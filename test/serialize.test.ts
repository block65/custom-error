import assert from "node:assert";
import { expect, expectTypeOf, test } from "vitest";
import { CustomError, type StatusCode, serializeError } from "../lib/main.ts";

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

test("serialize/unserialize", async () => {
	const err = new CustomError("Test").addDetail({
		locale: "en",
		message: "woo yeah",
	});
	const serialized = err.toJSON();
	const clone = CustomError.fromJSON(serialized);

	expectTypeOf(clone.code).toEqualTypeOf<StatusCode>();

	expect(clone.toJSONSummary()).toMatchSnapshot();
	expect(clone.toJSONSummary()).toMatchObject(err.toJSONSummary());

	expect(clone.toJSON()).toMatchSnapshot();
	// expect(clone.toJSON()).toMatchObject(err.toJSON());
});
