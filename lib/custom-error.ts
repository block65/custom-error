import { isErrorLike } from "serialize-error";
import type { ErrorDetail, LocalisedMessage } from "./types.js";
import { withNullProto } from "./utils.js";

export type DebugData = Record<string, unknown>;

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

// just export the type, we CustomError.XX should be used for the actual code
export type { StatusCode };

type SerializedError<T extends StatusCode | number> = {
	readonly debug?: DebugData;
	readonly stack?: string;
	readonly cause?: SerializedError<StatusCode>[];
	readonly details?: ErrorDetail[];
	readonly name: string;
	readonly message: string;
	readonly code: T;
};

const kCustomError = Symbol.for("CustomError");

export class CustomError extends Error {
	static readonly OK = StatusCode.OK;
	static readonly CANCELLED = StatusCode.CANCELLED;
	static readonly UNKNOWN = StatusCode.UNKNOWN;
	static readonly INVALID_ARGUMENT = StatusCode.INVALID_ARGUMENT;
	static readonly DEADLINE_EXCEEDED = StatusCode.DEADLINE_EXCEEDED;
	static readonly NOT_FOUND = StatusCode.NOT_FOUND;
	static readonly ALREADY_EXISTS = StatusCode.ALREADY_EXISTS;
	static readonly PERMISSION_DENIED = StatusCode.PERMISSION_DENIED;
	static readonly RESOURCE_EXHAUSTED = StatusCode.RESOURCE_EXHAUSTED;
	static readonly FAILED_PRECONDITION = StatusCode.FAILED_PRECONDITION;
	static readonly ABORTED = StatusCode.ABORTED;
	static readonly OUT_OF_RANGE = StatusCode.OUT_OF_RANGE;
	static readonly UNIMPLEMENTED = StatusCode.UNIMPLEMENTED;
	static readonly INTERNAL = StatusCode.INTERNAL;
	static readonly UNAVAILABLE = StatusCode.UNAVAILABLE;
	static readonly DATA_LOSS = StatusCode.DATA_LOSS;
	static readonly UNAUTHENTICATED = StatusCode.UNAUTHENTICATED;

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
	} as const);

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
	readonly code: StatusCode = CustomError.UNKNOWN;

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
			code: this.code,
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
			code: this.code,
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
	 */
	public static fromJSON<const T extends StatusCode | number>(
		params: SerializedError<T>,
	) {
		const { message, details, code } = params;

		class ImportedError extends CustomError {
			override readonly code = code;
		}

		const err = new ImportedError(message).debug({
			params,
		});

		if (details) {
			err.addDetail(...details);
		}

		return err;
	}

	/**
	 * An automatically determined HTTP status code
	 */
	public static suggestHttpResponseCode(err: Error | CustomError | unknown) {
		return (
			(CustomError.isCustomError(err) && CustomError.http[err.code]) ||
			CustomError.http[CustomError.UNKNOWN]
		);
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
