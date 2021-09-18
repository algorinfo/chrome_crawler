const puppeteer = require("puppeteer");
const WAE = require("web-auto-extractor").default;


const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    // let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    // console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      // console.log("Page rendered fully..");
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }  
};

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
          var distance = 100;
          console.log("Scrolling");
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

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

    let httpResponse;
    try {
      httpResponse = await page.goto(url, { waitUntil: "load",
                                            timeout: options.timeout * 1000 });
    } catch(e){
      // console.log("Error with " + url + e);
      response["error"] = e;
      return response;
    }

    try {
      // await page.waitForNavigation({timeout: 6 * 1000 });
      await page.$('body');
      await waitTillHTMLRendered(page);
    } catch (e) {
        console.log(e)
    }

      // await page.waitForNavigation();
      // await waitTillHTMLRendered(page);
    if (options.autoScroll !== false){
        // await page.$('body');
        // const elem = await page.$('body');
        // await waitTillHTMLRendered(page);
        // page.evaluate()
        await autoScroll(page);
      }
      const html = await page.content();
      
      if (options.screenshot !== false){
        // await page.waitForNavigation();
        // await waitTillHTMLRendered(page);
        // await page.$('body');
        response["screenshot"] = await page.screenshot({ encoding: "base64",
                                                         fullpage: true });
      }
      response["content"] = html;
      response["metrics"] = await page.metrics();
      response["headers"] = httpResponse.headers();
      response["status"] = httpResponse.status();
      response["title"] = await page.title();
      // response["metadata"] = this.extractTags(html);
      
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
