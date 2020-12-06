// eslint-disable-next-line max-classes-per-file
import { CustomError, Status } from '../lib';

test('Non Custom Error', async () => {
  const err = new Error('Test');
  expect(err).toHaveProperty('name', 'Error');
  expect(err.stack).toStartWith('Error');
  expect(err.message).not.toStartWith('Error');
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
  expect(errA.stack).toStartWith('MyErrorA');

  const errB = new B('Test');
  expect(errB).toHaveProperty('name', 'MyErrorB');
  expect(errB.stack).toStartWith('MyErrorB');
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
  expect(err.statusCode).toStrictEqual(Status.UNKNOWN);
});
