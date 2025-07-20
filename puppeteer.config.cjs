const { join } = require('path');

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  // Puppet-teer téléchargera Chromium dans ./ .cache/puppeteer
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
