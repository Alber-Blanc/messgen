import os
import re

def camel_to_snake(name):
    """Convert CamelCase or PascalCase to snake_case."""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    changed = False
    new_lines = []

    for line in lines:
        def replace_type(match):
            original_type = match.group(1)
            snake_type = camel_to_snake(original_type)
            if original_type != snake_type:
                nonlocal changed
                changed = True
            return f'type: {snake_type}'

        new_line = re.sub(r'"?type"?:\s*"?([A-Za-z0-9_]+)"?"', replace_type, line)
        new_lines.append(new_line)

    if changed:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f"Updated: {filepath}")

def process_directory(directory):
    for filename in os.listdir(directory):
        full_path = os.path.join(directory, filename)
        if os.path.isfile(full_path):
            process_file(full_path)

# Run on current directory
process_directory("./manet")
