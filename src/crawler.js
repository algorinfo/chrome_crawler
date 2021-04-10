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

  async screenshot(url, ts, viewPort){
    const context = await this.browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const response = {};
    page.setViewport(viewPort);
    const options = { waitUntil: "load", timeout: ts * 1000 };
    try{
      const httpResponse = await page.goto(url, options);
      response["screenshot"] = await page.screenshot({ encoding: "base64"});
      response["status"] = httpResponse.status;
      response["headers"] = httpResponse.headers;
    } catch(e){
      console.log("Error with " + url + " " + e);
      response["error"] = e;
    }
      

  }
  async goto(url, options) {
    // https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-class-browsercontext
    const context = await this.browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const response = {};

    page.setViewport(options.viewPort);

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image") request.abort();
      else request.continue();
    });

    try {
      const httpResponse = await page.goto(url,
                                           { waitUntil: "load",
                                             timeout: options.timeout * 1000 });
      const html = await page.content();
      if (options.screenshot === true){
        response["screenshot"] = await page.screenshot({ encoding: "base64"});
      }
      response["content"] = html;
      response["metrics"] = await page.metrics();
      response["headers"] = httpResponse.headers();
      response["status"] = httpResponse.status();
      response["title"] = await page.title();
      response["metadata"] = this.extractTags(html);
      
    } catch(e){
      console.log("Error with " + url + e);
      response["error"] = e;
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
