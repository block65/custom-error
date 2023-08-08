import { serializeError as serialize } from 'serialize-error';
import { CustomError } from './custom-error.js';

export interface SerializedError {
  name: string;
  message: string;
  statusCode?: number;
  stack?: string;
  cause?: SerializedError[];

  [key: string]: unknown;
}

function flattenPreviousErrors(
  err: Error | CustomError | unknown,
  accum: (Error | CustomError)[] = [],
): (Error | CustomError)[] {
  if (CustomError.isCustomError(err)) {
    const { cause, ...rest } = err;
    return flattenPreviousErrors(cause, [...accum, rest]);
  }
  if (err instanceof Error) {
    return [...accum, err];
  }
  return accum;
}

export function serializeError(
  err: unknown | Error | CustomError,
): SerializedError {
  if (CustomError.isCustomError(err)) {
    const previousErrors =
      'cause' in err && err.cause ? flattenPreviousErrors(err.cause) : [];

    return {
      ...serialize(err),
      message: err.message,
      name: err.name,
      status: err.status,
      cause: previousErrors.map(serializeError),
      ...('debug' in err ? { debug: err.debug() } : {}),
    };
  }

  if (err instanceof Error) {
    const { name, message, stack, cause, code, ...debug } = serialize(err);

    return {
      message: message || '',
      name: name || 'Error',
      code,
      stack,
      ...(!!cause && { cause: [serializeError(cause)] }),
      ...(debug && { debug }),
    };
  }

  // Not an error object, maybe primitive or null, undefined
  return {
    name: 'Error',
    message: String(err),
    stack: Error().stack,
    debug: {
      typeofErr: typeof err,
      err,
    },
  };
}
