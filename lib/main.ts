import { addKnownErrorConstructor } from "serialize-error";
import { CustomError } from "./custom-error.ts";

try {
  addKnownErrorConstructor(CustomError);
} catch{}

export * from "./custom-error.ts";
export * from "./serialize.ts";

export type * from "./types.ts";
