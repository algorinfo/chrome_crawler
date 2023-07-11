#!/usr/bin/env node
"use strict";
// based on https://thecodebarbarian.com/building-a-cli-tool-with-node-js.html
// and https://alanstorm.com/yargs-and-command-line-argument-processing-in-nodejs/
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
const {crawlPage, parseCrawlPage} = require("./browser.js")
const {crawlDuckGo, setDuckGoRegionCookies, parseDuckGo} = require("./duckduckgo.js")
const {crawlGoogle, parseGoogle} = require("./google.js")
var jwt = require('jsonwebtoken');
var privateKey = fs.readFileSync('.secrets/private.key');
const minutes = 60 * 1000
function generateToken(argv){
  const usr = `${argv.usr}`
  var token = jwt.sign({ usr: usr, iat: Date.now() + (60000 * (60 * 24))}, privateKey, { algorithm: 'ES512'});
  console.log(token)
};


async function crawlPageCMD(argv) {
  const task = await parseCrawlPage({url: argv.url});
  const rsp = await crawlPage(task)
  if (argv.html ) {
    // await writeFileAsync(`pages/${url}.html`)
	  console.log(rsp.content);
  } else {
    console.log(JSON.stringify(rsp));
	}
}

async function crawlDuckGoCMD(argv) {
  const task = await parseDuckGo({text: argv.text});
  const rsp = await crawlDuckGo(task)
  if (argv.html ) {
    // await writeFileAsync(`pages/${url}.html`)
	  console.log(rsp.content);
  } else {
    console.log(JSON.stringify(rsp));
	}
}

async function crawlGoogleCMD(argv) {
  const task = await parseGoogle({text: argv.text});
  task.cookieId = argv.cookie
  task.browser.headless = argv.headless
  const rsp = await crawlGoogle(task)
  if (argv.html ) {
    // await writeFileAsync(`pages/${url}.html`)
	  console.log(rsp.content);
  } else {
    console.log(JSON.stringify(rsp));
	}
}

// yargs(hideBin(process.argv)).command(
//   "crawl [url]",
//   "Crawl a desired url",
//   (yargs) => {
//     yargs.positional("url", { describe: "url to crawl" });
//     yargs.option("html", {
//       describe: "save as html",
//       default: false,
//     });
//   },
//   crawlPage
// ).argv;
// 

/*yargs(hideBin(process.argv)).command(
  "jwt [usr]",
  "Generate a jwt token",
  (yargs) => {
    yargs.positional("usr", { describe: "user to encode" });
  },
  generateToken
).argv;*/

yargs(hideBin(process.argv)).command(
  "jwt [usr]",
  "Generate a jwt token",
  (yargs) => {
    yargs.positional("usr", { describe: "user to encode" });
  },
  generateToken
).command(
  "duckgo-settings [region]",
  "Set region for duckduckgo",
  (yargs) => {
    yargs.positional("region", { describe: "region: ar-es" });
  },
  function(argv) {
    setDuckGoRegionCookies(argv.region).then(
      () => console.log("Finish")
    )
  }
).command(
  "crawl-page [url]",
  "crawl a page",
  (yargs) => {
    yargs.positional("url", {describe: "url to be crawled"});
    yargs.option("html", {
      describe: "only shows html, default=false",
      default: false,
  })
},
  function(argv){
    crawlPageCMD(argv).then()
  }
).command(
  "duckgo [text]",
  "crawl a search result from duckduckgo",
  (yargs) => {
    yargs.positional("text", {describe: "text to search"});
    yargs.option("html", {
      describe: "only shows html, default=false",
      default: false,
  })
},
  function(argv){
    crawlDuckGoCMD(argv).then()
  }
).command(
  "google [text]",
  "crawl a search result from google",
  (yargs) => {
    yargs.positional("text", {describe: "text to search"});
    yargs.option("html", {
      describe: "only shows html, default=false",
      default: false,
  })
   yargs.option("cookie", {
      describe: "cookie id to be used, default=default",
      default: "default",
  })
  yargs.option("headless", {
      describe: "headless, default=true",
      default: true,
  })
},
  function(argv){
    crawlGoogleCMD(argv).then()
  }
)
.argv;