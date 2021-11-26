import os
from dataclasses import asdict

from scripts import common
from scripts.jtemplates import render_to_file

conf = common.open_conf()

scripts_dir = f"{os.getcwd()}/scripts"
tag_release = common.local_tag()
print(tag_release)
project = f"{conf['general']['project']}"
print(project)


# services =[ asdict(service) for service in conf["deploy"]["services"]]
services = conf["deploy"]["services"]


# ds = common.DockerService(**conf["deploy"]["services"][0])
for s in services:
    if s['tag_version']:
        s['image'] = f"{s['image']}:{tag_release}"

render_to_file("docker-compose.yml.j2",
               f"{scripts_dir}/todeploy/docker-compose.yml",
               data=services
               )
