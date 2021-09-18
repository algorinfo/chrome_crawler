import json
import sys

from image import write_file


def open_file(f):
    with open(f, 'r') as fil:
        data = fil.read()

    return json.loads(data)


if __name__ == "__main__":
    orig = sys.argv[1]
    dest = sys.argv[2]
    img = open_file(orig)['screenshot']
    write_file(img, dest)
    print(f'I wrote the file to {dest}')
