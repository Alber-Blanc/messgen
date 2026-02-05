import json
import textwrap

from contextlib import contextmanager
from dataclasses import asdict
from enum import Enum
from pathlib import (
    PosixPath,
    Path,
)

from .common import (
    SEPARATOR,
    SIZE_TYPE,
    write_file_if_diff,
)
from .model import (
    ArrayType,
    BasicType,
    BitsetBit,
    BitsetType,
    DecimalType,
    EnumType,
    EnumValue,
    ExternalType,
    FieldType,
    hash_message,
    hash_type,
    MapType,
    MessgenType,
    Protocol,
    StructType,
    TypeClass,
    VectorType,
)


class Mode(Enum):
    STORAGE = 1
    VIEW = 2


def _unqual_name(type_name: str) -> str:
    return PosixPath(type_name).stem


def _qual_name(type_name: str) -> str:
    return type_name.replace(SEPARATOR, "::")


def _qual_stor_name(type_name: str) -> str:
    p = type_name.split(SEPARATOR)
    return "::".join(p[:-1] + ["stor", p[-1]])


def _split_last_name(type_name) -> tuple[str, str]:
    split_name = type_name.split(SEPARATOR)
    return SEPARATOR.join(split_name[:-1]), split_name[-1]


@contextmanager
def _namespace(name: str, code: list[str]):
    ns_name = None
    try:
        ns_name = _qual_name(name)
        if ns_name:
            code.append(f"namespace {ns_name} {{")
            code.append("")
        yield

    finally:
        if ns_name:
            code.append("")
            code.append(f"}} // namespace {ns_name}")
            code.append("")


@contextmanager
def _struct(name: str, code: list[str]):
    try:
        code.append("")
        code.append(f"struct {name} {{")
        yield
    finally:
        code.append("};")
        code.append("")


def _inline_comment(type_def: FieldType | EnumValue | BitsetBit):
    if type_def.comment:
        return f" ///< {type_def.comment}"
    return ""


def _indent(c, levels=1):
    spaces = "    " * levels
    if isinstance(c, str):
        return spaces + c
    elif isinstance(c, list):
        r = []
        for i in c:
            r.append(spaces + i if i else "")
        return r
    else:
        raise RuntimeError(f"Unsupported type for indent: {type(c)}")


def _format_code(level: int, s: str):
    return textwrap.indent(textwrap.dedent(s), "    " * level).splitlines()


class FieldsGroup:
    def __init__(self) -> None:
        self.fields: list = []
        self.field_names: list = []
        self.size: int = 0
        self.is_flat = True

    def __repr__(self) -> str:
        return str(self)

    def __str__(self) -> str:
        return f"<FieldsGroup size={self.size} fields={self.field_names}>"


class CppGenerator:
    _PREAMBLE_HEADER = ["#pragma once", ""]
    _EXT_HEADER = ".h"
    _CPP_TYPES_MAP = {
        "bool": "bool",
        "uint8": "uint8_t",
        "int8": "int8_t",
        "uint16": "uint16_t",
        "int16": "int16_t",
        "uint32": "uint32_t",
        "int32": "int32_t",
        "uint64": "uint64_t",
        "int64": "int64_t",
        "float32": "float",
        "float64": "double",
        "dec64": "messgen::decimal64",
    }

    def __init__(self, options: dict):
        self._options: dict = options
        self._includes: set = set()
        self._ctx: dict = {}
        self._types: dict[str, MessgenType] = {}

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        self._types = types
        for type_name, type_def in types.items():
            if type_def.type_class not in [TypeClass.struct, TypeClass.enum, TypeClass.bitset]:
                continue

            file_name = out_dir / (type_name + self._EXT_HEADER)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            write_file_if_diff(file_name, self._generate_type_file(type_name, type_def, types))

    def generate_protocols(self, out_dir: Path, types: dict[str, MessgenType], protocols: dict[str, Protocol]) -> None:
        self._types = types
        for proto_name, proto_def in protocols.items():
            file_name = out_dir / (proto_name + self._EXT_HEADER)
            file_name.parent.mkdir(parents=True, exist_ok=True)
            write_file_if_diff(file_name, self._generate_proto_file(proto_name, proto_def))

    def _get_cpp_standard(self):
        return int(self._options.get("cpp_standard", "20"))

    def _reset_file(self):
        self._includes.clear()

    def _generate_type_file(self, type_name: str, type_def: MessgenType, types: dict[str, MessgenType]) -> list:
        print(f"Generate type: {type_name}")
        self._reset_file()
        code: list[str] = []

        with _namespace(_split_last_name(type_name)[0], code):
            if isinstance(type_def, StructType):
                # View type
                code.extend(self._generate_type_struct(type_name, type_def, types, Mode.VIEW))

                # Storage type
                code.extend(["", "namespace stor {", ""])
                if type_def.size is None:
                    code.extend(self._generate_type_struct(type_name, type_def, types, Mode.STORAGE))
                else:
                    code.append(f"using {type_name.split('/')[-1]} = {self._cpp_type(type_name, Mode.VIEW)};")
                code.extend(["", "}"])
            elif isinstance(type_def, EnumType):
                code.extend(self._generate_type_enum(type_name, type_def))
            elif isinstance(type_def, BitsetType):
                code.extend(self._generate_type_bitset(type_name, type_def))

        code = self._PREAMBLE_HEADER + self._generate_includes() + code

        return code

    def _generate_proto_file(self, proto_name: str, proto_def: Protocol) -> list[str]:
        print(f"Generate protocol: {proto_name}")

        self._reset_file()
        code: list[str] = []

        self._add_include("cstdint")
        self._add_include("messgen/messgen.h")

        namespace_name, class_name = _split_last_name(proto_name)
        with _namespace(namespace_name, code):
            with _struct(class_name, code):
                for message in proto_def.messages.values():
                    self._add_include(message.type + self._EXT_HEADER)

                proto_id = proto_def.proto_id
                if proto_id is not None:
                    code.extend(
                        _format_code(
                            1,
                            f"""\
                        static constexpr int16_t PROTO_ID = {proto_id};
                        """,
                        )
                    )

                code.extend(self._generate_messages(proto_name, class_name, proto_def))
                code.extend(self._generate_reflect_message_decl())
                code.extend(self._generate_dispatcher_decl())

            code.extend(self._generate_protocol_members_of(class_name, proto_def))
            code.extend(self._generate_reflect_message(class_name, proto_def))
            code.extend(self._generate_dispatcher(class_name))

            code.append("")

        return self._PREAMBLE_HEADER + self._generate_includes() + code

    def _generate_messages(self, proto_name: str, class_name: str, proto_def: Protocol):
        self._add_include("tuple")
        code: list[str] = []
        for message in proto_def.messages.values():
            type_def = self._types.get(message.type)
            if type_def is None:
                raise RuntimeError(
                    f"Type '{message.type}' not found for message '{message.name}' in protocol '{proto_name}'")

            code.extend(
                _format_code(
                    1,
                    f"""\

                struct {message.name} {{
                    using data_type = ::{_qual_name(message.type)};
                    using data_type_stor = ::{_qual_stor_name(message.type)};
                    using protocol_type = {class_name};

                    static constexpr int16_t PROTO_ID = protocol_type::PROTO_ID;
                    static constexpr int16_t MESSAGE_ID = {message.message_id};
                    static constexpr uint64_t HASH = {hash_message(message)}ULL ^ data_type::HASH;
                    static constexpr std::string_view NAME = "{_qual_name(proto_name)}::{message.name}";

                    class recv {{
                    public:
                        using message_type = {message.name};
                        using data_type = ::{_qual_name(message.type)};
                        using data_type_stor = ::{_qual_stor_name(message.type)};
                        using protocol_type = {class_name};

                        explicit recv(messgen::bytes buf) :
                            _buf(buf) {{
                        }}

                        [[nodiscard]] const uint8_t *data() const noexcept {{
                            return _buf.data();
                        }}

                        """,
                )
            )

            if type_def.size is None:
                # Dynamic size
                if self._need_alloc(message.type):
                    self._add_include("messgen/Allocator.h", "global")
                    code.extend(
                        _format_code(
                            3,
                            """\
                            ssize_t deserialize(data_type &v, ::messgen::Allocator &alloc) const {
                                return v.deserialize(_buf, alloc);
                            }

                            ssize_t deserialize_unsafe(data_type &v, ::messgen::Allocator &alloc) const {
                                return v.deserialize_unsafe(_buf.data(), alloc);
                            }

                            """,
                        )
                    )
                else:
                    code.extend(
                        _format_code(
                            3,
                            """\
                            ssize_t deserialize(data_type &v) const {
                                return v.deserialize(_buf);
                            }

                            ssize_t deserialize_unsafe(data_type &v) const {
                                return v.deserialize_unsafe(_buf.data());
                            }

                            """,
                        )
                    )
                code.extend(
                    _format_code(
                        3,
                        """\
                        ssize_t deserialize(data_type_stor &v) const {
                            return v.deserialize(_buf);
                        }

                        ssize_t deserialize_unsafe(data_type_stor &v) const {
                            return v.deserialize_unsafe(_buf.data());
                        }

                        """,
                    )
                )

            else:
                # Static size, data_type == data_type_view
                code.extend(
                    _format_code(
                        3,
                        """\
                        ssize_t deserialize(data_type &v) const {
                            return v.deserialize(_buf);
                        }

                        ssize_t deserialize_unsafe(data_type &v) const {
                            return v.deserialize_unsafe(_buf.data());
                        }

                        """,
                    )
                )

            code.extend(
                _format_code(
                    2,
                    f"""\
                    private:
                        messgen::bytes _buf{{}};
                    }};

                    class send {{
                    public:
                        using message_type = {message.name};
                        using data_type = ::{_qual_name(message.type)};
                        using data_type_stor = ::{_qual_stor_name(message.type)};
                        using protocol_type = {class_name};

                    """,
                )
            )

            if type_def.size is None:
                # Dynamic size
                code.extend(
                    _format_code(
                        3,
                        """\
                        explicit send(const data_type& t) :
                            _data(&t),
                            _serialize_func(&messgen::free_serialize<data_type>),
                            _serialized_size_func(&messgen::free_serialized_size<data_type>) {

                        }

                        explicit send(const data_type_stor& t) :
                            _data(&t),
                            _serialize_func(&messgen::free_serialize<data_type_stor>),
                            _serialized_size_func(&messgen::free_serialized_size<data_type_stor>) {
                        }

                        [[nodiscard]] size_t serialized_size() const {
                            return (*_serialized_size_func)(_data);
                        }

                        size_t serialize(uint8_t* buf) const {
                            return (*_serialize_func)(_data, buf);
                        }

                """,
                    )
                )

            else:
                # Static size, data_type == data_type_view
                code.extend(
                    _format_code(
                        3,
                        """\
                        explicit send(const data_type& t) :
                            _data(&t) {
                        }

                        [[nodiscard]] constexpr static size_t serialized_size() {
                            return data_type::FIXED_SIZE;
                        }

                        size_t serialize(uint8_t* buf) const {
                            return reinterpret_cast<const data_type *>(_data)->serialize(buf);
                        }

                """,
                    )
                )

            code.extend(
                _format_code(
                    2,
                    """\
                private:
                    const void *_data{};
                """,
                )
            )
            if type_def.size is None:
                code.extend(
                    _format_code(
                        3,
                        """\
                    ::messgen::serialize_func _serialize_func{};
                    ::messgen::serialized_size_func _serialized_size_func{};
                """,
                    )
                )

            code.extend(
                _format_code(
                    1,
                    """\
                    };
                };
                """,
                )
            )
        return code

    def _generate_protocol_members_of(self, class_name: str, proto_def: Protocol):
        self._add_include("tuple")
        code: list[str] = []
        code.append(f"[[nodiscard]] constexpr auto members_of(::messgen::reflect_t<{class_name}>) noexcept {{")
        code.append("    return std::tuple{")
        for message in proto_def.messages.values():
            code.append(f'        ::messgen::member<{class_name}, {class_name}::{message.name}>{{"{message.name}"}},')
        code.append("    };")
        code.append("}")
        code.append("")
        return code

    @staticmethod
    def _generate_reflect_message_decl() -> list[str]:
        return textwrap.indent(
            textwrap.dedent("""
                template <class Fn>
                static constexpr void reflect_message(int16_t msg_id, Fn &&fn);
                """),
            "    ",
        ).splitlines()

    @staticmethod
    def _generate_reflect_message(class_name: str, proto: Protocol) -> list[str]:
        code: list[str] = []
        code.append("template <class Fn>")
        code.append(f"constexpr void {class_name}::reflect_message(int16_t msg_id, Fn &&fn) {{")
        code.append("    switch (msg_id) {")
        for message in proto.messages.values():
            msg_type = f"{class_name}::{_unqual_name(message.name)}"
            code.append(f"        case {msg_type}::MESSAGE_ID:")
            code.append(f"            std::forward<Fn>(fn)(::messgen::reflect_type<{msg_type}>);")
            code.append("            return;")
        code.append("    }")
        code.append("}")
        return code

    def _generate_dispatcher_decl(self) -> list[str]:
        out = """
        template <class Fn>
        static constexpr bool dispatch_message(int16_t msg_id, messgen::bytes payload, Fn &&fn);
        """
        return textwrap.indent(textwrap.dedent(out), "    ").splitlines()

    def _generate_dispatcher(self, class_name: str) -> list[str]:
        return _format_code(
            0,
            f"""
            template <class Fn>
            constexpr bool {class_name}::dispatch_message(int16_t msg_id, messgen::bytes payload, Fn &&fn) {{
                auto result = false;
                reflect_message(msg_id, [&]<class R>(R) {{
                    using message_type = typename messgen::splice_t<R>::recv;
                    if constexpr (std::is_invocable_v<::messgen::remove_cvref_t<Fn>, message_type>) {{
                        std::forward<Fn>(fn).operator()(message_type{{payload}});
                        result = true;
                    }}
                }});
                return result;
            }}
            """,
        )

    @staticmethod
    def _generate_comment_type(type_def):
        if not type_def.comment:
            return []

        code = []
        code.append("/**")
        code.append(f" * {type_def.comment}")
        code.append(" */")
        return code

    def _generate_type_enum(self, type_name, type_def):
        self._add_include("messgen/messgen.h")
        self._add_include("string_view")
        self._add_include("string")

        unqual_name = _unqual_name(type_name)
        qual_name = _qual_name(type_name)
        underlying_cpp_type = self._cpp_type(type_def.base_type, Mode.VIEW)

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append(f"enum class {unqual_name}: {underlying_cpp_type} {{")
        for enum_value in type_def.values:
            code.append(f"    {enum_value.name} = {enum_value.value},{_inline_comment(enum_value)}")
        code.append("};")

        code.extend(
            _format_code(0, f"""
            static constexpr ::messgen::metadata _{unqual_name}_metadata{{
                .hash = 0ULL,
                .name = "{_qual_name(type_name)}",
                .schema = R"_({self._generate_schema(type_def)})_"
            }};

            constexpr const ::messgen::metadata *metadata_of(::messgen::reflect_t<{unqual_name}>) noexcept {{
                return &_{unqual_name}_metadata;
            }}
            
            [[nodiscard]] constexpr std::string_view name_of(::messgen::reflect_t<{unqual_name}>) noexcept {{
                return "{qual_name}";
            }}

            [[nodiscard]] constexpr auto enumerators_of(::messgen::reflect_t<{unqual_name}>) noexcept {{
                return std::tuple{{
            """))

        for enum_value in type_def.values:
            code.append(
                f'        ::messgen::enumerator_value{{{{"{enum_value.name}"}}, {unqual_name}::{enum_value.name}}},')
        code.extend(_format_code(0, """
             };
         }"""))

        code.extend(
            _format_code(
                0,
                f"""
            [[nodiscard]] constexpr std::string_view to_string_view({unqual_name} e) noexcept {{
                switch (e) {{
            """,
            )
        )
        for enum_value in type_def.values:
            code.extend(
                _format_code(
                    1,
                    f"""\
                case {unqual_name}::{enum_value.name}:
                    return "{enum_value.name}";
                """,
                )
            )
        code.extend(
            _format_code(
                0,
                f"""\
                default:
                    return messgen::UNKNOWN_ENUM_STR;
                }}
            }}

            [[nodiscard]] inline std::string to_string({unqual_name} e) noexcept {{
                auto s = to_string_view(e);
                if (s != messgen::UNKNOWN_ENUM_STR) {{
                    return std::string(s);
                }}
                return "<unknown (" + std::to_string({underlying_cpp_type}(e)) + ")>";
            }}
            """,
            )
        )

        return code

    def _generate_type_bitset(self, type_name, type_def):
        self._add_include("messgen/messgen.h")
        self._add_include("string_view")
        self._add_include("messgen/bitset.h")

        unqual_name = _unqual_name(type_name)
        qual_name = _qual_name(type_name)
        underlying_type = self._cpp_type(type_def.base_type, Mode.VIEW)

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append(f"class {unqual_name} : public messgen::detail::bitset_base<{unqual_name}, {underlying_type}> {{")
        code.append(f"    enum class Values : {underlying_type} {{")
        for bit in type_def.bits:
            code.append(f"        {bit.name} = {1 << bit.offset},{_inline_comment(bit)}")
        code.append("    };")

        code.append("")
        code.append("public:")
        code.append("    using underlying_type = std::underlying_type_t<Values>;")
        code.append("    using bitset_base::bitset_base;")
        code.append(f"    constexpr {unqual_name}(Values other) : {unqual_name}{{underlying_type(other)}} {{}}")

        code.append("")
        code.append(f'    static constexpr std::string_view NAME = "{qual_name}";')
        if self._get_cpp_standard() >= 20:
            code.append("    using enum Values;")
        else:
            for bit in type_def.bits:
                code.append(f"    static constexpr Values {bit.name} = Values::{bit.name};")
        code.append("")
        code.append(f"    friend {unqual_name} operator|(const Values &lhs, const Values &rhs) {{")
        code.append(f"        return {unqual_name}(lhs) | {unqual_name}(rhs);")
        code.append("    }")
        code.append("};")

        return code

    def _get_alignment(self, type_def: MessgenType):
        type_class = type_def.type_class

        if isinstance(type_def, BasicType):
            if type_class in [TypeClass.scalar]:
                return type_def.size
            elif type_class in [TypeClass.string, TypeClass.bytes]:
                return self._get_alignment(self._types[SIZE_TYPE])

        if isinstance(type_def, (DecimalType, EnumType, BitsetType)):
            return type_def.size

        elif isinstance(type_def, StructType):
            # Alignment of struct is equal to max of the field alignments
            a_max = 0
            for field in type_def.fields:
                a = self._get_alignment(self._types[field.type])
                if a > a_max:
                    a_max = a
            return a_max

        elif isinstance(type_def, ExternalType):
            # Worst cast assumption about alignment of external type
            return 8

        elif isinstance(type_def, ArrayType):
            # Alignment of array is equal to alignment of element
            return self._get_alignment(self._types[type_def.element_type])

        elif isinstance(type_def, VectorType):
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._types[SIZE_TYPE])
            a_el = self._get_alignment(self._types[type_def.element_type])
            return max(a_sz, a_el)

        elif isinstance(type_def, MapType):
            # Alignment of array is equal to max of size field alignment and alignment of element
            a_sz = self._get_alignment(self._types[SIZE_TYPE])
            a_key = self._get_alignment(self._types[type_def.key_type])
            a_value = self._get_alignment(self._types[type_def.value_type])
            return max(a_sz, a_key, a_value)

        else:
            raise RuntimeError(f"Unsupported type_class in _get_alignment: type_class={type_class} type_def={type_def}")

    def _check_alignment(self, type_def, offs):
        align = self._get_alignment(type_def)
        return offs % align == 0

    def _is_flat_type(self, type_def):
        if type_def.size is None:
            return False

        if type_def.type_class in [TypeClass.scalar, TypeClass.enum, TypeClass.bitset, TypeClass.decimal]:
            return True
        elif type_def.type_class == TypeClass.struct:
            groups = self._field_groups(type_def.fields)
            return len(groups) == 0 or (len(groups) == 1 and groups[0].size is not None)
        elif type_def.type_class == TypeClass.array:
            el_type_def = self._types.get(type_def.element_type)
            return el_type_def.size is not None and el_type_def.size % self._get_alignment(el_type_def) == 0
        else:
            return False

    def _generate_type_struct(self, type_name: str, type_def: StructType, types: dict[str, MessgenType], mode):
        fields = type_def.fields

        self._add_include("messgen/messgen.h")
        self._add_include("cstddef")
        self._add_include("cstring")
        self._add_include("string_view")
        self._add_include("cassert")

        unqual_name = _unqual_name(type_name)

        code = []
        code.extend(self._generate_comment_type(type_def))
        code.append(f"struct {unqual_name} {{")

        groups = self._field_groups(fields)
        if len(groups) > 1 and self._all_fields_scalar(fields):
            print(
                f"Warn: padding in '{type_name}' after '{groups[0].fields[0].name}' causes extra memcpy call during serialization.")

        # Flat type
        is_flat = self._is_flat_type(type_def)
        code.append(_indent(f"static constexpr bool IS_FLAT = {str(is_flat).lower()};"))

        # Fixed size type
        is_fixed_size = type_def.size is not None
        fixed_size = 0
        for field in fields:
            field_type_def = self._types[field.type]
            field_size = field_type_def.size
            if field_size is None:
                fixed_size += 4  # sizeof(messgen::size_type)
            else:
                fixed_size += field_size

        code.append(_indent(f"static constexpr bool IS_FIXED_SIZE = {str(is_fixed_size).lower()};"))
        code.append(_indent(f"static constexpr size_t FIXED_SIZE = {fixed_size};"))

        # Need alloc
        if mode == Mode.VIEW:
            need_alloc_str = "false"
            if self._need_alloc(type_name):
                need_alloc_str = "true"
            code.append(_indent(f"static constexpr bool NEED_ALLOC = {need_alloc_str};"))

        # Metadata
        type_hash = hash_type(type_def, types)
        deps = []
        for dep in self._get_type_dependencies(type_def):
            deps.append(f"::metadata_of(::messgen::reflect_type<{_qual_name(dep)}>)")
        deps_str = ", ".join(deps)
        code.extend(_format_code(1, f"""\
            static constexpr std::array<const ::messgen::metadata *, 2> DEPENDENCIES{{{deps_str}}};
        """))

        for field in type_def.fields:
            field_c_type = self._cpp_type(field.type, mode)
            code.append(_indent(f"{field_c_type} {field.name}; {_inline_comment(field)}"))

        need_alloc = False
        if mode == Mode.VIEW:
            for field in type_def.fields:
                need_alloc = need_alloc or self._need_alloc(field.type)

        # Serialize function
        code_ser = []

        code_ser.extend(
            [
                "size_t _size = 0;",
                "[[maybe_unused]] ssize_t _field_size;",
                "[[maybe_unused]] messgen::size_type *_size_ptr;",
                "",
            ]
        )

        for group in groups:
            if len(group.fields) > 1:
                code_ser.append("// %s" % ", ".join(group.field_names))
                code_ser.extend(self._memcpy_to_buf("&" + group.fields[0].name, group.size))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_name = field.name
                field_type_def = self._types.get(field.type)
                code_ser.extend(self._serialize_field(field_name, field_type_def))
            code_ser.append("")
        code_ser.append("return _size;")

        is_empty = len(groups) == 0
        code_ser = (
                [
                    "",
                    "size_t serialize(uint8_t *" + ("_buf" if not is_empty else "") + ") const {",
                ]
                + _indent(code_ser)
                + ["}"]
        )
        code.extend(_indent(code_ser))

        # Deserialize function
        alloc = ""
        if need_alloc:
            alloc = ", messgen::Allocator &_alloc"

        self._add_include("messgen/bytes.h", "global")
        code_deser = _format_code(
            0,
            f"""
            ssize_t deserialize(messgen::bytes buf_bytes{alloc}) {{
                [[maybe_unused]]  auto _buf = buf_bytes.data();
                [[maybe_unused]]  auto _buf_size = buf_bytes.size();
                size_t _size = 0;
                [[maybe_unused]] ssize_t _field_size;
                """,
        )

        groups = self._field_groups(fields)
        for group in groups:
            if len(group.fields) > 1:
                code_deser.append(_indent("// %s" % ", ".join(group.field_names)))
                code_deser.extend(_indent(self._memcpy_from_buf("&" + group.fields[0].name, group.size, unsafe=False)))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_type_def = self._types.get(field.type)
                code_deser.extend(_indent(self._deserialize_field(field.name, field_type_def, mode, unsafe=False)))
            code_deser.append("")
        code_deser.extend(
            _format_code(
                0,
                """
            return _size;
        }
        """,
            )
        )

        code.extend(_indent(code_deser))

        # Deserialize unsafe
        code_deser_unsafe = []

        code_deser_unsafe.extend(
            [
                "size_t _size = 0;",
                "[[maybe_unused]] size_t _field_size;",
                "",
            ]
        )

        groups = self._field_groups(fields)
        for group in groups:
            if len(group.fields) > 1:
                code_deser_unsafe.append("// %s" % ", ".join(group.field_names))
                code_deser_unsafe.extend(self._memcpy_from_buf("&" + group.fields[0].name, group.size, unsafe=True))
            elif len(group.fields) == 1:
                field = group.fields[0]
                field_type_def = self._types.get(field.type)
                code_deser_unsafe.extend(self._deserialize_field(field.name, field_type_def, mode, unsafe=True))
            code_deser_unsafe.append("")
        code_deser_unsafe.append("return _size;")

        alloc = ""
        if need_alloc:
            alloc = ", messgen::Allocator &_alloc"
        code_deser_unsafe = (
                [
                    "",
                    "ssize_t deserialize_unsafe(const uint8_t *" + ("_buf" if not is_empty else "") + alloc + ") {",
                ]
                + _indent(code_deser_unsafe)
                + ["}"]
        )
        code.extend(_indent(code_deser_unsafe))

        # Size function
        code_ss = []

        fixed_size = 0
        fixed_fields = []
        for field in fields:
            field_type_def = self._types[field.type]
            field_size = field_type_def.size

            if field_size is None:
                code_ss.extend(self._serialized_size_field(field.name, field_type_def))
                code_ss.append("")
            else:
                fixed_fields.append(field.name)
                fixed_size += field_size

        code_ss.append("return _size;")

        code_ss = (
                [
                    "",
                    "[[nodiscard]] size_t serialized_size() const {",
                    _indent("// %s" % ", ".join(fixed_fields)),
                    _indent("size_t _size = %d;" % fixed_size),
                    "",
                ]
                + _indent(code_ss)
                + ["}"]
        )
        code.extend(_indent(code_ss))

        if self._get_cpp_standard() >= 20 and (mode != Mode.VIEW or is_fixed_size):
            # Operator <=>
            code.append("")
            code.append(_indent(f"auto operator<=>(const struct {unqual_name} &) const = default;"))

        else:
            # Operator ==
            code.append("")

            if len(fields) > 0:
                code.append(_indent(f"friend bool operator==(const struct {unqual_name}& l, const struct {unqual_name}& r) {{"))
                field_name = fields[0].name
                code.append(_indent(f"return l.{field_name} == r.{field_name}", 2))
                for field in fields[1:]:
                    field_name = field.name
                    code.append(_indent(f"   and l.{field_name} == r.{field_name}", 3))
                code[-1] += ";"
            else:
                code.append(_indent(f"friend bool operator==(const struct {unqual_name}&, const struct {unqual_name}&) {{"))
                code.append(_indent("return true;", 2))
            code.append(_indent("}"))

            code.extend(
                [
                    "",
                    _indent(f"friend bool operator!=(const struct {unqual_name}& l, const struct {unqual_name}& r) {{"),
                    _indent("   return !(l == r);"),
                    _indent("}"),
                ]
            )

        code.append("};")

        self._add_include("tuple")

        unqual_name = _unqual_name(type_name)

        code.extend(_format_code(0, f"""
            [[nodiscard]] constexpr auto members_of(::messgen::reflect_t<{unqual_name}>) noexcept {{
                return std::tuple{{
        """))

        for field in type_def.fields:
            code.append(f'        ::messgen::member_variable{{{{"{field.name}"}}, &{unqual_name}::{field.name}}},')

        code.extend(_format_code(0, f"""
                }};
            }}
            
            constexpr messgen::metadata metadata_of(::messgen::reflect_t<{unqual_name}>) noexcept {{
                return messgen::metadata{{
                    .hash = {type_hash}ULL,
                    .name = "{_qual_name(type_name)}",
                    .schema = R"_({self._generate_schema(type_def)})_",
                    .dependencies = ::messgen::span<const ::messgen::metadata *>(&{unqual_name}::DEPENDENCIES)
                }};
            }}
        """))

        return code

    @staticmethod
    def _generate_schema(type_def: MessgenType):
        return json.dumps(asdict(type_def), separators=(",", ":"))

    def _add_include(self, inc, scope="global"):
        self._includes.add((inc, scope))

    def _generate_includes(self):
        code = []
        for inc in sorted(list(self._includes)):
            if inc[1] == "local":
                code.append('#include "%s"' % inc[0])
            else:
                code.append("#include <%s>" % inc[0])
        if len(code) > 0:
            code.append("")
        return code

    def _cpp_type(self, type_name: str, mode: Mode) -> str:
        type_def = self._types[type_name]

        if isinstance(type_def, BasicType):
            if type_def.type_class == TypeClass.scalar:
                self._add_include("cstdint")
                return self._CPP_TYPES_MAP[type_name]

            elif type_def.type_class == TypeClass.string:
                if mode == Mode.VIEW:
                    self._add_include("string_view")
                    return "std::string_view"
                else:
                    self._add_include("string")
                    return "std::string"

            elif type_def.type_class == TypeClass.bytes:
                if mode == Mode.VIEW:
                    self._add_include("messgen/bytes.h")
                    return "messgen::bytes"
                else:
                    self._add_include("vector")
                    return "std::vector<uint8_t>"

        elif isinstance(type_def, DecimalType):
            self._add_include("messgen/decimal.h")
            return self._CPP_TYPES_MAP[type_def.type]

        elif isinstance(type_def, ArrayType):
            self._add_include("array")
            el_c_type = self._cpp_type(type_def.element_type, mode)
            return "std::array<%s, %d>" % (el_c_type, type_def.array_size)

        elif isinstance(type_def, VectorType):
            el_c_type = self._cpp_type(type_def.element_type, mode)
            if mode == Mode.VIEW:
                self._add_include("messgen/span.h")
                return "messgen::span<%s>" % el_c_type
            else:
                self._add_include("vector")
                return "std::vector<%s>" % el_c_type

        elif isinstance(type_def, MapType):
            key_c_type = self._cpp_type(type_def.key_type, mode)
            value_c_type = self._cpp_type(type_def.value_type, mode)
            if mode == Mode.VIEW:
                self._add_include("messgen/map.h")
                return "messgen::map<%s, %s>" % (key_c_type, value_c_type)
            else:
                self._add_include("map")
                return "std::map<%s, %s>" % (key_c_type, value_c_type)

        elif isinstance(type_def, (EnumType, BitsetType)):
            scope = "global" if SEPARATOR in type_name else "local"
            self._add_include("%s.h" % type_name, scope)
            return _qual_name(type_name)

        elif isinstance(type_def, (EnumType, BitsetType, StructType)):
            scope = "global" if SEPARATOR in type_name else "local"
            self._add_include("%s.h" % type_name, scope)
            if mode == Mode.VIEW:
                return _qual_name(type_name)
            else:
                return _qual_stor_name(type_name)

        elif isinstance(type_def, (ExternalType)):
            scope = "global" if SEPARATOR in type_name else "local"
            assert scope == "global", "External type must be in global scope"
            self._add_include("%s.h" % type_name, scope)
            return _qual_name(type_name)

        raise RuntimeError("Can't get c++ type for %s" % type_name)

    def _is_defined_type(self, type_def) -> bool:
        return isinstance(type_def, (StructType, EnumType, BitsetType))

    def _get_type_dependencies(self, type_def) -> set[str]:
        deps = set()
        if isinstance(type_def, StructType):
            for field in type_def.fields:
                field_type_def = self._types[field.type]
                if self._is_defined_type(field_type_def):
                    deps.add(field.type)
                deps.update(self._get_type_dependencies(field_type_def))
        elif isinstance(type_def, (ArrayType, VectorType)):
            el_type_def = self._types[type_def.element_type]
            if self._is_defined_type(el_type_def):
                deps.add(type_def.element_type)
            deps.update(self._get_type_dependencies(el_type_def))
        elif isinstance(type_def, MapType):
            key_type_def = self._types[type_def.key_type]
            if self._is_defined_type(key_type_def):
                deps.add(type_def.key_type)
            deps.update(self._get_type_dependencies(key_type_def))

            value_type_def = self._types[type_def.value_type]
            if self._is_defined_type(value_type_def):
                deps.add(type_def.value_type)
            deps.update(self._get_type_dependencies(value_type_def))

        return deps

    def _need_alloc(self, type_name: str) -> bool:
        type_def = self._types[type_name]

        if isinstance(type_def, (BasicType, DecimalType, EnumType, BitsetType)):
            return False

        elif isinstance(type_def, ArrayType):
            return self._need_alloc(type_def.element_type)

        elif isinstance(type_def, VectorType):
            el_type_def = self._types[type_def.element_type]
            return self._need_alloc(type_def.element_type) or self._get_alignment(el_type_def) > 1

        elif isinstance(type_def, MapType):
            value_type_def = self._types[type_def.value_type]
            return self._need_alloc(type_def.value_type) or self._get_alignment(value_type_def) > 1

        elif isinstance(type_def, StructType):
            for field in type_def.fields:
                if self._need_alloc(field.type):
                    return True
            return False

        elif isinstance(type_def, ExternalType):
            return False

        raise RuntimeError("Can't check if allocator is needed for %s" % type_name)

    def _all_fields_scalar(self, fields: list[FieldType]):
        return all(self._types[field.type].type_class != TypeClass.scalar for field in fields)

    def _field_groups(self, fields):
        groups = [FieldsGroup()] if len(fields) > 0 else []
        for field in fields:
            field_def = self._types.get(field.type)
            align = self._get_alignment(field_def)
            is_flat = self._is_flat_type(field_def)
            size = field_def.size

            # Check if there is padding before this field
            if len(groups[-1].fields) > 0 and (
                    (not groups[-1].is_flat)
                    or (not is_flat)
                    or (size is None)
                    or (groups[-1].size is None)
                    or (groups[-1].size % align != 0)
                    or (size % align != 0)
            ):
                # Start next group
                groups.append(FieldsGroup())

            groups[-1].fields.append(field)
            groups[-1].field_names.append(field.name)
            if groups[-1].size is not None:
                if size is not None:
                    groups[-1].size += size
                else:
                    groups[-1].size = None
            if not is_flat:
                groups[-1].is_flat = False

        return groups

    def _serialize_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def.type_class

        c.append("// %s" % field_name)
        if type_class in [TypeClass.scalar, TypeClass.enum, TypeClass.decimal, TypeClass.bitset]:
            size = field_type_def.size
            if size == 1:
                c.append(f"_buf[_size] = *reinterpret_cast<const uint8_t *>(&{field_name});")
                c.append(f"_size += {size};")
            else:
                c.extend(self._memcpy_to_buf(f"&{field_name}", size))

        elif type_class in [TypeClass.struct, TypeClass.external]:
            c.append("_size += %s.serialize(&_buf[_size]);" % field_name)

        elif type_class in [TypeClass.array, TypeClass.vector]:
            if type_class == TypeClass.vector:
                c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
                c.append("_size += sizeof(messgen::size_type);")
            el_type_def = self._types.get(field_type_def.element_type)
            el_size = el_type_def.size
            el_align = self._get_alignment(el_type_def)

            if el_size == 0 or (type_class == TypeClass.array and field_type_def.size == 0):
                pass
            elif self._is_flat_type(el_type_def) and el_size % el_align == 0:
                # Vector or array of flat aligned elements, optimize with single memcpy
                c.append(f"_field_size = {el_size} * {field_name}.size();")
                c.extend(self._memcpy_to_buf(f"{field_name}.data()", "_field_size"))
            else:
                # Serialize one by one
                c.append(f"for (auto &_i{level_n}: {field_name}) {{")
                c.extend(_indent(self._serialize_field(f"_i{level_n}", el_type_def, level_n=level_n + 1)))
                c.append("}")

        elif type_class == TypeClass.map:
            c.append("*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = %s.size();" % field_name)
            c.append("_size += sizeof(messgen::size_type);")
            key_type_def = self._types.get(field_type_def.key_type)
            value_type_def = self._types.get(field_type_def.value_type)
            c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
            c.extend(_indent(self._serialize_field("_i%d.first" % level_n, key_type_def, level_n=level_n + 1)))
            c.extend(_indent(self._serialize_field("_i%d.second" % level_n, value_type_def, level_n=level_n + 1)))
            c.append("}")

        elif type_class in [TypeClass.string, TypeClass.bytes]:
            c.append(f"*reinterpret_cast<messgen::size_type *>(&_buf[_size]) = {field_name}.size();")
            c.append("_size += sizeof(messgen::size_type);")
            if type_class == TypeClass.string:
                c.append(f"{field_name}.copy(reinterpret_cast<char *>(&_buf[_size]), {field_name}.size());")
                c.append(f"_size += {field_name}.size();")
            else:
                c.extend(self._memcpy_to_buf(f"{field_name}.data()", f"{field_name}.size()"))

        else:
            raise RuntimeError("Unsupported type_class in _serialize_field: %s" % type_class)

        return c

    def _deserialize_field(self, field_name, field_type_def, mode: Mode, level_n=0, unsafe=False):
        c = []

        type_class = field_type_def.type_class

        c.append("// %s" % field_name)
        if type_class in [TypeClass.scalar, TypeClass.enum, TypeClass.decimal, TypeClass.bitset]:
            size = field_type_def.size
            c.extend(self._memcpy_from_buf(f"&{field_name}", size, unsafe))

        elif type_class in [TypeClass.struct, TypeClass.external]:
            alloc = ""
            if mode == Mode.VIEW and self._need_alloc(field_type_def.type):
                alloc = ", _alloc"

            if unsafe:
                c.append(f"_size += {field_name}.deserialize_unsafe(&_buf[_size]{alloc});")
            else:
                c.extend(
                    _format_code(
                        0,
                        f"""
                    _field_size = {field_name}.deserialize({{&_buf[_size], _buf_size - _size}}{alloc});
                    if (_field_size < 0) [[unlikely]] {{
                        return -1;
                    }}
                    _size += _field_size;
                """,
                    )
                )

        elif type_class in [TypeClass.array, TypeClass.vector]:
            # For vector read the size and allocate memory if needed
            if type_class == TypeClass.vector:
                c.extend(self._check_buf_size("sizeof(messgen::size_type)", unsafe))
                c.extend(
                    _format_code(
                        0,
                        """
                    _field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);
                    _size += sizeof(messgen::size_type);
                    """,
                    )
                )
                if mode == Mode.STORAGE:
                    c.append(f"{field_name}.resize(_field_size);")

            el_type_def = self._types.get(field_type_def.element_type)
            el_size = el_type_def.size
            el_align = self._get_alignment(el_type_def)
            el_c_type = self._cpp_type(field_type_def.element_type, mode)

            # Copy data
            if el_size == 0 or (type_class == TypeClass.array and field_type_def.size == 0):
                pass
            elif self._is_flat_type(el_type_def) and el_size % el_align == 0:
                # Vector or array of flat aligned elements, optimize with single memcpy or zero-copy
                if mode == Mode.VIEW:
                    if el_align == 1 and type_class == TypeClass.vector:
                        # For the vector (messgen::span) with alignment == 1 point to data in source buffer, zero-copy
                        c.extend(self._check_buf_size(f"_field_size * {el_size}", unsafe))
                        c.append(
                            f"{field_name} = {{const_cast<{el_c_type} *>(reinterpret_cast<const {el_c_type} *>(&_buf[_size])), size_t(_field_size)}};"
                        )
                        c.append(f"_size += _field_size * {el_size};")
                    else:
                        # Allocate memory if needed and copy data
                        if type_class == TypeClass.vector:
                            c.append(f"{field_name} = {{_alloc.alloc<{el_c_type}>(_field_size), size_t(_field_size)}};")
                        # Vector or array of flat aligned elements, optimize with single memcpy
                        c.append(f"_field_size = {el_size} * {field_name}.size();")
                        c.extend(self._memcpy_from_buf("%s.data()" % field_name, "_field_size", unsafe))
                else:
                    c.append(f"_field_size = {el_size} * {field_name}.size();")
                    c.extend(self._memcpy_from_buf(f"{field_name}.data()", "_field_size", unsafe))
            else:
                # Deserialize one by one
                if mode == Mode.VIEW and type_class == TypeClass.vector:
                    c.append(f"{field_name} = {{_alloc.alloc<{el_c_type}>(_field_size), size_t(_field_size)}};")
                c.append(f"for (auto &_i{level_n}: {field_name}) {{")
                c.extend(_indent(
                    self._deserialize_field(f"_i{level_n}", el_type_def, mode, level_n=level_n + 1, unsafe=unsafe)))
                c.append("}")

        elif type_class == TypeClass.map:
            key_c_type = self._cpp_type(field_type_def.key_type, mode)
            key_type_def = self._types.get(field_type_def.key_type)
            value_c_type = self._cpp_type(field_type_def.value_type, mode)
            value_type_def = self._types.get(field_type_def.value_type)
            if mode == Mode.STORAGE:
                c.append("{")
                c.extend(self._check_buf_size("sizeof(messgen::size_type)", unsafe))
                c.extend(
                    _format_code(
                        0,
                        f"""
                    size_t _map_size{level_n} = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);
                    _size += sizeof(messgen::size_type);
                    for (size_t _i{level_n} = 0; _i{level_n} < _map_size{level_n}; ++_i{level_n}) {{
                        {key_c_type} _key{level_n};
                        {value_c_type} _value{level_n};
                """,
                    )
                )
                c.extend(_indent(
                    self._deserialize_field(f"_key{level_n}", key_type_def, mode, level_n=level_n + 1, unsafe=unsafe),
                    2))
                c.extend(_indent(self._deserialize_field(f"_value{level_n}", value_type_def, mode, level_n=level_n + 1,
                                                         unsafe=unsafe)))
                c.extend(
                    _format_code(
                        1,
                        f"""
                        {field_name}.insert({{_key{level_n}, _value{level_n}}});
                    }}
                }}
                """,
                    )
                )
            elif mode == Mode.VIEW:
                c.extend(self._check_buf_size("sizeof(messgen::size_type)", unsafe))
                c.append("_field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);")
                c.append("_size += sizeof(messgen::size_type);")
                # if el_align > 1:
                # Allocate memory and copy data to recover alignment
                c.append(
                    f"{field_name} = {{_alloc.alloc<decltype({field_name})::value_type>(_field_size), size_t(_field_size)}};")

                if key_type_def.size == 0 and value_type_def.size == 0:
                    pass

                # Vector or array of variable size elements
                c.append(f"for (auto &_i{level_n}: {field_name}) {{")
                c.extend(_indent(self._deserialize_field(f"_i{level_n}.first", key_type_def, mode, level_n=level_n + 1,
                                                         unsafe=unsafe)))
                c.extend(_indent(
                    self._deserialize_field(f"_i{level_n}.second", value_type_def, mode, level_n=level_n + 1,
                                            unsafe=unsafe)))
                c.append("}")

        elif type_class == TypeClass.string:
            c.extend(self._check_buf_size("sizeof(messgen::size_type)", unsafe))
            c.extend(
                _format_code(
                    0,
                    """
                    _field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);
                    _size += sizeof(messgen::size_type);
                    """,
                )
            )

            c.extend(self._check_buf_size("_field_size", unsafe))
            c.extend(
                _format_code(
                    0,
                    f"""
                    {field_name} = {{reinterpret_cast<const char *>(&_buf[_size]), size_t(_field_size)}};
                    _size += _field_size;
                    """,
                )
            )

        elif type_class == TypeClass.bytes:
            c.extend(self._check_buf_size("sizeof(messgen::size_type)", unsafe))
            c.extend(
                _format_code(
                    0,
                    """
                    _field_size = *reinterpret_cast<const messgen::size_type *>(&_buf[_size]);
                    _size += sizeof(messgen::size_type);
                    """,
                )
            )

            c.extend(self._check_buf_size("_field_size", unsafe))
            if mode == Mode.VIEW:
                c.extend(_format_code(0, f"{field_name} = {{&_buf[_size], size_t(_field_size)}};"))
            else:
                c.extend(_format_code(0, f"{field_name}.assign(&_buf[_size], &_buf[_size + _field_size]);"))
            c.append("_size += _field_size;")
        else:
            raise RuntimeError("Unsupported type_class in _deserialize_field: %s" % type_class)

        return c

    def _serialized_size_field(self, field_name, field_type_def, level_n=0):
        c = []

        type_class = field_type_def.type_class

        c.append("// %s" % field_name)
        if type_class == TypeClass.scalar:
            size = field_type_def.size
            c.append("_size += %d;" % size)

        elif type_class in [TypeClass.struct, TypeClass.external]:
            c.append("_size += %s.serialized_size();" % field_name)

        elif type_class in [TypeClass.array, TypeClass.vector]:
            if field_type_def.type_class == TypeClass.vector:
                c.append("_size += sizeof(messgen::size_type);")
            el_type = self._types.get(field_type_def.element_type)
            el_size = el_type.size
            if el_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (el_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d" % level_n, el_type, level_n + 1)))
                c.append("}")

        elif type_class == TypeClass.map:
            c.append("_size += sizeof(messgen::size_type);")
            key_type = self._types.get(field_type_def.key_type)
            value_type = self._types.get(field_type_def.value_type)
            key_size = key_type.size
            value_size = value_type.size
            if key_size is not None and value_size is not None:
                # Vector or array of fixed size elements
                c.append("_size += %d * %s.size();" % (key_size + value_size, field_name))
            else:
                # Vector or array of variable size elements
                c.append("for (auto &_i%d: %s) {" % (level_n, field_name))
                c.extend(_indent(self._serialized_size_field("_i%d.first" % level_n, key_type, level_n + 1)))
                c.extend(_indent(self._serialized_size_field("_i%d.second" % level_n, value_type, level_n + 1)))
                c.append("}")

        elif type_class in [TypeClass.string, TypeClass.bytes]:
            c.append("_size += sizeof(messgen::size_type);")
            c.append("_size += %s.size();" % field_name)

        else:
            raise RuntimeError("Unsupported type_class in _serialized_size_field: %s" % field_type_def.type_class)

        return c

    def _memcpy_to_buf(self, src: str, size) -> list:
        return ["::memcpy(&_buf[_size], %s, %s);" % (src, size), "_size += %s;" % size]

    def _memcpy_from_buf(self, dst: str, size, unsafe: bool) -> list:
        c = self._check_buf_size(size, unsafe)
        if size == 1:
            c.append(f"*reinterpret_cast<uint8_t *>({dst}) = _buf[_size];")
            c.append(f"_size += {size};")
        else:
            c.extend(
                _format_code(
                    0,
                    f"""
                ::memcpy({dst}, &_buf[_size], {size});
                _size += {size};
            """,
                )
            )

        return c

    def _check_buf_size(self, size, unsafe):
        if not unsafe:
            return _format_code(
                0,
                f"""
                if (_buf_size < _size + {size}) [[unlikely]] {{
                    return -1;
                }}
            """,
            )
        else:
            return []
