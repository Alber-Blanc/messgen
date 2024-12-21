import os
from .common import SEPARATOR
from pathlib import Path

from .validation import validate_protocol

from .model import (
    MessgenType,
    Protocol,
    TypeClass,
)

class TypeScriptTypes:
    TYPE_MAP = {
        "bool": "boolean",
        "char": "string",
        "int8": "number",
        "uint8": "number",
        "int16": "number",
        "uint16": "number",
        "int32": "number",
        "uint32": "number",
        "int64": "bigint",
        "uint64": "bigint",
        "float32": "number",
        "float64": "number",
        "string": "string",
        "bytes": "Uint8Array",
    }

    TYPED_ARRAY_MAP = {
        "int8": "Int8Array",
        "uint8": "Uint8Array",
        "int16": "Int16Array",
        "uint16": "Uint16Array",
        "int32": "Int32Array",
        "uint32": "Uint32Array",
        "int64": "BigInt64Array",
        "uint64": "BigUint64Array",
        "float32": "Float32Array",
        "float64": "Float64Array",
    }

    @classmethod
    def get_type(cls, type_name):
        return cls.TYPE_MAP.get(type_name, type_name)

    @classmethod
    def get_typed_array(cls, type_name):
        return cls.TYPED_ARRAY_MAP.get(type_name, None)

class TypeScriptGenerator:
    _TYPES_FILE = "types.ts"
    _PROTOCOLS_FILE = "protocols.ts"

    def __init__(self, options):
        self._options = options
        self._types = []


    def generate(self, out_dir: Path, types: dict[str, MessgenType], protocols: dict[str, Protocol]) -> None:
        self.validate(types, protocols)
        self.generate_types(out_dir, types)
        self.generate_protocols(out_dir, protocols)

    def validate(self, types: dict[str, MessgenType], protocols: dict[str, Protocol]):
        for proto_def in protocols.values():
            validate_protocol(proto_def, types)

    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        types = set()
        code = []

        for proto_name, proto_def in protocols.items():
            code.append(f"export interface {self._to_camel_case(proto_name)} {{")
            code.append(f"  '{proto_name}': {{")
            for message in proto_def.messages.values():
                ts_struct_name = self._to_camel_case(message.type)
                code.append(f"    '{message.name}': {ts_struct_name};")
                types.add(ts_struct_name)
            code.append('  }')
            code.append('}')
            code.append('')

        import_statements = self._generate_protocol_imports(types)
        protocol_types = ' | '.join(self._to_camel_case(proto_name) for proto_name in protocols.keys())
        final_code = '\n'.join(import_statements + code) + f'export type Protocol = {protocol_types};'


        self._write_output_file(out_dir, self._PROTOCOLS_FILE, final_code)

    def _generate_protocol_imports(self, types: set[str]) -> list[str]:
        import_statements = ["import type {"]
        for struct_name in types:
            import_statements.append(f"    {struct_name},")
        import_statements.append("} from './types';")
        import_statements.append('')
        return import_statements

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        self._types.clear()

        for type_name, type_def in types.items():
            if type_def.type_class == TypeClass.struct:
                self._generate_struct(type_name, type_def)
            elif type_def.type_class == TypeClass.enum:
                self._generate_enum(type_name, type_def)

        code = '\n'.join(self._types)

        self._write_output_file(out_dir, self._TYPES_FILE, code)

    def _generate_enum(self, enum_name, type_def):
        self._types.append(f"export enum {self._to_camel_case(enum_name)} {{")

        for value in type_def.values or []:
            if value.comment != None:
                self._types.append(f"  /** {value.comment} */")
            value_name = self._to_camel_case(value.name)
            self._types.append(f"  {value_name} = {value.value},")

        self._types.append("}")
        self._types.append("")

    def _generate_struct(self, name: str, type_def: MessgenType):
        self._types.append(f"export interface {self._to_camel_case(name)} {{")
        fields = getattr(type_def, 'fields', []) or []

        for field in fields:
            if field.comment != None:
                self._types.append(f"  /** {field.comment} */")

            field_name = field.name
            field_type = self._get_ts_type(field.type)
            self._types.append(f"  {field_name}: {field_type};")

        self._types.append("}")
        self._types.append("")

    def _get_ts_type(self, field_type: str):
        typed_array_type = self._is_typed_array(field_type)
        if typed_array_type:
            return typed_array_type

        if field_type.endswith('[]'):
            base_type = field_type[:-2]
            ts_base_type = self._get_ts_type(base_type)
            return f"{ts_base_type}[]"
        if '[' in field_type and field_type.endswith(']'):
            base_type = field_type[:field_type.find('[')]
            ts_base_type = self._get_ts_type(base_type)
            return f"{ts_base_type}[]"

        if '{' in field_type and field_type.endswith('}'):
            base_type = field_type[:field_type.find('{')]
            key_type = field_type[field_type.find('{')+1:-1]
            ts_value_type = self._get_ts_type(base_type)
            ts_key_type = self._get_ts_type(key_type)
            return f"Map<{ts_key_type}, {ts_value_type}>"

        if field_type in TypeScriptTypes.TYPE_MAP:
            return TypeScriptTypes.get_type(field_type)

        return self._to_camel_case(field_type)

    def _is_typed_array(self, field_type):
        if field_type.endswith('[]'):
            base_type = field_type[:-2]
            typed_array = TypeScriptTypes.get_typed_array(base_type)
            if typed_array:
                return typed_array
        if '[' in field_type and field_type.endswith(']'):
            base_type = field_type[:field_type.find('[')]
            typed_array = TypeScriptTypes.get_typed_array(base_type)
            if typed_array:
                return typed_array
        return None

    def _write_output_file(self, output_path, file, content):
        output_file = os.path.join(output_path, f"{file}")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)

    @staticmethod
    def _to_camel_case(s: str):
        name = '_'.join(s.split(SEPARATOR))
        return ''.join(word.capitalize() for word in name.split('_'))


