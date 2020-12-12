const puppeteer = require("puppeteer");

(async () => {
  const url = "https://www.youtube.com/results?search_query=aborto";
  const browser = await puppeteer.launch();
  // use tor
  //const browser = await puppeteer.launch({args:['--proxy-server=socks5://127.0.0.1:9050']});
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.resourceType() === "image") request.abort();
    else request.continue();
  });
  await page.goto(url, { waitUntil: "load" });

  //const title = await page.title();
  //console.log(title);
  await page.screenshot({ path: "example.png" });
  const html = await page.content();
  console.log(html);

  browser.close();
})();
