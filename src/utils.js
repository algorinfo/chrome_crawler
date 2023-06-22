const fs = require('fs');
const util = require('util');

// Convert fs.readFile into Promise version of same    
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);


module.exports = {readFileAsync, writeFileAsync}

