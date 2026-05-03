import { assert, expect, test } from "vitest";
import { CustomError } from "../lib/main.ts";

test("toJSON output is structured-cloneable", () => {
	const err = new CustomError("test").debug({
		nested: { foo: "bar" },
		list: [1, 2, 3],
		when: new Date(0),
	});
	const json = err.toJSON();
	const cloned = structuredClone(json);
	expect(cloned).toEqual(json);
});

test("toJSON debug rejects top-level mutation", () => {
	const err = new CustomError("test").debug({ secret: "value" });
	const json = err.toJSON();
	expect(() => {
		// @ts-expect-error - asserting frozen at runtime
		json.debug.secret = "tampered";
	}).toThrow(TypeError);
});

test("toJSON debug rejects nested mutation (deep freeze)", () => {
	const err = new CustomError("test").debug({
		nested: { secret: "value" },
	});
	const json = err.toJSON();
	expect(() => {
		// @ts-expect-error - asserting frozen at runtime
		json.debug.nested.secret = "tampered";
	}).toThrow(TypeError);
});

test("caller mutating debug input afterwards does not leak in", () => {
	const input = { mutable: "original" };
	const err = new CustomError("test").debug(input);
	input.mutable = "tampered";
	expect(err.toJSON().debug).toEqual({ mutable: "original" });
});

test("__proto__ key in debug input does not pollute Object.prototype", () => {
	const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
	new CustomError("test").debug(malicious);
	expect(({} as Record<string, unknown>).polluted).toBeUndefined();
});

test("class instance methods are stripped from debug", () => {
	class WithMethod {
		value = 42;
		evil() {
			return "should not survive";
		}
	}
	const inst = new WithMethod();
	// @ts-expect-error - class instance has a method, not structured-cloneable
	const err = new CustomError("test").debug({ inst });
	const cloned = structuredClone(err.toJSON());
	assert(cloned.debug);
	expect(cloned.debug.inst).toEqual({ value: 42 });
	expect(Object.getPrototypeOf(cloned.debug.inst)).toBe(Object.prototype);
});

test("function values in debug are rejected at runtime", () => {
	expect(() => {
		// @ts-expect-error - functions are not structured-cloneable
		new CustomError("test").debug({ fn: () => "boom" });
	}).toThrow();
});

test("symbol values in debug are rejected at runtime", () => {
	expect(() => {
		// @ts-expect-error - symbols are not structured-cloneable
		new CustomError("test").debug({ sym: Symbol("k") });
	}).toThrow();
});

test("repeat toJSON calls return the same frozen #debug reference", () => {
	const err = new CustomError("test").debug({ a: 1 });
	const a = err.toJSON();
	const b = err.toJSON();
	expect(a.debug).toBe(b.debug);
	expect(Object.isFrozen(a.debug)).toBe(true);
});

test("getter side effects fire only once during structuredClone in .debug()", () => {
	let calls = 0;
	const trap = {
		get pwned() {
			calls++;
			return "evil";
		},
	};
	new CustomError("test").debug({ trap });
	const callsAfterClone = calls;
	expect(callsAfterClone).toBeGreaterThanOrEqual(1);
	// Subsequent operations on the cloned data must not re-fire the getter.
	JSON.stringify({ trap });
	expect(calls).toBe(callsAfterClone + 1);
});
