import subprocess
import sys
import os
import re

def get_proto_id(filename):
    with open(filename, 'r') as f:
        for line in f:
            match = re.match(r'proto_id:\s*(\d+)', line.strip())
            if match:
                return int(match.group(1))
    raise ValueError(f"No proto_id in file {filename}")


def run_scripts(directory, proto_id = None):

    constants_filepath = os.path.join(directory, "_constants.yaml")
    parent_dir = os.path.dirname(directory)
    base_dir = os.path.basename(directory)
    output_proto_file = f"protocol_{base_dir}.yaml"
    output_proto_filepath = os.path.join(parent_dir, output_proto_file)
    old_proto_filepath = os.path.join(directory, "_protocol.yaml")

    if proto_id is None:
        proto_id = get_proto_id(old_proto_filepath)

    scripts = [
        ["python3", "scripts/camel_to_snake.py", directory],
        ["python3", "scripts/separate_enums_from_constants.py", constants_filepath],
        ["python3", "scripts/proto_gen.py", directory, output_proto_filepath, proto_id]
        ["python3", "scripts/filter_yaml.py", directory, output_proto_filepath]
    ]

    for cmd in scripts:
        print(f"Running: {' '.join(cmd)}")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"Error: {cmd[1]} exited with code {result.returncode}")
            break

    try:
        os.remove(old_proto_filepath)
        print("Removed", old_proto_filepath)
    except FileNotFoundError:
        pass

    try:
        os.remove(constants_filepath)
        print("Removed", old_proto_filepath)
    except FileNotFoundError:
        pass

if __name__ == "__main__":
    if len(sys.argv) != 1:
        print("Directory with yaml messages is not specified")
        sys.exit(-1)

    dir = sys.argv[1]
    run_scripts(dir)