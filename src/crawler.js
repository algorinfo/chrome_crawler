const puppeteer = require("puppeteer");
const WAE = require("web-auto-extractor").default;

class PrivateCrawler {
  constructor(browser) {
    this.browser = browser;
  }

  static async build() {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    return new PrivateCrawler(browser);
  }

  extractTags(html) {
    var parsed = WAE().parse(html);
    return parsed;
  }

  async goto(url) {
    const page = await this.browser.newPage();
    page.setViewport({ width: 1280, height: 926 });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image") request.abort();
      else request.continue();
    });
    const httpResponse = await page.goto(url, { waitUntil: "load" });
    const html = await page.content();
    const response = {
      content: html,
      metrics: await page.metrics(),
      headers: httpResponse.headers(),
      status: httpResponse.status(),
      title: await page.title(),
      metadata: this.extractTags(html),
    };
    await page.close();
    //console.log(response);
    return response;
  }
  close() {
    this.browser.close();
  }
}

class Crawler {
  constructor() {
    throw new Error("Use Crawler.getInstance()");
  }

  static async getInstance() {
    if (!Crawler.instance) {
      Crawler.instance = await PrivateCrawler.build();
    }
    return Crawler.instance;
  }
}

module.exports = Crawler;
