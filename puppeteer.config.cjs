// puppeteer.config.cjs
const { join } = require('path');

/** @type {import('puppeteer').Configuration} */
module.exports = {
  // au runtime, Puppeteer ira chercher le binaire ici
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
