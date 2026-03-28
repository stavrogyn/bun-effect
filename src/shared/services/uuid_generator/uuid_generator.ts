import { Effect, Ref } from "effect"

class UuidGenerator {
  generate: Effect.Effect<string>

  constructor(private value: Ref.Ref<string>) {
    this.generate = Effect.andThen(Ref.get(this.value), () => crypto.randomUUID())
  }
}

export const generateUuid = () => Effect.runPromise(
  Effect.gen(function* () {
    const uuidGenerator = yield* Effect.andThen(Ref.make(""), (value) => new UuidGenerator(value))
    const uuid = yield* uuidGenerator.generate
    return uuid
  }),
)
