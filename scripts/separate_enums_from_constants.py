import os
import re
import sys


def camel_to_snake(name):
    """Convert CamelCase to snake_case"""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()

def process_file(filepath):
    with open(filepath, 'r') as file:
        lines = file.readlines()

    current_file = None
    current_writer = None
    directory = os.path.dirname(filepath)

    name_pattern = re.compile(r'-\s*name:\s*([A-Za-z0-9]+)')

    for line in lines:
        match = name_pattern.match(line)
        if match:
            # Start a new file
            name = match.group(1)
            snake_case_name = camel_to_snake(name)
            filename = os.path.join(directory, f"{snake_case_name}.yaml")
            if current_writer:
                current_writer.close()
            current_file = filename
            current_writer = open(current_file, 'w')
            print(f"Writing to {current_file}")
            current_writer.write("type_class: enum\n")
            continue
        if current_writer:
            line = line.replace("basetype", "base_type")
            line = line.replace("fields", "values")
            if line.startswith("  "):
                line = line[2:]
            current_writer.write(line)

    if current_writer:
        current_writer.close()


if len(sys.argv) != 2:
    print("Filepath with constants is not specified")
    sys.exit(-1)

path = sys.argv[1]
process_file(path)
