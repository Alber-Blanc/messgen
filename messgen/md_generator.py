import os
from pathlib import Path
from .model import (
    MessgenType,
    Protocol,
)


def to_camelcase(str):
    return "".join(x for x in str.title().replace("_", "") if not x.isspace())


def to_kebabcase(str):
    return str.lower().replace(" ", "-")


ts_types_map = {
    "bytes": "uint8[]",
    "char": "string",
    "int8": "number",
    "uint8": "number",
    "int16": "number",
    "uint16": "number",
    "int32": "number",
    "uint32": "number",
    "int64": "number",
    "uint64": "number",
    "float32": "number",
    "float64": "number",
    "string": "string",
}


def format_type(f):
    f_type = f["type"]

    if "/" in f["type"]:
        din_type = f_type.split('/').pop()
        f_type = "[%s](#%s)" % (din_type, to_kebabcase(din_type))

    if f["is_array"]:
        if f['num'] > 1:
            f_type += f"[{f['num']}]"
        else:
            f_type += "[]"

    return f_type


class MdGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        # TODO
        pass

    def generate_protocols(self, out_dir: Path, types: dict[str, MessgenType], protocols: dict[str, Protocol]) -> None:
        # TODO
        pass

    def get_max_length_by_key(self, key, data, min_len=0):
        max_len = min_len
        for d in data:
            if d.get(key) is not None and len(str(d[key])) > max_len:
                max_len = len(str(d[key]))
        return max_len

    def add_spase(self, value, max_len):
        if not (value):
            return " " * (max_len)

        return str(value) + " " * (max_len - len(str(value)))

    def id_to_str(self, id):
        return str(id) if id != 0 else "0"

    def convert_field(self, field):
        f_type = format_type(field)
        return {
            "name": field["name"],
            "type": f_type,
            "descr": field.get("descr") if field.get("descr") is not None else "",
        }

    def generate_interface(self, msg):
        msg_name = msg["name"]

        out = []
        out.append("### %s\n" % (msg_name))
        out.append("id:%s%s\n" % (msg["id"], " | " + msg.get("descr") if msg.get("descr") is not None else ""))

        fields = list(map(self.convert_field, msg["fields"]))
        field_max_len = self.get_max_length_by_key("name", fields, len("Field"))
        type_max_len = self.get_max_length_by_key("type", fields, len("Type"))
        dict_max_len = self.get_max_length_by_key("descr", fields, len("Comment"))

        out.append(
            "| %s | %s | %s |"
            % (
                self.add_spase("Field", field_max_len),
                self.add_spase("Type", type_max_len),
                self.add_spase("Comment", dict_max_len),
            )
        )

        out.append(
            "|-%s-|-%s-|-%s-|"
            % ("-" * field_max_len, "-" * type_max_len, "-" * dict_max_len)
        )

        for f in fields:
            out.append(
                "| %s | %s | %s |"
                % (
                    self.add_spase(f["name"], field_max_len),
                    self.add_spase(f["type"], type_max_len),
                    self.add_spase(f["descr"], dict_max_len),
                )
            )

        return out

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
