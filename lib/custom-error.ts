type DebugData = Record<string, unknown>;

export enum Status {
  OK = 0,
  CANCELLED,
  UNKNOWN,
  INVALID_ARGUMENT,
  DEADLINE_EXCEEDED,
  NOT_FOUND,
  ALREADY_EXISTS,
  PERMISSION_DENIED,
  RESOURCE_EXHAUSTED,
  FAILED_PRECONDITION,
  ABORTED,
  OUT_OF_RANGE,
  UNIMPLEMENTED,
  INTERNAL,
  UNAVAILABLE,
  DATA_LOSS,
  UNAUTHENTICATED,
}

const CUSTOM_ERROR_SYM = Symbol.for('CustomError');

const defaultHttpMapping: Map<Status, number> = new Map([
  [Status.OK, 200],
  [Status.INVALID_ARGUMENT, 400],
  [Status.FAILED_PRECONDITION, 400],
  [Status.OUT_OF_RANGE, 400],
  [Status.UNAUTHENTICATED, 401],
  [Status.PERMISSION_DENIED, 403],
  [Status.NOT_FOUND, 404],
  [Status.ABORTED, 409],
  [Status.ALREADY_EXISTS, 409],
  [Status.RESOURCE_EXHAUSTED, 403],
  [Status.CANCELLED, 499],
  [Status.DATA_LOSS, 500],
  [Status.UNKNOWN, 500],
  [Status.INTERNAL, 500],
  [Status.UNIMPLEMENTED, 501],
  // [Code.LOCAL_OUTAGE,  502],
  [Status.UNAVAILABLE, 503],
  [Status.DEADLINE_EXCEEDED, 504],
]);

export interface ErrorInfo {
  reason: string;
  metadata: Record<string, string>;
}

export interface RetryInfo {
  delay: number;
}

export interface BadRequest {
  violations: { field: string; description: string }[];
}

export interface LocalisedMessage {
  locale: 'en';
  message: string;
}

export interface Help {
  url: string;
  description: string;
}

export interface QuotaFailure {
  violations: {
    /**
     * subject of which quota check failed ie: `account:1234567`
     */
    subject: string;
    /**
     * description of quota failure
     */
    description: string;
  }[];
}

export type ErrorDetail =
  | ErrorInfo
  | RetryInfo
  | QuotaFailure
  | BadRequest
  | LocalisedMessage
  | Help;

export interface CustomErrorSerialized {
  code: Status;
  status: keyof typeof Status;
  message?: string;
  details?: ErrorDetail[];
}

function withNullProto<T extends Record<string | number, unknown>>(obj: T): T {
  return Object.assign(Object.create(null), obj) as T;
}

export class CustomError extends Error {
  /**
   * The previous error that occurred, useful if "wrapping" an error to hide
   * sensitive details
   * @type {Error | CustomError | unknown}
   */
  public readonly cause?: Error | CustomError | unknown;

  /**
   * Further error details suitable for end user consumption
   * @type {ErrorDetail[]}
   */
  public details?: ErrorDetail[];

  /**
   * Status code suitable to coarsely determine the reason for error
   * @type {Status}
   */
  public code: Status = Status.UNKNOWN;

  /**
   * Contains arbitrary debug data for developer troubleshooting
   * @type {DebugData}
   * @private
   */
  private debugData?: DebugData;

  /**
   *
   * @param {string} message Developer facing message, in English.
   * @param {Error | CustomError | unknown} cause
   */
  constructor(message: string, cause?: Error | CustomError | unknown) {
    super(message, { cause });

    this.cause = cause;

    // FF doesnt have captureStackTrace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public static isCustomError(value: unknown): value is CustomError {
    return !!value && typeof value === 'object' && CUSTOM_ERROR_SYM in value;
  }

  /**
   * Add arbitrary debug data to the error object for developer troubleshooting
   * @return {DebugData | undefined}
   */
  public debug(): DebugData | undefined;

  public debug(data: DebugData | undefined): this;

  public debug(data?: DebugData | undefined): this | (DebugData | undefined) {
    if (arguments.length > 0) {
      this.debugData = withNullProto({
        ...this.debugData,
        ...data,
      });
      return this;
    }

    return this.debugData;
  }

  /**
   * Human readable representation of the error code
   * @return {keyof typeof Status}
   */
  public get status(): keyof typeof Status {
    return Status[this.code] as keyof typeof Status;
  }

  /**
   * Adds further error details suitable for end user consumption
   * @param {ErrorDetail} details
   * @return {this}
   */
  public addDetail(...details: ErrorDetail[]): this {
    this.details = (this.details || []).concat(details);
    return this;
  }

  /**
   * A "safe" serialised version of the error designed for end user consumption
   * @return {CustomErrorSerialized}
   */
  public serialize(): CustomErrorSerialized {
    const localised = this.details?.find(
      (detail): detail is LocalisedMessage => 'locale' in detail,
    );
    return withNullProto({
      message: this.message,
      ...(localised?.message && {
        message: localised.message,
      }),
      code: this.code,
      status: this.status,
      ...(this.details && { details: this.details }),
    });
  }

  /**
   * JSON representation of the error object.
   *
   * Use {serialize} instead if you need to send this error over the wire
   *
   * @return {object}
   */
  public toJSON(): Omit<
    CustomError,
    'addDetail' | 'serialize' | 'debug' | 'toJSON'
  > & {
    debug?: DebugData;
  } {
    const debug = this.debug();

    return withNullProto({
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      ...(this.details && { details: this.details }),
      ...(this.cause instanceof Error && {
        cause: CustomError.isCustomError(this.cause)
          ? this.cause.toJSON()
          : {
              message: this.cause.message,
              name: 'Error',
            },
      }),
      ...(this.stack && { stack: this.stack }),
      ...(debug && { debug }),
    });
  }

  /**
   * "Hydrates" a previously serialised error object
   * @param {CustomErrorSerialized} params
   * @return {CustomError}
   */
  public static fromJSON(params: CustomErrorSerialized): CustomError {
    return Object.assign(
      new CustomError(params.message || 'Error').addDetail(
        ...(params.details || []),
      ),
      {
        code: params.code || Status.UNKNOWN,
      },
    );
  }

  /**
   * An automatically determined HTTP status code
   * @return {number}
   */
  public static suggestHttpResponseCode(
    err: Error | CustomError | unknown,
  ): number {
    const code = CustomError.isCustomError(err) ? err.code : Status.UNKNOWN;
    return defaultHttpMapping.get(code) || 500;
  }
}

// Mark all instances of 'CustomError'
Object.defineProperty(CustomError.prototype, CUSTOM_ERROR_SYM, {
  value: true,
  enumerable: false,
  writable: false,
});
