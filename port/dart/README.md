# Messgen Dart/Flutter Port

Lightweight and fast message serialization library for Dart and Flutter.

## Features

- Full support for all Messgen types (scalars, strings, bytes, enums, bitsets, arrays, vectors, maps, structs)
- Little-endian binary serialization
- Type-safe generated code
- Compatible with other Messgen ports (C++, Go, TypeScript)
- Zero-copy deserialization where possible
- Message hashing for protocol compatibility checking

## Installation

Add this to your package's `pubspec.yaml` file:

```yaml
dependencies:
  messgen:
    path: path/to/messgen3/port/dart
```

## Usage

### Generate Dart messages from YAML schemas

```bash
python3 messgen-generate.py \
  --types ./types_dir \
  --protocol "protocols_dir:my_namespace/my_protocol" \
  --lang dart \
  --outdir out/dart
```

### Use generated messages

```dart
import 'package:messgen/messgen.dart';
import 'out/dart/my_namespace/types/my_struct.dart';

void main() {
  // Create a message
  final msg = MyStruct(
    field1: 42,
    field2: "Hello",
  );

  // Serialize
  final buffer = Uint8List(msg.serializedSize());
  msg.serialize(buffer);

  // Deserialize
  final decoded = MyStruct();
  decoded.deserialize(buffer);

  print('field1: ${decoded.field1}');
  print('field2: ${decoded.field2}');
}
```

## Development

### Install dependencies

```bash
cd port/dart
dart pub get
```

### Run tests

```bash
dart test
```

## Supported Types

- **Scalars**: `int8`, `uint8`, `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`, `float32`, `float64`, `bool`
- **String**: Variable-length UTF-8 strings
- **Bytes**: Variable-length byte arrays
- **Enum**: Enumeration types
- **Bitset**: Bit flag types
- **Array**: Fixed-size arrays `type[size]`
- **Vector**: Dynamic arrays `type[]`
- **Map**: Ordered key-value maps `value_type{key_type}`
- **Struct**: Complex types with named fields

## Architecture

The Dart port follows the Go implementation pattern:
- Direct serialization/deserialization without intermediate codec
- Little-endian binary format
- Type hashing for compatibility validation
- Simple and straightforward API

## License

See the main repository LICENSE file.
