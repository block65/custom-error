export interface ErrorInfo {
	reason: string;
	metadata: Record<string, string | number>;
}

export interface RetryInfo {
	delay: number;
}

export interface BadRequest {
	violations: { field: string; description: string }[];
}

export interface LocalisedMessage {
	locale: "en";
	message: string;
}

export interface Help {
	url: string;
	description: string;
}

export interface QuotaFailure {
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
}

export type ErrorDetail =
	| ErrorInfo
	| RetryInfo
	| QuotaFailure
	| BadRequest
	| LocalisedMessage
	| Help;
