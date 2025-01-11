export function withNullProto<const T extends Record<PropertyKey, unknown>>(
	obj: T,
): T {
	return Object.assign(Object.create(null), obj) as T;
}
