import os

from messgen import MessgenException


def to_camelcase(str):
    return ''.join(x for x in str.title().replace('_', '') if not x.isspace())


def imported_module_name(m):
    return m + "_message"


def fmt_int8(var, t_info):
    return "buf[ptr] = byte(v.%s)\n" \
           "ptr += 1" % var


def parse_int8(var, t_info):
    return "v.%s = %s(buf[ptr])\n" \
           "ptr += 1" % (var, t_info["element_type"])


def fmt_int(var, t_info):
    et = t_info["element_type"]
    if et.startswith("u"):
        return "binary.LittleEndian.Put%s(buf[ptr:], v.%s)\n" \
               "ptr += %s" % (to_camelcase(et), var, t_info["element_size"])
    else:
        return "binary.LittleEndian.PutU%s(buf[ptr:], u%s(v.%s))\n" \
               "ptr += %s" % (et, et, var, t_info["element_size"])


def parse_int(var, t_info):
    et = t_info["element_type"]
    if et.startswith("u"):
        return "v.%s = binary.LittleEndian.%s(buf[ptr:])\n" \
               "ptr += %s" % (var, to_camelcase(et), t_info["element_size"])
    else:
        return "v.%s = %s(binary.LittleEndian.U%s(buf[ptr:]))\n" \
               "ptr += %s" % (var, et, et, t_info["element_size"])


def fmt_float(var, t_info):
    et = t_info["element_type"]
    bits = et[5:]
    return "binary.LittleEndian.PutUint%s(buf[ptr:], math.Float%sbits(v.%s))\n" \
           "ptr += %s" % (bits, bits, var, t_info["element_size"])


def parse_float(var, t_info):
    et = t_info["element_type"]
    bits = et[5:]
    return "v.%s = math.Float%sfrombits(binary.LittleEndian.Uint%s(buf[ptr:]))\n" \
           "ptr += %s" % (var, bits, bits, t_info["element_size"])


def fmt_embedded(var, t_info):
    return "pn, err := v.%s.Pack(buf[ptr:])\n" \
           "if err != nil {\n" \
           "\treturn 0, err\n" \
           "}\n" \
           "ptr += pn" % var


def parse_embedded(var, t_info):
    return "err := v.%s.Unpack(buf[ptr:])\n" \
           "if err != nil {\n" \
           "\treturn err\n" \
           "}\n" \
           "ptr += v.%s.MsgSize()" % (var, var)


def sizeof_dynamic(var, t_info):
    return "4 + %s*len(v.%s)" % (t_info["element_size"], var)


def sizeof_array_of_dynamic(var, t_info):
    return "4 + func(a %s) int { sz := 0; for _, i := range(a) { sz += i.MsgSize() }; return sz }(v.%s)" % (t_info["storage_type"], var)


def min_sizeof_array_of_dynamic(var, t_info):
    return "messgen.ArrayOfDynamicMinSize(v.%s)" % var


def sizeof_embedded(var, t_info):
    return "v.%s.MsgSize()" % var


def min_sizeof_embedded(var, t_info):
    return t_info["element_type"] + "MinMsgSize"


def fmt_string(var, t_info):
    return "messgen.WriteString(buf[ptr:], v.%s)\n" \
           "ptr += 4 + len(v.%s)" % (var, var)


def parse_string(var, t_info):
    return "v.%s = messgen.ReadString(buf[ptr:])\n" \
           "ptr += 4 + len(v.%s)" % (var, var)


messgen_types_go = {
    "char": {"fmt": fmt_int8, "parse": parse_int8, "element_type": "byte"},
    "int8": {"fmt": fmt_int8, "parse": parse_int8},
    "uint8": {"fmt": fmt_int8, "parse": parse_int8},
    "int16": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint16": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "int32": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint32": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "int64": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "uint64": {"fmt": fmt_int, "parse": parse_int, "imports": ["encoding/binary"]},
    "float32": {"fmt": fmt_float, "parse": parse_float, "imports": ["math", "encoding/binary"]},
    "float64": {"fmt": fmt_float, "parse": parse_float, "imports": ["math", "encoding/binary"]},
    "string": {"fmt": fmt_string, "parse": parse_string, "imports": ["$MESSGEN_MODULE_PATH/messgen"]},
}


class GoGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"

    def __init__(self, modules_map, data_types_map, module_sep, variables):
        self.MODULE_SEP = module_sep
        self._modules_map = modules_map
        self._data_types_map = data_types_map
        self._variables = variables

    def generate(self, out_dir):
        package = "message"

        for module_name, module in self._modules_map.items():
            module_out_dir = \
                out_dir + \
                os.path.sep + \
                module_name.replace(self.MODULE_SEP, os.path.sep) + \
                os.path.sep + \
                package

            try:
                if not os.path.isdir(module_out_dir):
                    os.makedirs(module_out_dir)
            except OSError as e:
                print(e)
                pass

            consts_code = ["package %s" % package, "", "const ProtoId = %s" % module["proto_id"]]
            self.__write_file(module_out_dir + os.path.sep + "message.go", consts_code)
            for msg in module["messages"]:
                code = ["package %s" % package, ""]
                code.extend(self.generate_msg(msg))
                self.__write_file(module_out_dir + os.path.sep + msg["name"] + ".go", code)

    def generate_msg(self, msg):
        msg_name = to_camelcase(msg["name"])
        fields = msg["fields"]

        code = []

        # Imports
        imports_code = ["import ("]

        # Struct
        struct_code = ["type %s struct {" % msg_name]
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(msg, field)
            struct_code.append("\t%s %s" % (field_name, type_info["storage_type"]))
            if "imports" in type_info:
                for i in type_info["imports"]:
                    if type(i) is tuple:
                        imp = "%s \"%s\"" % i
                    else:
                        imp = "\"%s\"" % i
                    if "$MESSGEN_MODULE_PATH" in imp:
                        try:
                            messgen_go_module = self._variables["messgen_go_module"]
                        except KeyError:
                            raise MessgenException(
                                "Variable 'messgen_go_module' required but not set, set it with -D option")

                        imp = imp.replace("$MESSGEN_MODULE_PATH", messgen_go_module)
                    s = '    ' + imp
                    if s not in imports_code:
                        imports_code.append(s)
        imports_code.append('    "fmt"')
        struct_code.append("}")
        struct_code.append("")

        imports_code.append(")")
        imports_code.append("")

        code.extend(imports_code)
        code.extend(struct_code)

        # Constants
        if "id" in msg:
            code.append("const %sMsgId = %i" % (msg_name, msg["id"]))
        code.append("const %sMinMsgSize = %i" % (msg_name, self.min_msg_size(msg)))
        code.append("")

        # Type
        if "id" in msg:
            code.append("func (v *%s) MsgId() int {" % msg_name)
            code.append("\treturn %d" % msg["id"])
            code.append("}")
            code.append("")

        # Size
        code.extend(self.generate_msg_size(msg))

        # Pack
        code.extend(self.generate_pack(msg))

        # Unpack
        code.extend(self.generate_unpack(msg))

        # String()
        code.append('func (v *%s) String() string {' % msg_name)
        s = []
        for field in fields:
            s.append("%s=%%v" % (field["name"],))
        code.append('\treturn fmt.Sprintf("<%s %s>",' % (msg_name, " ".join(s),))
        a = []
        for field in fields:
            a.append("v.%s" % (to_camelcase(field["name"])))
        code.append("\t\t%s)" % (", ".join(a),))
        code.append("}")
        code.append("")
        return code

    def generate_msg_size(self, msg):
        msg_name = to_camelcase(msg["name"])
        fields = msg["fields"]

        code = []

        code.append("func (v *%s) MsgSize() int {" % msg_name)
        static_size = 0
        size_str_p = []
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(msg, field)
            s = type_info["total_size"]
            if isinstance(s, int):
                static_size += s
            else:
                size_str_p.append(s(field_name, type_info))

        size_str = ""
        if static_size != 0:
            size_str_p = [str(static_size)] + size_str_p

        if len(size_str_p) > 0:
            size_str += " + ".join(size_str_p)
        else:
            size_str = "0"
        code.append("\treturn %s" % size_str)
        code.append("}")
        code.append("")

        return code

    def generate_pack(self, msg):
        msg_name = to_camelcase(msg["name"])
        fields = msg["fields"]

        code = []
        code.append("func (v *%s) Pack(buf []byte) (int, error) {" % msg_name)
        code.append("\tif len(buf) < v.MsgSize() {")
        code.append(
            '\t\treturn 0, fmt.Errorf("invalid buffer size for packing %s: %%d, should be >=%%d", len(buf), v.MsgSize())' % msg_name)
        code.append("\t}")
        code.append("\tptr := 0")
        for field in fields:
            field_name = to_camelcase(field["name"])
            var = field_name
            type_info = self.get_type_info(msg, field)
            if type_info == None:
                raise Exception("Unsupported type: " + field["type"] + " in message " + msg["name"])
            if type_info["is_dynamic"]:
                var += "[i]"
                code.append("\tbinary.LittleEndian.PutUint32(buf[ptr:], uint32(len(v.%s)))" % field_name)
                code.append("\tptr += 4")
                if type_info["element_size"] == 1:
                    code.append("\tcopy(buf[ptr:], []byte(v.%s))" % field_name)
                    code.append("\tptr += len(v.%s)" % field_name)
                else:
                    code.append("\tfor i := 0; i < len(v.%s); i++ {" % field_name)
                    code.append(type_info["fmt"](var, type_info))
                    code.append("\t}")
            elif type_info["is_array"]:
                var += "[i]"
                code.append("\tfor i := 0; i < %s; i++ {" % type_info["num"])
                code.append(type_info["fmt"](var, type_info))
                code.append("\t}")
            else:
                code.append(type_info["fmt"](var, type_info))
        code.append("\treturn ptr, nil")
        code.append("}")
        code.append("")

        return code

    def generate_unpack(self, msg):
        msg_name = to_camelcase(msg["name"])
        fields = msg["fields"]

        code = []
        code.append("func (v *%s) Unpack(buf []byte) error {" % msg_name)
        code.append("\tif len(buf) < %sMinMsgSize {" % msg_name)
        code.append(
            "\t\treturn fmt.Errorf(\"invalid buffer size for unpacking %s: %%d, should be >=%%d\", len(buf), %sMinMsgSize)" % (
                msg_name, msg_name))
        code.append("\t}")
        if len(fields) > 0:
            code.append("\tptr := 0")
        for field in fields:
            field_name = to_camelcase(field["name"])
            type_info = self.get_type_info(msg, field)
            if type_info["is_dynamic"]:
                if type_info["element_size"] == 1:
                    code.append("\t{")
                    code.append("\t\tn := int(binary.LittleEndian.Uint32(buf[ptr:]))")
                    code.append("\t\tptr += 4")
                    code.append("\t\tv.%s = make([]%s, n)" % (field_name, type_info["element_type"]))
                    code.append("\t\tcopy(v.%s, buf[ptr : ptr+n])" % field_name)
                    code.append("\t\tptr += len(v.%s)" % field_name)
                    code.append("\t}")
                else:
                    code.append("\t{")
                    code.append("\t\tn := int(binary.LittleEndian.Uint32(buf[ptr:]))")
                    code.append("\t\tptr += 4")
                    code.append("\t\tv.%s = make([]%s, n)" % (field_name, type_info["element_type"]))
                    code.append("\t\tfor i := 0; i < n; i++ {")
                    code.append(type_info["parse"](field_name + "[i]", type_info))
                    code.append("\t\t}")
                    code.append("\t}")
            elif type_info["is_array"]:
                code.append("\tfor i := 0; i < %s; i++ {" % type_info["num"])
                code.append(type_info["parse"](field_name + "[i]", type_info))
                code.append("\t}")
            else:
                code.append(type_info["parse"](field_name, type_info))
        code.append("\treturn nil")
        code.append("}")
        code.append("")

        return code

    def get_type_info(self, parent_msg, f):
        t = f["type"]

        type_info = dict(self._data_types_map[t])
        type_info["name"] = f["name"]
        type_info["is_array"] = f["is_array"]
        type_info["is_dynamic"] = f["is_dynamic"]
        type_info["num"] = f["num"]
        type_info["element_type"] = t
        type_info["imports"] = []

        if type_info["plain"]:
            # Plain type
            mt = messgen_types_go.get(t)
            if mt == None:
                raise Exception("Unknown type for Go generator: " + t)
            type_info.update(mt)
        else:
            # Embedded type
            tp = t.split("/")
            ptp = parent_msg["typename"].split("/")
            if tp[0] != ptp[0] or tp[2] != ptp[2]:
                # Add import for embedded messages from other modules
                type_info["imports"].append(
                    (imported_module_name(tp[2]), "$MESSGEN_MODULE_PATH/%s/%s/message" % (tp[0], tp[2])))
                type_info["element_type"] = "%s.%s" % (imported_module_name(tp[-2]), to_camelcase(tp[-1]))
            else:
                # Embedded message from the same module
                type_info["element_type"] = "%s" % to_camelcase(tp[-1])

            type_info["fmt"] = fmt_embedded
            type_info["parse"] = parse_embedded

        static_size = type_info["static_size"]

        if type_info["has_dynamics"]:
            type_info["element_size"] = "INVALID"  # Must not be used
        else:
            type_info["element_size"] = static_size

        type_info["storage_type"] = type_info["element_type"]

        if type_info["is_dynamic"]:
            # Dynamic array
            if type_info["has_dynamics"]:
                type_info["total_size"] = sizeof_array_of_dynamic
                type_info["min_size"] = 4
            else:
                type_info["total_size"] = sizeof_dynamic
                type_info["min_size"] = 4
            type_info["storage_type"] = "[]" + type_info["element_type"]
            if t != "string":
                type_info["imports"].append("encoding/binary")
        elif type_info["is_array"]:
            # Fixed size array
            if type_info["has_dynamics"]:
                type_info["total_size"] = sizeof_array_of_dynamic
                type_info["min_size"] = min_sizeof_array_of_dynamic
            else:
                type_info["total_size"] = static_size * f["num"]
                type_info["min_size"] = type_info["total_size"]
            type_info["storage_type"] = "[" + str(f["num"]) + "]" + type_info["element_type"]
        else:
            # Non-array field
            if type_info["has_dynamics"]:
                type_info["total_size"] = sizeof_embedded
                type_info["min_size"] = min_sizeof_embedded
            else:
                type_info["total_size"] = static_size
                type_info["min_size"] = static_size

        # TODO: FIXME
        if t == "string":
            type_info["is_dynamic"] = False
            type_info["total_size"] = sizeof_dynamic
            type_info["storage_type"] = "string"

        return type_info

    def total_size_str(self, field_name, type_info):
        s = type_info["total_size"]
        if isinstance(s, int):
            return str(s)
        else:
            return s(field_name, type_info)

    def min_msg_size(self, msg):
        sz = 0
        for f in msg["fields"]:
            t_info = self.get_type_info(msg, f)
            s = t_info["total_size"]
            if isinstance(s, int):
                sz = sz + s
            else:
                sz += 4
        return sz

    @staticmethod
    def __write_file(fpath, code):
        with open(fpath, "w") as f:
            for line in code:
                f.write("%s\n" % line)
