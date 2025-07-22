import os
import re
import sys

def extract_id_from_file(filepath):
    """Extracts the ID from a line like 'id: 123'"""
    with open(filepath, 'r') as f:
        for line in f:
            match = re.match(r'id:\s*(\d+)', line.strip())
            if match:
                return int(match.group(1))
    return None

def generate_proto_mapping(directory, output_file, proto_id):
    messages = {}
    files_needing_ids = []

    for filename in os.listdir(directory):
        if not filename.endswith(".yaml"):
            continue  # Only process specific file types
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            id_number = extract_id_from_file(filepath)
            name = os.path.splitext(filename)[0]
            if id_number is not None:
                messages[id_number] = {
                    "name": f"{name}_msg",
                    "type": name
                }
            else:
                files_needing_ids.append(name)

    # Assign free IDs from 1 to 255
    used_ids = set(messages.keys())
    available_ids = (i for i in range(1, 256) if i not in used_ids)

    for name in files_needing_ids:
        try:
            new_id = next(available_ids)
        except StopIteration:
            raise ValueError("No free IDs available in range 1-255.")
        messages[new_id] = {
            "name": f"{name}_msg",
            "type": name
        }

    # Write output
    with open(f"{output_file}", "w") as out:
        out.write(f"proto_id: {proto_id}\n")
        out.write("messages:\n")
        for id_num in sorted(messages):
            msg = messages[id_num]
            out.write(f"  {id_num}: {{name: \"{msg['name']}\", type: \"{msg['type']}\"}}\n")

    print(f"{output_file} created successfully.")


if len(sys.argv) != 3:
    print("Directory with yaml messages or output protocol file or proto_id is not specified")
    sys.exit(-1)

dir = sys.argv[1]
file = sys.argv[2]
proto_id = sys.argv[3]
generate_proto_mapping(dir, file, proto_id)
