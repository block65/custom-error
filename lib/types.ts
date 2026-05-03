export type StructuredCloneable =
	| null
	| undefined
	| boolean
	| number
	| bigint
	| string
	| Date
	| RegExp
	| Error
	| ArrayBuffer
	| ArrayBufferView
	| Map<StructuredCloneable, StructuredCloneable>
	| Set<StructuredCloneable>
	| readonly StructuredCloneable[]
	| { readonly [key: string]: StructuredCloneable };

export type ErrorInfo = {
	reason: string;
	metadata: Record<string, string | number>;
};

export type RetryInfo = {
	delay: number;
};

export type BadRequest = {
	violations: { field: string; description: string }[];
};

export type LocalisedMessage = {
	locale: "en";
	message: string;
};

export type Help = {
	url: string;
	description: string;
};

export type QuotaFailure = {
	violations: {
		/**
		 * subject of which quota check failed ie: `account:1234567`
		 */
		subject: string;
		/**
		 * description of quota failure
		 */
		description: string;
	}[];
};

export type ErrorDetail =
	| ErrorInfo
	| RetryInfo
	| QuotaFailure
	| BadRequest
	| LocalisedMessage
	| Help;
