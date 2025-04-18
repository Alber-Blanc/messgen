from abc import abstractmethod
from pathlib import Path
import pathlib
import subprocess

from .model import (
    ArrayType,
    BasicType,
    MessgenType,
    Protocol,
    TypeClass,
    VectorType,
    hash_message,
)

# - Converts snake_case to camel case
# - Ensures first letter is capitalize to enforce golang visibility
def toGoName(name: str):
    parts = name.split('_')
    return "".join([x.capitalize() for x in parts])

# Wraps messgen model
class ResolvedType:
    def __init__(self, model: MessgenType):
        parsed = model.type.split("/")

        self._model = model
        self._package = None
        self._name = toGoName(parsed[-1])
        if len(parsed) > 1:
            self._package = parsed[:-1]

    def name(self):
        return self._name

    def package_full(self):
        return "/".join(self._package)

    def package_name(self):
        return self._package[-1]

    def imported(self, caller_pkg = None):
        return caller_pkg != self._package

    def reference(self, caller_pkg = None):
        if self.imported(caller_pkg):
            assert(self._package != None)
            return "%s.%s" % (self.package_name(), self._name)

        return self._name

    def is_flat(self):
        return False

    @abstractmethod
    def alignment(self):
        raise Exception("alignment is not defined for '%s'" % self._model.type)

    @abstractmethod
    def data_size(self):
        raise Exception("data_size is not defined for '%s'" % self._model.type)

    def type_size(self):
        return self.data_size()

    def model(self):
        return self._model

    @abstractmethod
    def render(self, mod: str):
        raise Exception("There is no render method for type '%s'" % self._model.type)


class FieldGroup:
    def __init__(self):
        self.size = 0
        self.pad = 0
        self.fields = []
        self.flat = True

    def add_field(self, name: str, field: ResolvedType):
        self.fields.append((name, field))
        self.flat = self.flat and field.is_flat()

        if self.size == None:
            return
        elif field.data_size() != None:
            self.size += field.data_size()
        else:
            self.size = None


class ResolvedBuiltin(ResolvedType):
    def __init__(self, type_def: MessgenType):
        super().__init__(type_def)
        if type_def.type_class == TypeClass.bytes:
            self._name = "[]byte"
        else:
            self._name = type_def.type.lower()

    def imported(self, caller_pkg = None):
        _ = caller_pkg
        return False

    def reference(self, caller_pkg=None):
        _ = caller_pkg
        return self._name

    def alignment(self):
        if isinstance(self._model, BasicType):
            if self._model.type_class in [TypeClass.scalar]:
                return self._model.size
            elif self._model.type_class in [TypeClass.string, TypeClass.bytes]:
                # string/byte slice is a struct wth pointer and size. Pointer
                # is always maximum, so...
                return 8
        raise Exception("Unknown builtin type class for '%s'" % self._model.type)

    def is_flat(self):
        return True

    def data_size(self):
        if isinstance(self._model, BasicType):
            if self._model.type_class in [TypeClass.scalar]:
                return self._model.size
            elif self._model.type_class in [TypeClass.string, TypeClass.bytes]:
                # string/byte slice is a struct wth pointer and size. Pointer
                # is always maximum, so...
                return None
        raise Exception("Unknown builtin type class for '%s'" % self._model.type)

    def type_size(self):
        if isinstance(self._model, BasicType):
            if self._model.type_class in [TypeClass.scalar]:
                return self._model.size
            elif self._model.type_class in [TypeClass.string]:
                return 16
            elif self._model.type_class in [TypeClass.bytes]:
                return 24
        raise Exception("Unknown builtin type class for '%s'" % self._model.type)


class ResolvedSlice(ResolvedType):
    def __init__(self, model: ArrayType | VectorType, elem_type : ResolvedType):
        super().__init__(model)
        self._element = elem_type

    def imported(self, caller_pkg = None):
        return self._element.imported(caller_pkg)

    def reference(self, caller_pkg = None):
        if isinstance(self._model, ArrayType):
            return "[%d]%s" % (self._model.array_size,  self._element.reference(caller_pkg))

        return "[]%s" % self._element.reference(caller_pkg)

    def alignment(self):
        if isinstance(self._model, ArrayType):
            return self._element.alignment()
        # Dynamic vector is a slice: struc with size and pointer
        return 8

    def is_flat(self):
        return self._element.is_flat()

    def type_size(self):
        if isinstance(self._model, ArrayType):
            return self._model.array_size * self._element.type_size()
        return 24

    def data_size(self):
        if isinstance(self._model, ArrayType) and self._element.data_size() != None:
            return self._element.data_size() * self._model.array_size
        # Dynamic vector has no static size
        return None


class ResolvedMap(ResolvedType):
    def __init__(self, type_def, key: ResolvedType, value: ResolvedType):
        super().__init__(type_def)
        self._key = key 
        self._value = value 

    def imported(self, caller_pkg = None):
        return self._key.imported(caller_pkg) or self._value.imported(caller_pkg)

    def reference(self, caller_pkg = None):
        return "map[%s]%s" % (self._key.reference(caller_pkg), self._value.reference(caller_pkg))

    def is_flat(self):
        return False

    def alignment(self):
        return 8

    def type_size(self):
        return 16

    def data_size(self):
        return None


class ResolvedEnum(ResolvedType):
    def __init__(self, type_def, base):
        super().__init__(type_def)
        self._base = base

    def alignment(self):
        return self._base.alignment()

    def data_size(self):
        return self._base.data_size()

    def is_flat(self):
        return self._base.is_flat()

    def render(self, mod: str):
        if self._package != None:
            yield f"package {self.package_name()}\n"
        else:
            yield f"package {mod.split("/")[-1]}\n"

        if self._base.imported(self._package):
            yield f"import \"{self._base.package_full()}\"\n"

        yield f"type {self.name()} {self._base.name()} \n"

        yield "const ("
        for v in self._model.values:
            yield f"\t{toGoName(v.name)} {self.name()} = {v.value}"
        yield ")"


class ResolvedStruct(ResolvedType):
    def __init__(self, type_def):
        super().__init__(type_def)
        self._fields = []
        self._imports = []
        self._size = 0
        self._alignment = 1

    def add_field(self, name: str, type: ResolvedType):
        if type.imported(self._package):
            self._imports.append(type.package_full())
        
        self._alignment = max(self._alignment, type.alignment())
        if self._size != None:
            if type.data_size() != None:
                self._size += type.data_size()
            else:
                self._size = None

        self._fields.append((toGoName(name), type))

    def is_flat(self):
        for g in self.fieldGroups():
            if g.size == None or g.pad != 0:
                return False
            for _, type in g.fields:
                if not type.is_flat():
                    return False
        return True

    def alignment(self):
        return self._alignment

    def data_size(self):
        return self._size

    def type_size(self):
        totalSize = 0
        for g in self.fieldGroups():
            for f in g.fields:
                totalSize += f[1].type_size()
            totalSize += g.pad
        return totalSize

    def renderSize(self, name:str, cur: ResolvedType, step = 0):
        if cur._model.type_class == TypeClass.string or cur._model.type_class == TypeClass.bytes:
            yield f"  result += 4 + len({name})"
        elif cur._model.type_class == TypeClass.struct:
            yield f"  result += int({name}.SerializedSize())"
        elif isinstance(cur, ResolvedBuiltin):
            yield f"  result += {cur.type_size()}"
        elif isinstance(cur, ResolvedSlice):
            # Stack element is pair of type and data variable on this level
            elem_idx  = f"i{step}"
            elem_name = f"{name}[{elem_idx}]"
            if cur._model.type_class != TypeClass.array:
                yield f" result += 4"
            if cur._element.data_size() != None and cur._element.is_flat():
                 yield f"  result += len({name})*({cur._element.type_size()})"
            else:
                yield f"for {elem_idx} := 0; {elem_idx} < len({name}); {elem_idx}++ {{"
                yield from self.renderSize(elem_name, cur._element, step+1)
                yield "}"
        elif isinstance(cur, ResolvedMap):
            yield "  result += 4"
            if cur._key._model.type_class != TypeClass.scalar and cur._value._model.type_class != TypeClass.scalar:
                yield f" for key, value := range {name} {{"
            elif cur._value._model.type_class != TypeClass.scalar:
                yield f" for _, value := range {name} {{"
            elif cur._key._model.type_class != TypeClass.scalar:
                yield f" for key, _ := range {name} {{"
            yield "// Count key "
            yield " {"
            yield from self.renderSize("key", cur._key)
            yield " }\n"
            yield "// Count value "
            yield " {"
            yield from self.renderSize("value", cur._value)
            yield " }"
            yield "  }"

    def renderSerialize(self, name: str, cur: ResolvedType, step = 0):
        if cur._model.type_class == TypeClass.string:
            yield f"  binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len({name})))"
            yield f"  tmp  := unsafe.StringData({name})"
            yield f"  buf  := unsafe.Slice(tmp, len({name}))"
            yield f"  copy(output[outputOfs+4:], buf)"
            yield f"  outputOfs += 4 + len(buf)"
        elif cur._model.type_class == TypeClass.bytes:
            yield f"  binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len({name})))"
            yield f"  tmp  := unsafe.SliceData({name})"
            yield f"  buf  := unsafe.Slice(tmp, len({name})*{cur.type_size()})"
            yield f"  copy(output[outputOfs+4:], buf)"
            yield f"  outputOfs += 4 + len({name})"
        elif cur._model.type_class == TypeClass.struct:
            yield f"  sz, err := {name}.Serialize(output[outputOfs:])"
            yield f"  if err != nil {{"
            yield f"     return uint32(outputOfs), fmt.Errorf(\"Failed to encode field '{name}'\")"
            yield f"  }}"
            yield f"  outputOfs += int(sz)"
        elif isinstance(cur, ResolvedBuiltin):
            yield f"  buf := (*[{cur.type_size()}]byte)(unsafe.Pointer(&{name}))"
            yield f"  copy(output[outputOfs:], (*buf)[0:{cur.type_size()}])"
            yield f"  outputOfs += {cur.type_size()}"
        elif isinstance(cur, ResolvedSlice):
            # Stack element is pair of type and data variable on this level
            elem_idx  = f"i{step}"
            elem_name = f"{name}[{elem_idx}]"
            if cur._model.type_class != TypeClass.array:
                yield f"  binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len({name})))"
                yield f"  outputOfs += 4"

            if cur._element.data_size() != None and cur._element.is_flat():
                 yield f"  uptr := unsafe.Pointer(unsafe.SliceData({name}[0:]))"
                 yield f"  bytes := unsafe.Slice((*byte)(uptr), len({name})*{cur._element.type_size()})"
                 yield f"  copy(output[outputOfs:], bytes)"
                 yield f"  outputOfs += len(bytes)"
            else:
                yield f"for {elem_idx} := 0; {elem_idx} < len({name}); {elem_idx}++ {{"
                yield from self.renderSerialize(elem_name, cur._element, step+1)
                yield f"}}"
        elif isinstance(cur, ResolvedMap):
            elem_idx  = f"i{step}"
            yield f"  binary.LittleEndian.PutUint32(output[outputOfs:], uint32(len({name})))"
            yield f"  outputOfs += 4"
            yield f" for key, value := range {name} {{"
            yield f" // write key"
            yield f" {{"
            yield from self.renderSerialize("key", cur._key)
            yield f" }}\n"
            yield f" // write value"
            yield f" {{"
            yield from self.renderSerialize("value", cur._value)
            yield f" }}"
            yield f" }}"

    def renderDeserialize(self, name: str, cur: ResolvedType, step = 0):
        if cur._model.type_class == TypeClass.string:
            yield f"  size := int(binary.LittleEndian.Uint32(input[inputOfs:]))"
            yield f"  tmp  := make([]byte, size)"
            yield f"  copy(tmp, input[inputOfs+4:])"
            yield f"  {name} = string(tmp)"
            yield f"  inputOfs += (4+size)"
        elif cur._model.type_class == TypeClass.bytes:
            yield f"  size := int(binary.LittleEndian.Uint32(input[inputOfs:]))"
            yield f"  {name} = make([]byte, size)"
            yield f"  copy({name}, input[inputOfs+4:])"
            yield f"  inputOfs += (4+size)"
        elif cur._model.type_class == TypeClass.struct:
            yield f"  sz, err := {name}.Deserialize(input[inputOfs:])"
            yield f"  if err != nil {{"
            yield f"     return uint32(inputOfs), fmt.Errorf(\"Failed to decode field '{name}'\")"
            yield f"  }}"
            yield f"  inputOfs += int(sz)"
        elif isinstance(cur, ResolvedBuiltin):
            yield f"  buf := (*[{cur.type_size()}]byte)(unsafe.Pointer(&{name}))"
            yield f"  copy((*buf)[0:{cur.type_size()}], input[inputOfs:])"
            yield f"  inputOfs += {cur.type_size()}"
        elif isinstance(cur, ResolvedSlice):
            # Stack element is pair of type and data variable on this level
            elem_idx  = f"i{step}"
            elem_name = f"{name}[{elem_idx}]"
            if cur._model.type_class == TypeClass.array:
                yield f"  size := len({name})"
            else:
                yield f"  size := int(binary.LittleEndian.Uint32(input[inputOfs:]))"
                yield f"  {name} = make({cur.reference(self._package)}, size)"
                yield f"  inputOfs += 4"
            if cur._element.data_size() != None and cur._element.is_flat():
                 yield f"  uptr := unsafe.Pointer(unsafe.SliceData({name}[0:]))"
                 yield f"  bytes := unsafe.Slice((*byte)(uptr), size*{cur._element.type_size()})"
                 yield f"  copy(bytes, input[inputOfs:])"
                 yield f"  inputOfs += len(bytes)"
            else:
                yield f"for {elem_idx} := 0; {elem_idx} < size; {elem_idx}++ {{"
                yield from self.renderDeserialize(elem_name, cur._element, step+1)
                yield f"}}"
        elif isinstance(cur, ResolvedMap):
            elem_idx  = f"i{step}"
            yield f"  size := int(binary.LittleEndian.Uint32(input[inputOfs:]))"
            yield f"  {name} = make({cur.reference(self._package)}, size)"
            yield f"  inputOfs += 4\n"
            yield f" var key {cur._key.reference(self._package)}"
            yield f" for {elem_idx} := 0; {elem_idx} < size; {elem_idx}++ {{"
            yield f" // read key"
            yield f" {{"
            yield from self.renderDeserialize("key", cur._key, step+1)
            yield f" }}\n"
            yield f" // read value"
            yield f" {{"
            yield f" var value {cur._value.reference(self._package)}"
            yield from self.renderDeserialize("value", cur._value, step+1)
            yield f" {name}[key] = value"
            yield f" }}"
            yield f" }}"

    def render(self, mod):
        if self._package != None:
            yield f"package {self.package_name()}\n"
        else:
            yield f"package {mod.split("/")[-1]}%s\n"

        # Overal info about type:
        # Note that totalSize is struct size in memory, not size of data in the struct
        hasFlatGroups = False
        hasNonFlatGroups = False
        hasString = False
        hasBytes = False
        for g in self.fieldGroups():
            if not hasString or not hasBytes:
                for _, f in g.fields:
                    hasBytes = hasBytes or f._model.type_class == TypeClass.string
                    hasString = hasString or f._model.type_class == TypeClass.bytes
            hasFlatGroups = hasFlatGroups or g.size != None
            hasNonFlatGroups = hasNonFlatGroups or g.size == None

        # Imports
        yield f"import ("
        yield f" \"fmt\""
        yield f" \"encoding/binary\""
        if hasFlatGroups or hasString or hasBytes:
            yield f" \"unsafe\""

        for i in self._imports:
            yield f"\"{i}\""
        yield ")\n"

        # To stop go camplaign about unused imports
        yield " var _ = fmt.Print"
        yield " var _ = binary.LittleEndian"

        ##################################################################
        # Fields
        # yield self.model().comment
        yield f"type {self._name} struct {{"
        for g in self.fieldGroups():
            yield f"\t// Group begin: {g.size} bytes"
            for f in g.fields:
                # yield f.model().comment
                yield f"\t {f[0]} {f[1].reference(self._package)}"
            yield f"\t// Group end"
            if g.pad > 0:
                yield f"\t// Padding: {g.pad} bytes\n"
        yield "}"

        ##################################################################
        # Generate size count method
        yield f"func (s *{self._name}) SerializedSize() uint32 {{"
        yield f" result := 0"
        for g in self.fieldGroups():
            names = [name for name, _ in g.fields] 
            yield f"\n// Count group {",".join(names)}"
            if g.size != None and g.flat:
                yield f" result += {g.size}"
                continue
            for name, type in g.fields:
                yield "{"
                yield from self.renderSize("s."+name, type)
                yield "}"
        yield " return uint32(result)\n}\n"
    
        ##################################################################
        # Generate write methods
        yield f"func (s *{self._name}) Serialize(output []byte) (uint32, error) {{"
        if hasFlatGroups or hasString or hasBytes:
            yield f" selfBytes := (*[{self.type_size()}]byte)(unsafe.Pointer(s))"
        if len(self._fields) > 0:
            yield "  outputOfs, selfOfs := 0, 0"
        else:
            yield "  outputOfs := 0"
        for g in self.fieldGroups():
            names = [name for name, _ in g.fields] 
            yield f"\n// Write group {",".join(names)}"
            if g.size != None and g.flat:
                yield f" {{"
                yield f"   copy(output[outputOfs:(outputOfs+{g.size})], (*selfBytes)[selfOfs:])"
                yield f"   selfOfs  += {g.size} + {g.pad}"
                yield f"   outputOfs += {g.size}\n"
                yield f" }}"
                continue
            for name, type in g.fields:
                yield f"{{"
                yield from self.renderSerialize("s."+name, type)
                yield f"}}"
                yield f"selfOfs += {type.type_size()}"
        yield " return uint32(outputOfs), nil\n}\n"

        ##################################################################
        # Generate read methods
        yield f"func (s *{self._name}) Deserialize(input []byte) (uint32, error) {{"
        if hasFlatGroups or hasString or hasBytes:
            yield f" selfBytes := (*[{self.type_size()}]byte)(unsafe.Pointer(s))"
        if len(self._fields) > 0:
            yield "  inputOfs, selfOfs := 0, 0"
        else:
            yield "  inputOfs := 0"
        for g in self.fieldGroups():
            names = [name for name, _ in g.fields] 
            yield f"\n// Read group {",".join(names)}"
            if g.size != None and g.flat:
                yield f" {{"
                yield f" copy((*selfBytes)[selfOfs:(selfOfs+{g.size})], input[inputOfs:])"
                yield f" selfOfs  += {g.size} + {g.pad}"
                yield f" inputOfs += {g.size}"
                yield f" }}"
                continue
            for name, type in g.fields:
                yield "{"
                yield from self.renderDeserialize("s."+name, type)
                yield "}"
                yield f"selfOfs += {type.type_size()}"

        yield " return uint32(inputOfs), nil\n}"

    def fieldGroups(self):
        offset = 0
        max_align = 0
        group = FieldGroup()
        for name, type in self._fields:
            data_size = type.data_size()
            align = type.alignment()
            max_align = max(max_align, align)

            # Check if there is padding before this field
            if len(group.fields) > 0 and (
                (data_size is None) or
                (group.size is None) or
                (data_size % align != 0) or
                (group.size % align != 0)):
                # Start next group
                group.pad = (align - offset % align) % align
                offset += group.pad
                yield group
                group = FieldGroup()

            group.add_field(name, type)
            offset += type.type_size()

        if len(group.fields) > 0:
            group.pad = (max_align - offset % max_align) % max_align
            yield group

def render_protocol(pkg: str, proto_name: str, proto_def: Protocol, types: dict):
    seen = set()
    yield f"package {pkg}\n"
    yield "import ("
    yield "\t\"fmt\""
    for _, msg in proto_def.messages.items():
          tp = types[msg.type]
          fp = tp.package_full()
          if fp in seen:
            continue

          yield f"\t\"{fp}\""
          seen.add(fp)
    yield ")\n"

    yield f"const {proto_name}_Id    = {proto_def.proto_id}"
    yield f"const {proto_name}_Name  = \"{proto_def.name}\""
    yield f"const {proto_name}_Hash  = {0}"
    yield f"type  {proto_name}_MsgId uint8\n"

    maxid = 0
    yield "const ("
    for id, msg in proto_def.messages.items():
        yield f"\t{proto_name}_{toGoName(msg.name)}_Id = {proto_name}_MsgId({id})"
        maxid = max(maxid, id)
    yield "\n"
    for id, msg in proto_def.messages.items():
        yield f"\t{proto_name}_{toGoName(msg.name)}_Hash = uint64({hash_message(msg)})"
    yield ")\n"

    yield f"type {proto_name}MessageHandler[T any] interface {{"
    yield f"\tHandle(msg T) error"
    yield "}\n"

    yield f"type {proto_name}Handler [{maxid+1}]any\n"
    yield f"func (th {proto_name}Handler) Setup(mid {proto_name}_MsgId, h any) error {{"
    yield "\tswitch (mid) {"
    for id, msg in proto_def.messages.items():
        tp = types[msg.type]
        yield f"\tcase {proto_name}_{toGoName(msg.name)}_Id: {{"
        yield f"\t\tif _, ok := h.({proto_name}MessageHandler[{tp.reference(pkg)}]); !ok {{"
        yield f"\t\treturn fmt.Errorf(\"Invalid handler for {proto_name}_{toGoName(msg.name)}\")"
        yield f"\t\t}}"
        yield f"\t}}\n"
    yield "\t\tdefault: {"
    yield f"\t\t\treturn fmt.Errorf(\"Unknown message id for the protocol {proto_name}: %d\", mid)"
    yield "\t\t}"
    yield "\t}"
    yield f"\tth[int(mid)] = h"
    yield f"\treturn nil"
    yield "}\n"

    yield f"func (th {proto_name}Handler) Dispatch(mid {proto_name}_MsgId, body []byte) error {{"
    yield "\tswitch (mid) {"
    for id, msg in proto_def.messages.items():
        tp = types[msg.type]
        yield f"\tcase {proto_name}_{toGoName(msg.name)}_Id: {{"
        yield f"\t\tif handler, ok := th[int(mid)].({proto_name}MessageHandler[{tp.reference(pkg)}]); ok {{"
        yield f"\t\t\tmsg := {tp.reference(pkg)}{{}}\n"
        yield f"\t\t\tsz, err := msg.Deserialize(body)"
        yield f"\t\t\tif err != nil {{"
        yield f"\t\t\t\treturn fmt.Errorf(\"Failed to read message {proto_name}_{toGoName(msg.name)}: %s\", err)"
        yield f"\t\t\t}} else if int(sz) != len(body) {{"
        yield f"\t\t\t\treturn fmt.Errorf(\"Readed size isn't valid for the message {proto_name}_{toGoName(msg.name)}: %d != %d\", sz, len(body))"
        yield f"\t\t\t}}\n"
        yield f"\t\t\terr = handler(&msg)"
        yield f"\t\t\tif err != nil {{"
        yield f"\t\t\t\t\treturn fmt.Errorf(\"Failed to handle message {proto_name}_{toGoName(msg.name)}: %s\", err)"
        yield f"\t\t\t}}"
        yield f"\t\t}} else {{"
        yield f"\t\t\treturn fmt.Errorf(\"Invalid handler for {proto_name}_{toGoName(msg.name)}\")"
        yield f"\t\t}}"
        yield f"\t}}\n"
    yield "\t\tdefault: {"
    yield f"\t\t\treturn fmt.Errorf(\"Unknown message id for the protocol {proto_name}: %d\", mid)"
    yield "\t\t}"
    yield "\t}"
    yield f"\treturn nil"
    yield "}\n"


class GolangGenerator:
    PROTO_TYPE_VAR_TYPE = "uint8"
    _EXT_HEADER = ".h"

    def __init__(self, options: dict):
        self._options: dict = options
        self._types: dict[str, MessgenType] = {}
        self._resolved: dict[str, ResolvedType] = {}

    def generate_type(self, out_dir: Path, typename: str, ident=0) -> ResolvedType:
        if typename in self._resolved:
            return self._resolved[typename]
        elif typename not in self._types:
            raise Exception("Unknown type: %s" % (typename))

        # The problem is: this type could refers another types. So first check if there are
        # dependencies and render it. Use recursion for simplicity.
        # TODO(andrphi): Detect and report cycles if any 
        resolved = None
        type_def = self._types[typename]
        gomod_name = self._options["mod_name"]

        # All types except builtin has package name
        if type_def.type_class not in [TypeClass.scalar, TypeClass.bytes, TypeClass.string]:
            type_def.type = f"{gomod_name}/{out_dir.name}/{type_def.type}"

        if type_def.type_class == TypeClass.array or type_def.type_class == TypeClass.vector:
            tmp = self.generate_type(out_dir, type_def.element_type, ident+2)
            resolved = ResolvedSlice(type_def, tmp)
        elif type_def.type_class == TypeClass.map:
            key_t = self.generate_type(out_dir, type_def.key_type, ident+2)
            val_t = self.generate_type(out_dir, type_def.value_type, ident+2)
            resolved = ResolvedMap(type_def, key_t, val_t)
        elif type_def.type_class == TypeClass.enum:
            base = self.generate_type(out_dir, type_def.base_type, ident+2)
            resolved = ResolvedEnum(type_def, base)
        elif type_def.type_class == TypeClass.struct:
            resolved = ResolvedStruct(type_def)
            for field in type_def.fields:
                fresolved = self.generate_type(out_dir, field.type, ident+2)
                resolved.add_field(field.name, fresolved)
        elif isinstance(type_def, BasicType):
            resolved = ResolvedBuiltin(type_def)
        else:
            raise Exception("Type %s is not struct/enum: %s" % (typename, type_def))

        self._resolved[typename] = resolved
        return resolved

    def generate_types(self, out_dir: Path, types: dict[str, MessgenType]) -> None:
        self._types = types

        # Outdir is package root
        # gomod_name is package prefix
        gomod_name = self._options["mod_name"]

        for type_name, _ in types.items():
            type = self.generate_type(out_dir, type_name)

            # Only struct/enum gets generated
            output = None
            if type._model.type_class in [TypeClass.struct, TypeClass.enum]:
                pkg = "/".join(type._package).removeprefix(f"{gomod_name}/{out_dir.name}")
                pkg = pkg.removeprefix("/")
                output = out_dir / pathlib.Path(pkg)
                output = output.joinpath(f"{type._name}.go")
            else:
                continue

            output.parent.mkdir(parents=True, exist_ok=True)
            with open(output, 'w') as file:
                for line in type.render(gomod_name):
                    print(line, file=file)
                file.close()

            subprocess.call(["gofmt", "-s", "-w", output], text=True)


    def generate_protocols(self, out_dir: Path, protocols: dict[str, Protocol]) -> None:
        # Golang rquires root package for files, make it proto
        pkg_name = "proto"
        out_dir = out_dir / pkg_name
        for proto_full_name, proto_def in protocols.items():
            proto_name = proto_full_name.split("/")
            proto_name = proto_name[-1]
            file_name = out_dir / f"{proto_full_name}.go"
            file_name.parent.mkdir(parents=True, exist_ok=True)
            with open(file_name, 'w') as file:
                for line in render_protocol("proto", toGoName(proto_name), proto_def, self._resolved):
                    print(line, file=file)
                file.close()
            subprocess.call(["gofmt", "-s", "-w", file_name], text=True)
