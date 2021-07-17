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
  expect(err).toHaveProperty('name', 'CustomError');
});

test('Name Mangling + Subclassing', async () => {
  class A extends CustomError {
    constructor(msg: string) {
      super(msg);
      this.setName('MyErrorA');
    }
  }

  class B extends A {
    constructor(msg: string) {
      super(msg);
      this.setName('MyErrorB');
    }
  }

  const errA = new A('Test');
  expect(errA).toHaveProperty('name', 'MyErrorA');
  expect(errA.stack?.startsWith('MyErrorA')).toBe(true);

  const errB = new B('Test');
  expect(errB).toHaveProperty('name', 'MyErrorB');
  expect(errB.stack?.startsWith('MyErrorB')).toBe(true);
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
  expect(err.debug()).toStrictEqual(debugData);
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

test('toJSON', async () => {
  const err = new CustomError('Test');
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": "UNKNOWN",
    }
`);
});

test('toJSON ErrorInfo', async () => {
  const err = new CustomError('Test').addDetail({
    reason: 'bad-stuff-happened',
    metadata: {
      ka: 'boom',
    },
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": "UNKNOWN",
      "details": Array [
        Object {
          "metadata": Object {
            "ka": "boom",
          },
          "reason": "bad-stuff-happened",
        },
      ],
    }
  `);
});

test('toJSON RetryInfo', async () => {
  const err = new CustomError('Test').addDetail({
    delay: 1000,
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": "UNKNOWN",
      "details": Array [
        Object {
          "delay": 1000,
        },
      ],
    }
  `);
});

test('toJSON QuotaFailure', async () => {
  const err = new CustomError('Test').addDetail({
    violations: [
      { subject: 'account:12345', description: 'Too many sites oreddi' },
    ],
  });
  expect(err.serialize()).toMatchInlineSnapshot(`
    Object {
      "code": "UNKNOWN",
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
    }
  `);
});

test('toJSON BadRequest', async () => {
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
      "code": "INVALID_ARGUMENT",
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
    }
  `);
});

test('Multis', async () => {
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
      "code": "RESOURCE_EXHAUSTED",
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
    }
  `);
  expect(Object.entries(err)).toMatchInlineSnapshot(`
Array [
  Array [
    "code",
    8,
  ],
  Array [
    "previous",
    undefined,
  ],
  Array [
    "details",
    Array [
      Object {
        "description": "Some website",
        "url": "https://www.example.com",
      },
      Object {
        "locale": "en",
        "message": "You ran out of stuff",
      },
    ],
  ],
]
`);
});

test('Previous errors', async () => {
  const err = new CustomError('Test');
  const err2 = new CustomError('Test', err).debug(err.debug());
  expect(err2.previous).toBe(err);
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
      "code": "UNKNOWN",
      "details": Array [
        Object {
          "locale": "en",
          "message": "woo yeah",
        },
      ],
      "message": "woo yeah",
    }
`);
  expect(clone.serialize()).toMatchObject(err.serialize());
});
