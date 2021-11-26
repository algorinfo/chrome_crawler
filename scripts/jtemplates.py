import os

from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader(f"{os.getcwd()}/scripts/templates"),
    autoescape=select_autoescape()
)


def render(filename, *args, **kwargs):
    tpl = env.get_template(filename)
    return tpl.render(*args, **kwargs)


def render_to_file(template, dst, *args, **kwargs):
    text = render(template, *args, **kwargs)
    with open(dst, "w") as f:
        f.write(text)
    return text
