import os
import pathlib
from dataclasses import dataclass
from typing import List, Optional, Union

import invoke
import toml
from fabric import Connection

from scripts.jtemplates import render_to_file


@dataclass
class DockerService:
    image: str
    command: Optional[str] = None
    tag_version: Optional[bool] = False
    restart: str = "unless-stopped"
    volumes: Optional[List[str]] = None
    network_mode: Optional[bool] = None
    ports: Optional[List[str]] = None


def local_tag() -> str:
    r = invoke.run("git describe --tags", hide=True)
    tag = r.stdout.strip()
    return tag


def open_conf():
    with open("deploy.toml", "r") as f:
        ff = f.read()
        conf = toml.loads(ff)
    return conf


def render_compose(srv, services, tag_release):
    for s in services:
        if s['tag_version']:
            s['image'] = f"{s['image']}:{tag_release}"
        s['restart'] = s.get("restart", "unless-stopped")
        for ix, x in enumerate(s['ports']):
            s['ports'][ix] = f"{srv}:{s['ports'][ix]}"
            
    base_path = pathlib.Path(f"{os.getcwd()}/scripts/todeploy/{srv}")
    base_path.mkdir(parents=True, exist_ok=True)
    render_to_file(
        "docker-compose.yml.j2", f"{base_path}/docker-compose.yml",
        data=services)
