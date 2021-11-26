import os
import invoke
from fabric import Connection
from scripts import common

conf = common.open_conf()

BUILD_FOLDER = f"{conf['build']['folder']}/{conf['general']['project']}"
BUILD_SERVER = conf["build"]["servers"][0]


invoke.run("git push")
invoke.run("git push --tags")
c = Connection(BUILD_SERVER)
folder_present = True
try:
    c.run(f"cd {BUILD_FOLDER}", hide=True)
except invoke.exceptions.UnexpectedExit:
    folder_present = False
if not folder_present:
    c.run(f"mkdir -p {BUILD_FOLDER}", hide=True)
    c.run(f"mkdir -p {BUILD_FOLDER}", hide=True)
    c.run(f"git clone {conf['general']['repository']} {BUILD_FOLDER}", pty=True)

    

c.run(f"cd {BUILD_FOLDER} && git pull", pty=True)
c.run(f"cd {BUILD_FOLDER} && make docker && make release")
print(common.local_tag())
