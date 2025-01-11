import { expect, test } from "vitest";
import { CustomError } from "../lib/index.js";

test("Non Custom Error", async () => {
	const err = new Error("Test");
	expect(err).toHaveProperty("name", "Error");
	expect(err.stack?.startsWith("Error")).toBe(true);
	expect(err.message.startsWith("Error")).not.toBe(true);
});

test("Vanilla", async () => {
	const err = new CustomError("Test");
	expect(err).toBeInstanceOf(CustomError);
});

test("Debug", async () => {
	const debugData = {
		test: 123,
		woo: false,
		yes: null,
		undef: undefined,
		crumpet: {
			muffin: "biscuit",
		},
		banana: ["milk"],
	};

	const err = new CustomError("Test").debug(debugData);
	expect(err.toJSON().debug).toEqual(debugData);
});

test("Default Status Code", async () => {
	const err = new CustomError("Test");
	expect(err.status).toStrictEqual({
		id: CustomError.UNKNOWN,
		status: "UNKNOWN",
	});
});

test("serialize", async () => {
	const err = new CustomError("Test");
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("serialize ErrorInfo", async () => {
	const err = new CustomError("Test").addDetail({
		reason: "bad-stuff-happened",
		metadata: {
			ka: "boom",
		},
	});
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("serialize RetryInfo", async () => {
	const err = new CustomError("Test").addDetail({
		delay: 1000,
	});
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("serialize QuotaFailure", async () => {
	const err = new CustomError("Test").addDetail({
		violations: [
			{ subject: "account:12345", description: "Too many sites oreddi" },
		],
	});
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("serialize BadRequest", async () => {
	class RestApiValidationError extends CustomError {
		override statusCode = CustomError.INVALID_ARGUMENT;
	}

	const err = new RestApiValidationError("Test").addDetail({
		violations: [
			{ field: "site.name", description: "must be longer than 2 characters" },
		],
	});
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("serialize Multis", async () => {
	class QuotaExceededError extends CustomError {
		override statusCode = CustomError.RESOURCE_EXHAUSTED;

		constructor(message: string, previous?: Error) {
			super(message, previous);
			this.addDetail({
				url: "https://www.example.com",
				description: "Some website",
			});
		}
	}

	const err = new QuotaExceededError("Test").addDetail({
		locale: "en",
		message: "You ran out of stuff",
	});
	expect(err.toJSONSummary()).toMatchSnapshot();
});

test("Previous errors", async () => {
	const err = new CustomError("Test");
	const err2 = new CustomError("Test", err).debug(err.toJSONSummary());
	expect(err2.cause).toBe(err);
});

test("serialize/unserialize", async () => {
	const err = new CustomError("Test").addDetail({
		locale: "en",
		message: "woo yeah",
	});
	const serialized = err.toJSONSummary();
	const clone = CustomError.fromJSON(serialized);

	expect(clone.toJSONSummary()).toMatchSnapshot();
	expect(clone.toJSONSummary()).toMatchObject(err.toJSONSummary());
});

test("toJSON", async () => {
	const err = new CustomError("Test", new Error("bad stuff"))
		.addDetail({
			locale: "en",
			message: "woo yeah",
		})
		.debug({ hahaha: "yes!" });
	const json = err.toJSON();

	expect(json).toMatchSnapshot({
		stack: expect.any(String),
	});
});

test("isCustomError", () => {
	const err1 = new CustomError("isCustomError");

	expect(CustomError.isCustomError(err1)).toBe(true);

	class ExtendedCustomError extends CustomError {
		public someRandomValue = "woo";
	}

	const extendedErr = new ExtendedCustomError("isCustomError");

	// this works because they are both custom errors, regardless of the class
	expect(CustomError.isCustomError(extendedErr)).toBe(true);
	expect(ExtendedCustomError.isCustomError(extendedErr)).toBe(true);

	// this also seems weird, but it's also correct
	expect(ExtendedCustomError.isCustomError(err1)).toBe(true);

	if (ExtendedCustomError.isCustomError(extendedErr)) {
		// this maintains the correct type as inheriting from CustomError
		expect(extendedErr.someRandomValue).toBeTruthy();
	}

	if (ExtendedCustomError.isCustomError(err1)) {
		// @ts-expect-error -> expected because its a check for a custom error,
		// event if we are using the static method from an extended class
		expect(err1.someRandomValue).toBeFalsy();
	}

	expect(CustomError.isCustomError(new Error())).toBeFalsy();
});
