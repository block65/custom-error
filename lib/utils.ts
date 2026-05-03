/**
 * Type-level: a "deeply readonly" version of T.
 * - Primitives and built-ins (Date, RegExp, Error) pass through.
 * - Functions are unchanged.
 * - Maps, Sets, Arrays, tuples and plain objects are recursively made readonly.
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type BuiltIn = Date | RegExp | Error;

export type DeepReadonly<T> = T extends Primitive | BuiltIn
	? T
	: T extends (...args: never[]) => unknown
		? T
		: T extends ReadonlyMap<infer K, infer V>
			? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
			: T extends ReadonlySet<infer U>
				? ReadonlySet<DeepReadonly<U>>
				: { readonly [K in keyof T]: DeepReadonly<T[K]> };

/**
 * Recursively freeze a value and return it as `DeepReadonly<T>`.
 *
 * Design notes:
 * - Primitives and `null` are returned as-is — already immutable.
 * - `Object.isFrozen` doubles as a visited-set. We freeze BEFORE descending,
 *   so the first thing a cycle's back-edge sees is a frozen node and we stop.
 *   This also makes the function idempotent — re-running it on an already-
 *   deep-frozen tree is O(roots).
 * - `Reflect.ownKeys` covers symbol-keyed and non-enumerable own properties.
 * - We recurse only into data descriptors; accessors have no addressable
 *   backing storage to freeze.
 * - Functions are frozen too — they can carry properties.
 *
 * Caveats:
 * - `Object.freeze` is shallow over `Map`/`Set`: `.set`, `.add`, `.delete`,
 *   `.clear` still mutate. Use a persistent-collection library if you need
 *   real immutability there.
 * - Typed arrays cannot be frozen at runtime; we skip them rather than throw.
 */
export function deepFreeze<T>(value: T): DeepReadonly<T> {
	if (
		value === null ||
		(typeof value !== "object" && typeof value !== "function")
	) {
		return value as DeepReadonly<T>;
	}

	if (Object.isFrozen(value)) {
		return value as DeepReadonly<T>;
	}

	// Typed arrays throw on freeze; DataView is fine.
	if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
		return value as DeepReadonly<T>;
	}

	Object.freeze(value);

	for (const key of Reflect.ownKeys(value)) {
		const desc = Object.getOwnPropertyDescriptor(value, key);
		if (desc && "value" in desc) {
			deepFreeze(desc.value);
		}
	}

	return value as DeepReadonly<T>;
}
