import assert from 'node:assert';
import { CustomError } from '@block65/custom-error';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test } from '@jest/globals';
import { SerializedError, serializeError } from '../lib/serialize.js';

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
      stack: expect.any(String) as string,
    });
  });
});

[null, undefined].forEach((primitive) => {
  test('dont explode on voids', () => {
    const result = serializeError(primitive);
    expect(result).toMatchSnapshot({
      stack: expect.any(String) as string,
    });
  });
});

test('AssertionError', async () => {
  const serialized = await new Promise(throwAssertionError).catch(
    serializeError,
  );

  expect(serialized).toMatchSnapshot({
    stack: expect.any(String) as string,
  });
});

test('URLError', async () => {
  const serialized = await new Promise(throwUrlError).catch(serializeError);

  expect(serialized).toMatchSnapshot({
    stack: expect.any(String) as string,
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
