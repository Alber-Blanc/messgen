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

