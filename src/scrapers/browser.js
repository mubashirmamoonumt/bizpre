/**
 * Browser Management Module
 * Handles Puppeteer instance creation and configuration.
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

/**
 * Launch a browser instance with stealth and headless options.
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function launchBrowser() {
    const headless = process.env.HEADLESS === 'false' ? false : 'new';
    const browser = await puppeteer.launch({
        headless: headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--window-size=1920,1080', // More realistic window size
            // '--disable-gpu' // GPU needed for non-headless sometimes
        ]
    });
    return browser;
}

module.exports = { launchBrowser };
