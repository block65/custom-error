import { isErrorLike } from "serialize-error";
import type { CustomErrorSerialized } from "./serialize.js";
import type { ErrorDetail, LocalisedMessage } from "./types.js";
import { withNullProto } from "./utils.js";

export type DebugData = Record<string, unknown>;

const kCustomError = Symbol.for("CustomError");

enum StatusCode {
	OK = 0,
	CANCELLED = 1,
	UNKNOWN = 2,
	INVALID_ARGUMENT = 3,
	DEADLINE_EXCEEDED = 4,
	NOT_FOUND = 5,
	ALREADY_EXISTS = 6,
	PERMISSION_DENIED = 7,
	RESOURCE_EXHAUSTED = 8,
	FAILED_PRECONDITION = 9,
	ABORTED = 10,
	OUT_OF_RANGE = 11,
	UNIMPLEMENTED = 12,
	INTERNAL = 13,
	UNAVAILABLE = 14,
	DATA_LOSS = 15,
	UNAUTHENTICATED = 16,
}

// export type StatusObject = {
// 	[T in StatusCode]: {
// 		id: T;
// 		status: keyof typeof StatusCode[T];
// 	};
// }[StatusCode]

export type StatusObject = {
	[K in keyof StatusCode]: {
		id: StatusCode[K];
		status: K;
	};
}[keyof StatusCode];

export class CustomError<
	T extends StatusCode = StatusCode.UNKNOWN,
> extends Error {
	static readonly OK = 0;
	static readonly CANCELLED = 1;
	static readonly UNKNOWN = 2;
	static readonly INVALID_ARGUMENT = 3;
	static readonly DEADLINE_EXCEEDED = 4;
	static readonly NOT_FOUND = 5;
	static readonly ALREADY_EXISTS = 6;
	static readonly PERMISSION_DENIED = 7;
	static readonly RESOURCE_EXHAUSTED = 8;
	static readonly FAILED_PRECONDITION = 9;
	static readonly ABORTED = 10;
	static readonly OUT_OF_RANGE = 11;
	static readonly UNIMPLEMENTED = 12;
	static readonly INTERNAL = 13;
	static readonly UNAVAILABLE = 14;
	static readonly DATA_LOSS = 15;
	static readonly UNAUTHENTICATED = 16;

	// readonly codes = new Map([
	// 	[CustomError.OK, "OK"],
	// 	[CustomError.CANCELLED, "CANCELLED"],
	// 	[CustomError.UNKNOWN, "UNKNOWN"],
	// 	[CustomError.INVALID_ARGUMENT, "INVALID_ARGUMENT"],
	// 	[CustomError.DEADLINE_EXCEEDED, "DEADLINE_EXCEEDED"],
	// 	[CustomError.NOT_FOUND, "NOT_FOUND"],
	// 	[CustomError.ALREADY_EXISTS, "ALREADY_EXISTS"],
	// 	[CustomError.PERMISSION_DENIED, "PERMISSION_DENIED"],
	// 	[CustomError.RESOURCE_EXHAUSTED, "RESOURCE_EXHAUSTED"],
	// 	[CustomError.FAILED_PRECONDITION, "FAILED_PRECONDITION"],
	// 	[CustomError.ABORTED, "ABORTED"],
	// 	[CustomError.OUT_OF_RANGE, "OUT_OF_RANGE"],
	// 	[CustomError.UNIMPLEMENTED, "UNIMPLEMENTED"],
	// 	[CustomError.INTERNAL, "INTERNAL"],
	// 	[CustomError.UNAVAILABLE, "UNAVAILABLE"],
	// 	[CustomError.DATA_LOSS, "DATA_LOSS"],
	// 	[CustomError.UNAUTHENTICATED, "UNAUTHENTICATED"],
	// ] as const);

	readonly codes = Object.freeze({
		[CustomError.OK]: "OK",
		[CustomError.CANCELLED]: "CANCELLED",
		[CustomError.UNKNOWN]: "UNKNOWN",
		[CustomError.INVALID_ARGUMENT]: "INVALID_ARGUMENT",
		[CustomError.DEADLINE_EXCEEDED]: "DEADLINE_EXCEEDED",
		[CustomError.NOT_FOUND]: "NOT_FOUND",
		[CustomError.ALREADY_EXISTS]: "ALREADY_EXISTS",
		[CustomError.PERMISSION_DENIED]: "PERMISSION_DENIED",
		[CustomError.RESOURCE_EXHAUSTED]: "RESOURCE_EXHAUSTED",
		[CustomError.FAILED_PRECONDITION]: "FAILED_PRECONDITION",
		[CustomError.ABORTED]: "ABORTED",
		[CustomError.OUT_OF_RANGE]: "OUT_OF_RANGE",
		[CustomError.UNIMPLEMENTED]: "UNIMPLEMENTED",
		[CustomError.INTERNAL]: "INTERNAL",
		[CustomError.UNAVAILABLE]: "UNAVAILABLE",
		[CustomError.DATA_LOSS]: "DATA_LOSS",
		[CustomError.UNAUTHENTICATED]: "UNAUTHENTICATED",
	});

	// static http = new Map([
	// 	[CustomError.OK, 200],
	// 	[CustomError.CANCELLED, 299],
	// 	[CustomError.UNKNOWN, 500],
	// 	[CustomError.INVALID_ARGUMENT, 400],
	// 	[CustomError.DEADLINE_EXCEEDED, 504],
	// 	[CustomError.NOT_FOUND, 404],
	// 	[CustomError.ALREADY_EXISTS, 409],
	// 	[CustomError.PERMISSION_DENIED, 403],
	// 	[CustomError.RESOURCE_EXHAUSTED, 403],
	// 	[CustomError.FAILED_PRECONDITION, 400],
	// 	[CustomError.ABORTED, 299],
	// 	[CustomError.OUT_OF_RANGE, 400],
	// 	[CustomError.UNIMPLEMENTED, 501],
	// 	[CustomError.INTERNAL, 500],
	// 	[CustomError.UNAVAILABLE, 503],
	// 	[CustomError.DATA_LOSS, 500],
	// 	[CustomError.UNAUTHENTICATED, 401],
	// ]);

	static http = Object.freeze({
		[CustomError.OK]: 200,
		[CustomError.CANCELLED]: 299,
		[CustomError.UNKNOWN]: 500,
		[CustomError.INVALID_ARGUMENT]: 400,
		[CustomError.DEADLINE_EXCEEDED]: 504,
		[CustomError.NOT_FOUND]: 404,
		[CustomError.ALREADY_EXISTS]: 409,
		[CustomError.PERMISSION_DENIED]: 403,
		[CustomError.RESOURCE_EXHAUSTED]: 403,
		[CustomError.FAILED_PRECONDITION]: 400,
		[CustomError.ABORTED]: 299,
		[CustomError.OUT_OF_RANGE]: 400,
		[CustomError.UNIMPLEMENTED]: 501,
		[CustomError.INTERNAL]: 500,
		[CustomError.UNAVAILABLE]: 503,
		[CustomError.DATA_LOSS]: 500,
		[CustomError.UNAUTHENTICATED]: 401,
	});

	/**
	 * The previous error that occurred, useful if "wrapping" an error to hide
	 * sensitive details
	 * @type {Error | CustomError | unknown}
	 */
	public override readonly cause?: Error | CustomError | unknown;

	/**
	 * Further error details suitable for end user consumption
	 * @type {ErrorDetail[]}
	 */
	public details?: ErrorDetail[];

	/**
	 * Status code suitable to coarsely determine the reason for error
	 */
	readonly statusCode: T = CustomError.UNKNOWN as T;

	/**
	 * @deprecated
	 * @use {statusCode} or {status}
	 */
	readonly code = this.statusCode;

	get status() {
		return {
			id: this.statusCode,
			status: this.codes[this.statusCode],
		};
	}

	/**
	 * Contains arbitrary debug data for developer troubleshooting
	 * @type {DebugData}
	 * @private
	 */
	#debug?: DebugData;

	/**
	 *
	 * @param {string} message Developer facing message, in English.
	 * @param {Error | CustomError | unknown} cause
	 */
	constructor(message?: string, cause?: Error | CustomError | unknown) {
		super(message, { cause });

		this.cause = cause;

		// FF doesnt have captureStackTrace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}

		Object.setPrototypeOf(this, new.target.prototype);
	}

	public static isCustomError(value: unknown): value is CustomError {
		return !!value && typeof value === "object" && kCustomError in value;
	}

	/**
	 * Add arbitrary debug data to the error object for developer troubleshooting
	 */
	public debug(data: DebugData): this {
		this.#debug = withNullProto({
			...this.#debug,
			...data,
		});
		return this;
	}

	/**
	 * Adds further error details suitable for end user consumption
	 * @param {ErrorDetail} details
	 * @return {this}
	 */
	public addDetail(...details: ErrorDetail[]) {
		this.details = (this.details || []).concat(details);
		return this;
	}

	/**
	 * A "safe" serialised version of the error designed for end user consumption
	 */
	public toJSONSummary() {
		const localised = this.details?.find(
			(detail): detail is LocalisedMessage => "locale" in detail,
		);

		return {
			...(localised?.message && {
				message: localised.message,
			}),
			status: this.status,
			...(this.details && { details: this.details }),
		};
	}

	/**
	 * JSON representation of the error object that can be "hydrated" later
	 */
	public toJSON() {
		return withNullProto({
			name: this.name,
			message: this.message,
			status: this.status,
			...(this.details && { details: this.details }),
			...(isErrorLike(this.cause) && {
				cause:
					"toJSON" in this.cause && typeof this.cause.toJSON === "function"
						? this.cause.toJSON()
						: {
								message: this.cause.message,
								name: "Error",
							},
			}),
			...(this.stack && { stack: this.stack }),
			...(this.#debug && { debug: this.#debug }),
		});
	}

	/**
	 * "Hydrates" a previously serialised error object
	 * @param {CustomErrorSerialized} params
	 */
	public static fromJSON<S extends StatusCode = StatusCode.UNKNOWN>(
		params: CustomErrorSerialized<S>,
	) {
		const {
			// status = CustomError.UNKNOWN,
			message,
			details = [],
		} = params;

		const err = new CustomError(message).debug({
			params,
		});

		if (details) {
			err.addDetail(...details);
		}

		return err;
	}

	/**
	 * An automatically determined HTTP status code
	 * @return {HttpStatusCode}
	 */
	public static suggestHttpResponseCode(err: Error | CustomError | unknown) {
		const code = CustomError.isCustomError(err)
			? err.status.id
			: CustomError.UNKNOWN;
		return CustomError.http[code] || CustomError.http[CustomError.UNKNOWN];
	}
}

// Mark all instances of 'CustomError'
Object.defineProperty(CustomError.prototype, kCustomError, {
	value: true,
	enumerable: false,
	writable: false,
});

// allow enumeration of status getter
Object.defineProperty(CustomError.prototype, "status", {
	enumerable: true,
});
