// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DebugData = any;

export class CustomError extends Error {
  public previous?: Error;

  public statusCode = 500;

  public internal = true;

  private debugData?: DebugData;

  constructor(message: string, previous?: Error) {
    super(message);

    Object.defineProperty(this, 'name', {
      value: new.target.name,
      enumerable: false,
      configurable: true, // so we can setName later
    })

    this.previous = previous;

    Error.captureStackTrace(this, this.constructor)
    Object.setPrototypeOf(this, new.target.prototype)

  }

  public debug(): DebugData;

  public debug(...args: DebugData[]): this;

  public debug(...args: DebugData[]): this | DebugData {
    if (args.length) {
      this.debugData = args.length === 1 ? args[0] : args;
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
