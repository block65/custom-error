import { addKnownErrorConstructor } from "serialize-error";
import { CustomError } from "./custom-error.js";

addKnownErrorConstructor(CustomError);

export * from "./custom-error.js";
export * from "./serialize.js";

export type * from "./types.js";
