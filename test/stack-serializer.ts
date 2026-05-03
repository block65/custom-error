import type { SnapshotSerializer } from "vitest";

type StackIsh = { stack: string };

// Matches absolute file paths (with optional file:// prefix)
const absolutePathRe = /(?:file:\/\/)?\/(?:[\w@.+-]+\/)+/g;

function hasAbsolutePaths(str: string): boolean {
	return /(?:file:\/\/)?\/(?:[\w@.+-]+\/)+/.test(str);
}

function isStackIsh(val: unknown): val is StackIsh {
	if (!val || typeof val !== "object" || !("stack" in val)) {
		return false;
	}
	if (typeof val.stack !== "string") {
		return false;
	}
	return hasAbsolutePaths(val.stack);
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
	test: isStackIsh,
} as SnapshotSerializer;
