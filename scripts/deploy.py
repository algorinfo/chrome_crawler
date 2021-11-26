import os
import pathlib
from getpass import getpass

from fabric import Config, Connection

from scripts import common

conf = common.open_conf()
tag_release = common.local_tag()
config = Config(overrides={'sudo': {'password': getpass()}})
SRV_FOLDER = f"/opt/services/{conf['general']['project']}"

for srv in conf["deploy"]["servers"]:

    common.render_compose(
        srv, conf["deploy"]["services"].copy(), tag_release)

    c = Connection(srv, config=config)
    c.run(f"mkdir -p {SRV_FOLDER}", hide=True)
    # c.sudo(f"chown op:algorinfo {SRV_FOLDER}", hide=True, pty=True)
    # c.sudo(f"chown op:algorinfo {SRV_FOLDER}", hide=True, pty=True)
    base_path = pathlib.Path(f"{os.getcwd()}/scripts/todeploy/{srv}")
    c.put(f"{base_path}/docker-compose.yml", f"{SRV_FOLDER}")
    c.run(f"cd {SRV_FOLDER} && docker-compose stop && docker-compose rm")
    c.run(f"cd {SRV_FOLDER} && docker-compose up -d")
