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

  async goto(url, ts) {
    // https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-class-browsercontext
    const context = await this.browser.createIncognitoBrowserContext();
    const page = await context.newPage();

    page.setViewport({ width: 1280, height: 926 });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image") request.abort();
      else request.continue();
    });
    let response = {};
    try {
    const httpResponse = await page.goto(url, { waitUntil: "load", timeout: ts * 1000 });
    const html = await page.content();
    response = {
      content: html,
      metrics: await page.metrics(),
      headers: httpResponse.headers(),
      status: httpResponse.status(),
      title: await page.title(),
      metadata: this.extractTags(html),
    };
    } catch(e){
      console.log("Error with " + url + e);
      response = null;
    }
    await context.close();
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
