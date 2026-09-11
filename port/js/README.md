The JavaScript/TypeScript port of Messgen. Run the following commands from `port/js`.
Use Node.js 24, the version used by this repository's CI.

```sh
npm ci
npm run dev
```

`dev` starts Vitest in watch mode. Add a `*.test.ts` file next to the source it tests; it is discovered automatically.
Ordinary development, tests, type checking and builds require only Node.js and npm.

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
String writes use the actual encoded byte count and reject partial writes. Byte and typed-array reads return copies.
If the input is a subview, `cursor.buffer` still refers to its backing buffer; use `cursor.dataView` to retain
the view's bounds. Serialization through `Codec` allocates an exact-size buffer as before.

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
