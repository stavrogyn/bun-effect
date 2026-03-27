import { Data } from "effect";

export class HttpError extends Data.TaggedError("HttpError")<{}> {}

export class JSONParseError extends Data.TaggedError("JSONParseError")<{}> {}
