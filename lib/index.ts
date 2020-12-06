type DebugData = Record<string, unknown>;

export const enum Status {
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

export class CustomError extends Error {
  public previous?: Error;

  public statusCode = Status.UNKNOWN;

  public sensitive = true;

  private debugData?: DebugData;

  constructor(message: string, previous?: Error) {
    super(message);

    Object.defineProperty(this, 'name', {
      value: new.target.name,
      enumerable: false,
      configurable: true, // so we can setName later
    });

    this.previous = previous;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public debug(): DebugData | undefined;

  public debug(data: DebugData): this;

  public debug(data?: DebugData): this | (DebugData | undefined) {
    if (data !== undefined) {
      this.debugData = data;
      return this;
    }
    return this.debugData;
  }

  protected setName(name: string): void {
    Object.defineProperty(this, 'name', {
      value: name,
    });
  }
}
