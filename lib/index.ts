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

interface ErrorInfo {
  reason: string;
  metadata: Record<string, string>;
}

interface RetryInfo {
  delay: number;
}

interface BadRequest {
  violations: { field: string; description: string }[];
}

interface LocalisedMessage {
  locale: 'en';
  message: string;
}

interface Help {
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

export enum ErrorReason {
  ERROR_REASON_UNSPECIFIED = 0,
  SERVICE_DISABLED = 1,
  BILLING_DISABLED = 2,
  API_KEY_INVALID = 3,
  API_KEY_SERVICE_BLOCKED = 4,
  API_KEY_HTTP_REFERRER_BLOCKED = 7,
  API_KEY_IP_ADDRESS_BLOCKED = 8,
  API_KEY_ANDROID_APP_BLOCKED = 9,
  API_KEY_IOS_APP_BLOCKED = 13,
  RATE_LIMIT_EXCEEDED = 5,
  RESOURCE_QUOTA_EXCEEDED = 6,
  LOCATION_TAX_POLICY_VIOLATED = 10,
  USER_PROJECT_DENIED = 11,
  CONSUMER_SUSPENDED = 12,
  CONSUMER_INVALID = 14,
  SECURITY_POLICY_VIOLATED = 15,
  ACCESS_TOKEN_EXPIRED = 16,
  ACCESS_TOKEN_SCOPE_INSUFFICIENT = 17,
  ACCOUNT_STATE_INVALID = 18,
  ACCESS_TOKEN_TYPE_UNSUPPORTED = 19,
}

type ErrorDetail =
  | ErrorInfo
  | RetryInfo
  | QuotaFailure
  | BadRequest
  | LocalisedMessage
  | Help;

export interface CustomErrorSerialized {
  code: keyof typeof Status | string;
  message?: string;
  details?: ErrorDetail[];
}

export class CustomError extends Error {
  public previous?: Error | CustomError;

  private details?: ErrorDetail[];

  public code = Status.UNKNOWN;

  public status = Status[Status.UNKNOWN];

  private debugData?: DebugData;

  /**
   *
   * @param {string} message Developer facing message, in English.
   * @param {Error} previous
   */
  constructor(message: string, previous?: Error) {
    super(message);

    Object.defineProperty(this, 'name', {
      value: new.target.name,
      enumerable: false,
      configurable: true, // so we can setName later
    });

    this.previous = previous;

    // FF doesnt have captureStackTrace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public debug(): DebugData | undefined;

  public debug(data: DebugData | undefined): this;

  public debug(data?: DebugData | undefined): this | (DebugData | undefined) {
    if (arguments.length > 0) {
      this.debugData = {
        ...this.debugData,
        ...data,
      };
      return this;
    }

    return this.debugData;
  }

  protected setName(name: string): void {
    Object.defineProperty(this, 'name', {
      value: name,
    });
  }

  public get httpStatusCode() {
    return defaultHttpMapping.get(this.code) || 500;
  }

  public addDetail(...details: ErrorDetail[]): this {
    this.details = (this.details || []).concat(details);
    return this;
  }

  public serialize(): CustomErrorSerialized {
    const localised = this.details?.find(
      (detail): detail is LocalisedMessage => 'locale' in detail,
    );
    return {
      ...(localised?.message && { message: localised?.message }),
      code: Status[this.code],
      ...(this.details && { details: this.details }),
    };
  }
}
