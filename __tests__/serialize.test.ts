import assert from 'node:assert';
import { test } from '@jest/globals';
import { CustomError, serializeError } from '../lib/index.js';

function throwUrlError() {
  return new URL('/', 'lol');
}

function throwAssertionError() {
  assert(false, 'asserting false');
}

[0, 'string', BigInt(0), false, Symbol('kaboom')].forEach((primitive) => {
  test('dont explode on primitives', () => {
    const result = serializeError(primitive);
    expect(result).toMatchSnapshot({
      stack: expect.any(String),
    });
  });
});

[null, undefined].forEach((primitive) => {
  test('dont explode on voids', () => {
    const result = serializeError(primitive);
    expect(result).toMatchSnapshot({
      stack: expect.any(String),
    });
  });
});

test('AssertionError', async () => {
  const serialized = await new Promise(throwAssertionError).catch(
    serializeError,
  );

  // WARN: this is serialized as a unrecognisable Error, due to Jest not
  // recognising the error as being instanceof Error
  // we cannot use isNativeError to check as it would no longer be isomorphic
  expect(serialized).toMatchSnapshot({
    stack: expect.any(String),
  });
});

test('URLError', async () => {
  const serialized = await new Promise(throwUrlError).catch(serializeError);

  // WARN: this is serialized as a unrecognisable Error, due to Jest not
  // recognising the error as being instanceof Error
  // we cannot use isNativeError to check as it would no longer be isomorphic
  expect(serialized).toMatchSnapshot({
    stack: expect.any(String),
  });
});

test('CustomError', () => {
  const previousErr = new CustomError('previous').debug({ woo1: 'woo1' });
  const current = new CustomError('current', previousErr).debug({
    woo2: 'woo2',
  });

  expect(current.cause).toBe(previousErr);

  const result = serializeError(current);

  expect(result).toMatchSnapshot({
    cause: expect.arrayContaining<Partial<SerializedError>>([
      expect.objectContaining<Partial<SerializedError>>({
        stack: expect.any(String) as string,
      }) as Partial<SerializedError>,
    ]) as Partial<SerializedError>[],
    stack: expect.any(String) as string,
  });
});
