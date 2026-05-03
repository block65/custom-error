import {
	type ErrorLike,
	type ErrorObject,
	isErrorLike,
	serializeError,
} from "serialize-error";
import { CustomError } from "./custom-error.ts";

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

function serializeCustomError(err: CustomError): ErrorObject {
	const { cause, ...rest } = serializeError(err);
	const causes = cause ? flatten(cause) : undefined;
	return {
		...rest,
		...(causes && { cause: causes.map(recursiveSerializeError) }),
	} satisfies ErrorObject;
}

function serializeGenericError(err: ErrorLike): ErrorObject {
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

function serializeNonError(err: unknown): ErrorObject {
	return {
		name: "Error",
		message: String(err),
		debug: { typeofErr: typeof err, err: String(err) },
	};
}

function recursiveSerializeError(
	err: unknown | ErrorLike | Error | CustomError,
): ErrorObject {
	if (CustomError.isCustomError(err)) {
		return serializeCustomError(err);
	}
	if (isErrorLike(err)) {
		return serializeGenericError(err);
	}
	return serializeNonError(err);
}

export { recursiveSerializeError as serializeError };
