// .puppeteerrc.cjs
const { join } = require('path');

/** @type {import("puppeteer").Configuration} */
module.exports = {
  // À l’installation comme au runtime,
  // Puppeteer ira chercher Chromium dans ce dossier
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
