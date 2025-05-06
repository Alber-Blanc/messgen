import os
import re

def get_enum_type_filenames(directory):
    enum_filenames = set()
    for filename in os.listdir(directory):
        if not filename.endswith(".yaml"):
            continue
        with open(os.path.join(directory, filename), "r") as f:
            first_line = f.readline().strip()
            if first_line.startswith("type_class: enum"):
                enum_filenames.add(os.path.splitext(filename)[0])
    return enum_filenames

def filter_msg_definitions(filepath, enum_filenames):
    with open(filepath, "r") as f:
        lines = f.readlines()

    filtered_lines = []
    pattern = re.compile(r'name:\s*"(\w+)_msg",\s*type:\s*"(\w+)"')

    for line in lines:
        match = pattern.search(line)
        if match:
            name, type_ = match.groups()
            if type_ in enum_filenames:
                continue  # skip this line
        filtered_lines.append(line)

    with open(filepath, "w") as f:
        f.writelines(filtered_lines)

if __name__ == "__main__":
    directory = "./web"  # current directory
    target_file = "../contracts/web-protocol/microavia/protocol.yaml"  # change this to the actual filename you want to clean

    enum_files = get_enum_type_filenames(directory)
    filter_msg_definitions(target_file, enum_files)

    print(f"Cleaned {target_file} from enum-based message entries.")
