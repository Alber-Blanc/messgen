from json_generator import JsonGenerator
from cpp_generator import CppGenerator
from ts_generator import TypeScriptGenerator
from golang_generator import GolangGenerator


def get_generator(lang: str, options):
    if lang == "json":
        return JsonGenerator(options)
    elif lang == "cpp":
        return CppGenerator(options)
    elif lang == "ts":
        return TypeScriptGenerator(options)
    elif lang == "golang":
        return GolangGenerator(options)
