The JavaScript/TypeScript port of Messgen. Run the following commands from `port/js`.
Use Node.js 24, the version used by this repository's CI.

```sh
npm ci
npm run dev
```

`dev` starts Vitest in watch mode. Add a `*.test.ts` file next to the source it tests; it is discovered automatically.
Ordinary development, tests, type checking and builds require only Node.js and npm.

Each test has three sections: setup, action, and expect, separated by blank lines. Use exactly one assertion per test.
Split independent checks into separate tests; use `it.each` for the same check with different inputs.
Keep assertions in the test body rather than hiding them in helpers.

| Command                          | Purpose                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                    | Watch files and rerun affected tests                         |
| `npm test`                       | Run all tests once, including binary compatibility fixtures  |
| `npm test -- src/Cursor.test.ts` | Run one test file                                            |
| `npm run check`                  | Type check, lint, test and build                             |
| `npm run build`                  | Build ESM, CommonJS and TypeScript declarations into `dist/` |
| `npm run build:watch`            | Rebuild the library as source files change                   |
| `npm run coverage`               | Run tests with coverage thresholds                           |
| `npm run benchmark`              | Run all benchmarks once                                      |
| `npm run format`                 | Format source, tests, benchmarks and configuration           |

Tests use the small, committed files in `tests/fixtures/reference`. They do not invoke generators or change fixtures.
When a schema or the wire format changes, regenerate those files with the repository's Python environment:

```sh
PATH="../../.venv/bin:$PATH" npm run fixtures:update
```

Python and PyYAML are needed only for regeneration and the optional `gen:*` commands.
The fixture updater uses the Python implementation as the binary reference and generates files in a temporary directory.
Review the resulting fixture changes together with schema changes. Compare encoded messages as `Uint8Array` values
so assertions check their bytes, not just the surrounding `ArrayBuffer` objects.

The runtime has three responsibilities:

- `Cursor` owns the byte view, bounds and position. It accepts an `ArrayBuffer`, a typed-array view or a `DataView`.
  `Buffer` is retained as an alias of the same constructor. A cursor's offset is relative to its view.
- `Converter<Output, Input = Output>` describes a value. Implement `size`, `serialize`, `deserialize` and
  `createDefault`; the latter must return an independent value. The existing `default()` method delegates to it.
- `ConverterFactory` resolves and caches converters per registry. Calling `Protocols.load()` invalidates that cache.
  `Codec` selects a converter by type name or protocol/message ID and manages the message buffer.

The decoded result of a map remains a `Map`; serialization also accepts a `Record`.
String writes use the actual encoded byte count and reject partial writes. Byte reads return copies by default;
numeric typed-array reads always return copies.
If the input is a subview, `cursor.buffer` still refers to its backing buffer; use `cursor.dataView` to retain
the view's bounds. Serialization through `Codec` allocates an exact-size buffer as before.

To avoid copying fields of type `bytes` during one decode operation, pass `{ copyBytes: false }`:

```ts
const snapshot = codec.deserializeType('TableSnapshot', input, { copyBytes: false });
const payload = codec.deserializeType('Payload', snapshot.rows[0].value);

// The same option is available for protocol/message IDs and custom converters.
codec.deserialize(protoId, messageId, input, { copyBytes: false });
const cursor = new Cursor(input, { copyBytes: false });
```

The option applies to all nested `bytes` fields in that operation. Their views share the input buffer, so changes
to either are visible to the other, and a retained view keeps the backing buffer alive. Pass the returned
`Uint8Array` directly to the next decoder, rather than its `.buffer`, to preserve its offset and length.
Subsequent calls without the option still copy bytes; converter caches do not retain the option.

For custom converters, extend the generic `Converter` class and implement `createDefault()` in place of overriding
`default()`. Defaults for fixed arrays now contain the declared number of independent elements; enum defaults are
the first declared numeric value. `StructConverter.parentObject` is a compatibility getter for a fresh default.
Converter configuration is readonly; mutable state belongs to each cursor or decoded value.

The build uses Bunchee, linting uses ESLint with the TypeScript plugin, and formatting uses Prettier.
There is one TypeScript configuration for source, tests and benchmarks. Dependency versions are recorded in the lockfile.
Public exports are explicit, so adding an internal helper does not automatically extend the package API.

For the large map workload, run [the string-map benchmark](benchmarks/string-map.bench.ts):

```sh
MESSGEN_BENCH_JSON=../../ex.json npm run benchmark -- benchmarks/string-map.bench.ts
```

To compare copying and borrowing byte fields while decoding 100,000 records and their nested payloads:

```sh
npm run benchmark -- benchmarks/byte-views.bench.ts
```
