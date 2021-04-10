import base64
import json
import sys
from urllib.request import urlopen

_CHROME = "http://localhost:3000"


def get_json(url) -> dict:
    with urlopen(url) as conn:
        response = conn.read()

    data = json.loads(response)
    return data


def write_file(str64, fname):
    encoded = base64.urlsafe_b64decode(str64.encode('UTF-8'))
    with open(fname, 'wb') as f:
        f.write(encoded)


if __name__ == "__main__":
    uurl = sys.argv[1]
    name = sys.argv[2]
    fullurl = f'{_CHROME}/v2/image?url={uurl}'
    print(f"Downloading... {fullurl}")
    data = get_json(fullurl)
    write_file(data['image'], name)
    print(f'I wrote {name}')
