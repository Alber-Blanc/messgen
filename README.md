![JS CI](https://github.com/pavletto/messgen/actions/workflows/js.yml/badge.svg)
![CPP CI](https://github.com/pavletto/messgen/actions/workflows/cpp.yml/badge.svg)

# History

The initial version (v0) of messgen was developed for the Microavia project and is hosted at [github.com/microavia/messgen](https://github.com/microavia/messgen). It has been successfully used across a wide range of system components, from STM32 microcontrollers to JS frontends.

This repository contains "v1", that represents the next generation of messgen, addressing design issues, adding new features, and maintaining the framework’s simplicity and speed.

The project is still under active development, but its structure and API have largely stabilized.

# Messgen

Lightweight and fast message serialization library.
Generates message classes/structs from YAML descriptions.

Features:

- Embedded-friendly
- Fixed size arrays
- Vectors (dynamic size arrays)
- Maps
- Nested messages
- Messages metadata
- Types and protocol hashes for compatibility checking
- Supported output formats: C++, JSON, TypeScript
- Supported output formats TODO: Go, Markdown (documentation)

## Runtime Dependencies

- Python 3.X

On Linux:

```bash
sudo apt install python3
```

On Windows:

1. Download https://bootstrap.pypa.io/get-pip.py
2. Execute `python3 get_pip.py`
3. Execute `pip3 install pyyaml`

## Build & Test Dependencies

- libgtest-dev (for testing)
- pytest (for testing)
- cmake
- ninja
- mypy

## Testing & Verification

```bash
make check
```

## Types and Protocols



`messgen-generate.py` can be used to validate types and/or protocols if used without `--lang` argument.

To validate types only:

```bash
python3 messgen-generate.py --types <types_dir>
```

To validate protocols only (doesn't check if types exists):

```bash
python3 messgen-generate.py --protocol <protocol_dir:protocol_name>
```

To deeply validate protocols (check if all used types are valid):

```bash
python3 messgen-generate.py --types <types_dir> --protocol <protocol_dir:protocol_name>
```

Multiple types base directories and protocols can be used in the same time, by passing multiple `--types` or `--protocol` arguments.

## Generating Types and Protocols

All data types should be placed in one directory. Each protocol can be placed in any arbitrary directory.

`types` is the base directory for type definitions (specifying multiple type directories is allowed). The subdirectories are treated as namespaces "my_company/core" or "my_company/the_product/some_items".

`protocol` is a single protocol definition file (specifying multiple protocols is allowed). The protocol consists of a base directory and protocol name separated by a colon e.g. "protocols_dir:my_namespace/protocol".

Message generator usage:

```bash
python3 messgen-generate.py --types <types_dir> --protocol <protocol_dir:protocol_name> --lang <lang> --outdir <out_dir> [--options key1=value1,key2=value2,...]
```

Generated messages are placed in the `out_dir` directory.

#### C++

Example for C++ messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang cpp --outdir out/cpp --options cpp_standard=20
```

#### JSON

Example for JS messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang json --outdir out/json
```

#### TypeScript

Example for TypeScript messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang ts --outdir out/ts
```

#### Golang

Example for Go messages generation:

```bash
python3 messgen-generate.py --types ./types_dir --protocol "protocols_dir:my_namespace/my_protocol" --lang golang --outdir out/go --options mod_name="github.com/my_company/my_project"
```

### Basic Concepts

#### Overview

There is no "one for all" solution, and messgen is not an exception.
Before selecting messgen keep in mind:

- Statically typed: there is no "variant" type, but it's possible to work around this limitation with some tricks
- Optimized for embedded systems: systems where non-aligned access to float/int is forbidden, systems without heap
- Optimized for cross-platform compatibility (gives the same result on CPUs with different paddings, from 8bit microcontrollers to AMD64)
- Optimized for serialization/deserialization speed on C++ port, allows zero-copy in some cases
- Hashes for types and protocols for compatibility checks
- Serialization level only, information about the type and size of the message must be added in separate header
- No optional fields in structs and messages

During numbers serialization **little endian** format is used.

#### Types

The lowest level of hierarchy is **type**. It can be:

- Scalar: e.g. `int32`, `float32`, `uint8`, `bool`
- Enum: enumeration type, described in schema
- Bitset: named bits set type, described in schema
- Array: fixed size `element_type[<size>]`, e.g. `int32[4]`, `my_struct[3]`
- Vector: dynamic size array `element_type[]`, e.g. `int32[]`, `my_struct[]`
- Map: ordered map `value_type{key_type}`, e.g. `string{int32}`, `my_struct{int32}{string}`
- String: `string`
- Bytes: bytes buffer, `bytes`
- Struct: list of fields, described in schema
- External: user-defined types, user must provide serialization/deserialization methods for each port that is used (TODO)

##### Struct

Example struct definition file (`baro_report.yaml`):
```yaml
type_class: struct
comment: "Barometer report"
fields:
  - { name: "timestamp", type: "uint64", comment: "[ns] Timestamp of the measurement" }
  - { name: "temp", type: "float32", comment: "[deg C] Temperature" }
  - { name: "pres", type: "float32", comment: "[Pa] Pressure" }
```

##### Enum

Example enum definition file (`simple_enum.yaml`):
```yaml
type_class: enum
comment: "Example of simple enum"
base_type: uint8
values:
  - { name: "one_value", value: 0, comment: "One example value" }
  - { name: "another_value", value: 1, comment: "Another example value" }
```

##### Bitset

Example bitset definition file (`simple_bitset.yaml`):
```yaml
type_class: bitset
comment: "Example of simple bitset"
base_type: uint8
bits:
  - { name: "one", offset: 0, comment: "One example bit" }
  - { name: "two", offset: 1, comment: "Another example bit" }
  - { name: "error", offset: 2, comment: "Error flag" }
```

#### Types Schema

Schema for **struct**, **enum**, **bitset** and **external** types can be described in yaml files, in tree structure, directories are interpreted as namespaces for the types.

Example file structure for types:
```
tests/msg/types
└── mynamespace
    └── types
        ├── simple_bitset.yaml
        ├── simple_enum.yaml
        ├── simple_struct.yaml
        ├── subspace
        │   └── complex_struct.yaml
        └── var_size_struct.yaml
```

Here `tests/msg/types` is the base directory, and all subdirectories are parts of namespace, so final type name is e.g. `mynamespace/types/subspace/complex_struct`.

Naming style for all files and identifiers in yaml files is strictly: `snake_case`.
In generated files identifiers will be converted to style that is specific for each language.

#### Protocols Schema

**Protocol** is set of **messages**, with associated message name and type, described in yaml files.
Every protocol and message has ID, that can be used to identify the message during deserialization.
Protocols are decoupled from types, and can be even generated independently, without passing types directory (`--types` argument), but full validation is not possible in this case.

Example file structure for protocols description:
```
tests/msg/protocols/
└── mynamespace
    └── proto
        ├── subspace
        │   └── another_proto.yaml
        └── test_proto.yaml
```

Similar to types, here `tests/msg/protocols` is the base directory, and all subdirectories are parts of namespace, so final protocol name is e.g. `mynamespace/proto/test_proto`.

Example protocol definition (`weather_station.yaml`):
```yaml
comment: "Weather station application protocol"
messages:
  0: { name: "heartbeat", type: "application/heartbeat", comment: "Heartbeat message" }
  1: { name: "system_status", type: "system/status", comment: "System status message" }
  2: { name: "system_command", type: "system/command", comment: "System command message" }
  3: { name: "baro_report", type: "measurement/baro_report", comment: "Barometer report message" }
```

Naming style for all files and identifiers in yaml files is strictly: `snake_case`.
In generated files identifiers will be converted to style that is specific for each language.
