// Injectable id generation. By default ids are random UUIDs (unique across saves and runs); inside
// `withDeterministicIds` they become a reproducible seeded sequence. This is the migration
// prerequisite that lets full-play golden traces reproduce byte-for-byte across runtimes — a candidate
// runtime replaying the same commands mints the same ids, so state hashes match (see
// docs/architecture.md §4 and docs/design/godot-migration-plan.md).
//
// Only domain state ids route through here (log entries, character ids). Presentation/service ids
// (portraits, vault deposits) stay on crypto.randomUUID — they are not part of deterministic game truth.

let generate: () => string = () => crypto.randomUUID();

// Mint a new id using the active generator.
export function newId(): string {
  return generate();
}

// Run `fn` with a deterministic, reproducible id sequence derived from `seed`, then restore the
// previous generator (even if `fn` throws). Reentrant calls compose by nesting the seed. NOT for
// production play — ids must stay globally unique there; this is for traces, fixtures, and parity.
export function withDeterministicIds<T>(seed: string, fn: () => T): T {
  const previous = generate;
  let counter = 0;
  generate = () => `${seed}-${(counter++).toString(36).padStart(6, "0")}`;
  try {
    return fn();
  } finally {
    generate = previous;
  }
}
