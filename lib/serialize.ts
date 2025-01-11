import {
	type ErrorLike,
	type ErrorObject,
	isErrorLike,
	serializeError,
} from "serialize-error";
import { CustomError, type StatusCode } from "./custom-error.js";
import type { ErrorDetail } from "./types.js";

export type CustomErrorSerialized<TStatusKey extends StatusCode> = {
	status: { status: TStatusKey };
	message?: string;
	details?: ErrorDetail[];
};

// export interface SerializedError {
// 	name: string;
// 	message: string;
// 	status: Extract<StatusObject, { status: TStatusKey }>;
// 	stack?: string;
// 	cause?: SerializedError[] | unknown;
// 	[key: string]: unknown;
// }

function flatten(
	err: unknown | ErrorLike | Error | CustomError,
	accum: (Error | CustomError)[] = [],
): (Error | CustomError)[] {
	if (isErrorLike(err)) {
		if ("cause" in err && err.cause) {
			return flatten(err.cause, [...accum, err]);
		}
		return [...accum, err];
	}

	return accum;
}

function recursiveSerializeError(
	err: unknown | ErrorLike | Error | CustomError,
): ErrorObject {
	if (CustomError.isCustomError(err)) {
		const { cause, ...rest } = serializeError(err);

		const causes = cause ? flatten(cause) : undefined;

		return {
			...rest,
			...(causes && {
				cause: causes.map(recursiveSerializeError),
			}),
		} satisfies ErrorObject;
	}

	if (isErrorLike(err)) {
		const { name, message, stack, cause, code, ...rest } = serializeError(err);

		return {
			...(name && { name }),
			...(message && { message }),
			...(code && { code }),
			...(stack && { stack }),
			...(!!cause && { cause: [recursiveSerializeError(cause)] }),
			...(rest && { debug: rest }),
		};
	}

	// Not an error object, maybe primitive or null, undefined
	return {
		name: "Error",
		message: String(err),
		debug: {
			typeofErr: typeof err,
			err: String(err),
		},
	};
}

export { recursiveSerializeError as serializeError };
