import os
from dataclasses import asdict
import base64
import httpx
from tests.shared import CrawlPage, SearchDuck
import json

SERVICE_URL = "http://localhost:3000"
HEADERS = {
    "Authorization": f"Bearer {os.environ['TOKEN']}"
}
CHROME = CrawlPage(
    url="https://algorinfo.com",
    screenshot=True
)
AXIOS = CrawlPage(
    url="http://httpbin.org/get",
)
# G_SEARCH = SearchGoogle(
#     text="site:instagram.com memes gatos",
# )
DUCK_SEARCH = SearchDuck(
    text="site:instagram.com memes gatos",
)


def save_image(fp, encoded):
    base = base64.b64decode(encoded)
    with open(fp, "wb") as f:
        f.write(base)

# def crawl_task(task: CrawlPage):
#     data = asdict(task)
#     print(data)
#     r = httpx.post(f"{SERVICE_URL}/v4/chrome", json=data, headers=HEADERS, timeout=120)
#     return r

def test_crawl_chrome():
    data = asdict(CHROME)
    r = httpx.post(f"{SERVICE_URL}/v5/chrome", json=data, headers=HEADERS, timeout=120)
    jdata = json.loads(r.content) 
    assert r.status_code == 200
    assert "Information" in jdata["content"]

# def test_crawl_search_google():
#     data = asdict(G_SEARCH)
#     r = httpx.post(f"{SERVICE_URL}/v4/google-search", json=data, headers=HEADERS, timeout=120)
#     data = r.json()
#     assert r.status_code == 200
#     assert len(data["links"]) > 0


def test_crawl_axios():
    data = asdict(AXIOS)
    r = httpx.post(f"{SERVICE_URL}/v5/axios", json=data, headers=HEADERS, timeout=120)
    data = r.json()
    jdata = json.loads(r.content) 
    assert "Mozilla" in jdata["content"]["headers"]["User-Agent"]
    assert r.status_code == 200   
    assert r.status_code == 200
    

def test_crawl_search_duck():
    data = asdict(DUCK_SEARCH)
    r = httpx.post(f"{SERVICE_URL}/v5/duckduckgo", json=data, headers=HEADERS, timeout=120)
    data = r.json()
    assert r.status_code == 200
    assert len(data["links"]) > 0




