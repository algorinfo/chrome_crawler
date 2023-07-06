import os
from dataclasses import asdict
import base64
import httpx
from tests.shared import CrawlTask

SERVICE_URL = "http://localhost:3000"
HEADERS = {
    "Authorization": f"Bearer {os.environ['TOKEN']}"
}
GOOGLE = CrawlTask(
    url="https://google.com",
    screenshot=True
)


def save_image(fp, encoded):
    base = base64.b64decode(encoded)
    with open(fp, "wb") as f:
        f.write(base)

def crawl_task(task: CrawlTask):
    data = asdict(task)
    print(data)
    r = httpx.post(f"{SERVICE_URL}/v4/chrome", json=data, headers=HEADERS, timeout=120)
    return r

def test_crawl_task():
    data = asdict(GOOGLE)
    r = httpx.post(f"{SERVICE_URL}/v4/chrome", json=data, headers=HEADERS, timeout=120)
    assert r.status_code == 200




