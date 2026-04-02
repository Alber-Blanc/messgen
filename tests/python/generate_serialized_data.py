import sys

from typing import Any
from pathlib import Path

path_root = Path(__file__).parents[2]
sys.path.append(str(path_root))

from messgen.dynamic import Codec

if __name__ == "__main__":
    codec = Codec()
    codec.load_yaml(type_dirs=['tests/msg/types'], protocols=["tests/msg/protocols:mynamespace/proto/test_proto", "tests/msg/protocols:mynamespace/proto/subspace/another_proto"])

    # simple_struct
    t = codec.type_converter("mynamespace/types/simple_struct")
    msg1: dict[str, Any] = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/simple_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/simple_struct.bin")

    # var_size_struct
    t = codec.type_converter("mynamespace/types/var_size_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1_vec": [-0x1234567890abcdef, 5, 1],
        "str": "Hello messgen!",
    }

    b = t.serialize(msg1)

    with open('tests/data/serialized/bin/var_size_struct.bin', 'wb') as f:
        f.write(b)

    print("Successfully generated serialized data to tests/data/serialized/bin/var_size_struct.bin")

    # empty_struct
    t = codec.type_converter("mynamespace/types/empty_struct")
    msg1 = {}
    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/empty_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/empty_struct.bin")

    # complex_struct
    t = codec.type_converter("mynamespace/types/subspace/complex_struct")

    simple_struct = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x12345678,
        "f2": 0x1234567890abcdef,
        "arr_simple_struct": [simple_struct for _ in range(2)],
        "arr_int": [0x1234567890abcdef for _ in range(4)],
        "arr_var_size_struct": [{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                  range(2)],
        "vec_float": [1.2345678901234567890 for _ in range(3)],
        "vec_enum": ["one_value", "another_value"],
        "vec_simple_struct": [simple_struct for _ in range(3)],
        "v_vec0": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(2)] for _ in range(3)],  # replace 3 with desired outer list length
        "v_vec1": [[{"f0": 0x1234567890abcdef, "f1_vec": [0x1234567890abcdef, 5, 1], "str": "Hello messgen!"} for _ in
                    range(3)] for _ in range(4)],  # replace 3 with desired outer list length
        "v_vec2": [[[0x1234 for _ in range(3)] for _ in range(4)] for _ in range(2)],
        "str": "Example String",
        "bs": b"byte string",
        "str_vec": ["string1", "string2", "string3"],
        "map_str_by_int": {i: "string" + str(i) for i in range(3)},
        "map_vec_by_str": {"key" + str(i): [0x1234 for _ in range(3)] for i in range(3)},
        "bitset0": 0b101,
    }
    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/complex_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/complex_struct.bin")


    # flat_struct

    t = codec.type_converter("mynamespace/types/flat_struct")
    msg1 = {
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f1_pad": 0x12,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "f9": True,
    }

    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/flat_struct.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/flat_struct.bin")

    # complex_types_with_flat_groups_msg
    t = codec.type_converter("mynamespace/types/complex_types_with_flat_groups")
    msg1 = {
        "array1": [1, 2, 3, 4, 5, 6],
        "map1": {
            0x252525: "0x252525",
            0x262626: "0x262626",
        },
        "string1": "string1",
        "bytes1": b"some bytes",
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "array2": [2, 3, 4, 5],
        "map2": {
            "0.202020": 0.202020,
            "0.212121": 0.212121,
        },
        "string2": "some string2",
        "bytes2": b"some bytes2",
        "flag1": 0x1,
        "flag2": 0x2,
        "flag3": 0x3,
        "flag4": 0x4,
    }

    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/complex_types_with_flat_groups.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/complex_types_with_flat_groups.bin")

    # complex_types_with_flat_groups_without_map
    t = codec.type_converter("mynamespace/types/complex_types_with_flat_groups")
    msg1 = {
        "array1": [1, 2, 3, 4, 5, 6],
        "map1": {
            1: "1",
        },
        "string1": "string1",
        "bytes1": b"some bytes",
        "f0": 0x1234567890abcdef,
        "f1": 0x1234567890abcdef,
        "f2": 1.2345678901234567890,
        "f3": 0x12345678,
        "f4": 0x12345678,
        "f5": 1.2345678901234567890,
        "f6": 0x1234,
        "f7": 0x12,
        "f8": -0x12,
        "array2": [2, 3, 4, 5],
        "map2": {
            "0": 0,
        },
        "string2": "some string2",
        "bytes2": b"some bytes2",
        "flag1": 0x1,
        "flag2": 0x2,
        "flag3": 0x3,
        "flag4": 0x4,
    }

    b = t.serialize(msg1)
    with open('tests/data/serialized/bin/complex_types_with_flat_groups_with_single_item_map.bin', 'wb') as f:
        f.write(b)
    print("Successfully generated serialized data to tests/data/serialized/bin/complex_types_with_flat_groups_with_single_item_map.bin")

    print("Success")
