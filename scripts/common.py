import invoke
from fabric import Connection
import toml

def local_tag() -> str:
    r = invoke.run("git describe --tags", hide=True)
    tag = r.stdout.strip()
    return tag


def open_conf():
    with open("deploy.toml", "r") as f:
        ff = f.read()
        conf = toml.loads(ff)
    return conf

