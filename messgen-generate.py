import argparse
import os

from messgen import generator, yaml_parser, validation
from pathlib import Path


def generate(args: argparse.Namespace):
    if not args.protocol and not args.types:
        raise RuntimeError("No types or protocols to generate (--types or --protocols)")

    if args.types:
        types = yaml_parser.parse_types(args.types)
    else:
        types = None

    if args.protocol:
        protocols = yaml_parser.parse_protocols(args.protocol)
        # Perform deep validation if both protocol and types provided
        if types is not None:
            for proto in protocols.values():
                validation.validate_protocol_types(proto, types)
                print("Types validated for protocol: %s" % proto.name)
    else:
        protocols = None

    if args.lang is None:
        print("Schema validated successfully")
    else:
        if not args.outdir:
            raise RuntimeError("--outdir is required for generation")

        opts = {}
        for a in args.options.split(","):
            p = a.split("=")
            if len(p) == 2:
                opts[p[0]] = p[1]

        if (gen := generator.get_generator(args.lang, opts)) is not None:
            if protocols is not None:
                gen.generate_protocols(Path(args.outdir), types, protocols)
            elif types is not None:
                gen.generate_types(Path(args.outdir), types)
        else:
            raise RuntimeError('Unsupported language "%s"' % args.lang)

        print("Successfully generated to %s" % args.outdir)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--types", action="append", help="Type directory to load, may repeat")
    parser.add_argument("--protocol", action="append",
                        help="Protocol to load in format /path/of/basedir:namespace/of/proto, may repeat")
    parser.add_argument("--lang", required=False, help="Output language, if not specified just validate schema")
    parser.add_argument("--outdir", required=False, help="Output directory")
    parser.add_argument("--options", default="", help="Generator options")
    generate(parser.parse_args())


if __name__ == "__main__":
    main()
