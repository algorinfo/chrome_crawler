#!/usr/bin/env node
"use strict";
// based on https://thecodebarbarian.com/building-a-cli-tool-with-node-js.html
// and https://alanstorm.com/yargs-and-command-line-argument-processing-in-nodejs/
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const Crawler = require("./crawler.js");
const fs = require("fs");
var jwt = require('jsonwebtoken');
var privateKey = fs.readFileSync('.secrets/private.key');
const minutes = 60 * 1000
function generateToken(argv){
  const usr = `${argv.usr}`
  var token = jwt.sign({ usr: usr, iat: Date.now() + (60000 * (60 * 24))}, privateKey, { algorithm: 'ES512'});
  console.log(token)
};


async function crawlPage(argv) {
  const url = `${argv.url}`;
  //console.log(url);
  const c = await Crawler.getInstance();
  const response = await c.goto(url);
  c.close();
  if (argv.json ) {
    console.log(JSON.stringify(response));
  } else {
	  console.log(response.content);
	}
}

// yargs(hideBin(process.argv)).command(
//   "crawl [url]",
//   "Crawl a desired url",
//   (yargs) => {
//     yargs.positional("url", { describe: "url to crawl" });
//     yargs.option("json", {
//       describe: "print json format",
//       default: false,
//     });
//   },
//   crawlPage
// ).argv;
// 

yargs(hideBin(process.argv)).command(
  "jwt [usr]",
  "Generate a jwt token",
  (yargs) => {
    yargs.positional("usr", { describe: "user to encode" });
  },
  generateToken
).argv;