/* eslint-disable max-classes-per-file */
import { CustomError, Status } from '../lib/index.js';

test('Non Custom Error', async () => {
  const err = new Error('Test');
  expect(err).toHaveProperty('name', 'Error');
  expect(err.stack?.startsWith('Error')).toBe(true);
  expect(err.message.startsWith('Error')).not.toBe(true);
});

test('Vanilla', async () => {
  const err = new CustomError('Test');
  expect(err).toBeInstanceOf(CustomError);
});

test('Debug', async () => {
  const debugData = {
    test: 123,
    woo: false,
    yes: null,
    undef: undefined,
    crumpet: {
      muffin: 'biscuit',
    },
    banana: ['milk'],
  };

  const err = new CustomError('Test').debug(debugData);
  expect(err.debug()).toEqual(debugData);
});

test('Default Status Code', async () => {
  const err = new CustomError('Test');
  expect(err.status).toStrictEqual('UNKNOWN');
});

test('Debug passing', async () => {
  const err = new CustomError('Test');
  const err2 = new CustomError('Test', err).debug(err.debug());
  expect(err2.status).toStrictEqual('UNKNOWN');
});

test('serialize', async () => {
  const err = new CustomError('Test');
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 2,
      "message": "Test",
      "status": "UNKNOWN",
    }
  `);
});

test('serialize ErrorInfo', async () => {
  const err = new CustomError('Test').addDetail({
    reason: 'bad-stuff-happened',
    metadata: {
      ka: 'boom',
    },
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 2,
      "details": Array [
        Object {
          "metadata": Object {
            "ka": "boom",
          },
          "reason": "bad-stuff-happened",
        },
      ],
      "message": "Test",
      "status": "UNKNOWN",
    }
  `);
});

test('serialize RetryInfo', async () => {
  const err = new CustomError('Test').addDetail({
    delay: 1000,
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 2,
      "details": Array [
        Object {
          "delay": 1000,
        },
      ],
      "message": "Test",
      "status": "UNKNOWN",
    }
  `);
});

test('serialize QuotaFailure', async () => {
  const err = new CustomError('Test').addDetail({
    violations: [
      { subject: 'account:12345', description: 'Too many sites oreddi' },
    ],
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 2,
      "details": Array [
        Object {
          "violations": Array [
            Object {
              "description": "Too many sites oreddi",
              "subject": "account:12345",
            },
          ],
        },
      ],
      "message": "Test",
      "status": "UNKNOWN",
    }
  `);
});

test('serialize BadRequest', async () => {
  class RestApiValidationError extends CustomError {
    constructor(message: string, previous?: Error) {
      super(message, previous);
      this.code = Status.INVALID_ARGUMENT;
    }
  }

  const err = new RestApiValidationError('Test').addDetail({
    violations: [
      { field: 'site.name', description: 'must be longer than 2 characters' },
    ],
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 3,
      "details": Array [
        Object {
          "violations": Array [
            Object {
              "description": "must be longer than 2 characters",
              "field": "site.name",
            },
          ],
        },
      ],
      "message": "Test",
      "status": "INVALID_ARGUMENT",
    }
  `);
});

test('serialize Multis', async () => {
  class QuotaExceededError extends CustomError {
    constructor(message: string, previous?: Error) {
      super(message, previous);
      this.code = Status.RESOURCE_EXHAUSTED;
      this.addDetail({
        url: 'https://www.example.com',
        description: 'Some website',
      });
    }
  }

  const err = new QuotaExceededError('Test').addDetail({
    locale: 'en',
    message: 'You ran out of stuff',
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 8,
      "details": Array [
        Object {
          "description": "Some website",
          "url": "https://www.example.com",
        },
        Object {
          "locale": "en",
          "message": "You ran out of stuff",
        },
      ],
      "message": "You ran out of stuff",
      "status": "RESOURCE_EXHAUSTED",
    }
  `);
});

test('Previous errors', async () => {
  const err = new CustomError('Test');
  const err2 = new CustomError('Test', err).debug(err.debug());
  expect(err2.cause).toBe(err);
});

test('serialize/unserialize', async () => {
  const err = new CustomError('Test').addDetail({
    locale: 'en',
    message: 'woo yeah',
  });
  const serialized = err.serialize();
  const clone = CustomError.fromJSON(serialized);

  expect(clone.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": 2,
      "details": Array [
        Object {
          "locale": "en",
          "message": "woo yeah",
        },
      ],
      "message": "woo yeah",
      "status": "UNKNOWN",
    }
  `);
  expect(clone.serialize()).toMatchObject(err.serialize());
});

test('toJSON', async () => {
  const err = new CustomError('Test', new Error('bad stuff'))
    .addDetail({
      locale: 'en',
      message: 'woo yeah',
    })
    .debug({ hahaha: 'yes!' });
  const json = err.toJSON();

  expect(json).toMatchInlineSnapshot(
    {
      stack: expect.any(String) as string,
    },
    `
    Object {
      "cause": "bad stuff",
      "code": 2,
      "debug": Object {
        "hahaha": "yes!",
      },
      "details": Array [
        Object {
          "locale": "en",
          "message": "woo yeah",
        },
      ],
      "message": "Test",
      "name": "Error",
      "stack": Any<String>,
      "status": "UNKNOWN",
    }
  `,
  );
});

test('isCustomError', () => {
  const err1 = new CustomError('isCustomError');

  expect(CustomError.isCustomError(err1)).toBe(true);

  class ExtendedCustomError extends CustomError {
    public someRandomValue = 'woo';
  }

  const extendedErr = new ExtendedCustomError('isCustomError');

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
