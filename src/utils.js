const fs = require('fs');
const util = require('util');

// Convert fs.readFile into Promise version of same    
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const sleep = ms => new Promise(r => setTimeout(r, ms));


module.exports = {readFileAsync, writeFileAsync, sleep}

