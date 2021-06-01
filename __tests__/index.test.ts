/* eslint-disable max-classes-per-file */
import { CustomError, Status } from '../lib/index';

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
  expect(err.statusCode).toStrictEqual(Status.UNKNOWN);
});

test('Debug passing', async () => {
  const err = new CustomError('Test');
  const err2 = new CustomError('Test', err).debug(err.debug());
  expect(err2.statusCode).toStrictEqual(Status.UNKNOWN);
});

test('Previous errors', async () => {
  const err = new CustomError('Test');
  const err2 = new CustomError('Test', err).debug(err.debug());
  expect(err2.previous).toBe(err);
});
