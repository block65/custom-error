import type { SnapshotSerializer } from "vitest";

type StackIsh = { stack: string };

// Matches absolute file paths (with optional file:// prefix)
const absolutePathRe = /(?:file:\/\/)?\/(?:[\w@.+-]+\/)+/g;

function hasAbsolutePaths(str: string): boolean {
	return /(?:file:\/\/)?\/(?:[\w@.+-]+\/)+/.test(str);
}

export default {
	serialize(val: StackIsh, config, indentation, depth, refs, printer) {
		return printer(
			{ ...val, stack: val.stack.replaceAll(absolutePathRe, ".../") },
			config,
			indentation,
			depth,
			refs,
		);
	},
	test(val: unknown): val is StackIsh {
		return (
			!!val &&
			typeof val === "object" &&
			"stack" in val &&
			typeof val.stack === "string" &&
			hasAbsolutePaths(val.stack)
		);
	},
} as SnapshotSerializer;
