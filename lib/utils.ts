export function withNullProto<const T extends Record<PropertyKey, unknown>>(
	obj: T,
) {
	return Object.assign<T, T>(Object.create(null), obj);
}
