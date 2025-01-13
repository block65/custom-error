import { dirname } from "node:path";
import type { SnapshotSerializer } from "vitest";

type StackIsh = { stack: string };

const regex = new RegExp(dirname(import.meta.dirname), "g");

export default {
	serialize(val: StackIsh, config, indentation, depth, refs, printer) {
		return printer(
			{ ...val, stack: val.stack.replaceAll(regex, "...") },
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
			regex.test(val.stack)
		);
	},
} as SnapshotSerializer;
