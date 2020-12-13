#!/usr/bin/env node
"use strict";
// based on https://thecodebarbarian.com/building-a-cli-tool-with-node-js.html
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const Crawler = require("./crawler.js");

yargs(hideBin(process.argv)).command(
  "crawl [url]",
  "Crawl a desired url",
  (yargs) => {
    yargs.positional("url", {});
  },
  async (argv) => {
    const url = `${argv.url}`;
    //console.log(url);
    const c = await Crawler.getInstance();
    const html = await c.goto(url);
    c.close();
    console.log(html);
  }
).argv;
