import os
import re
import sys

def replace_first_id_line(directory):
    for root, _, files in os.walk(directory):
        for filename in files:
            if not filename.endswith(".yaml"):
                continue

            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as file:
                lines = file.readlines()

            # Check and replace only the first line if it matches
            if lines and re.match(r'^\s*id:\s*\d+\s*$', lines[0]):
                lines[0] = "type_class: struct\n"
                with open(filepath, 'w') as file:
                    file.writelines(lines)
                print(f"Modified first line in: {filepath}")

if len(sys.argv) != 2:
    print("Directory with yaml messages is not specified")
    sys.exit(-1)

dir = sys.argv[1]
replace_first_id_line(dir)