/**
 * Verify Stealth Mode
 * Checks if the browser passes basic bot detection (headless check).
 */

const { launchBrowser } = require('../src/scrapers/browser');

async function test() {
    console.log('Launching browser in headless stealth mode...');
    const browser = await launchBrowser();

    try {
        const page = await browser.newPage();
        // Test usually involves visiting a bot check site, but let's just visit Google and see if we get a CAPTCHA immediately or if it loads cleanly.
        console.log('Visiting Google to check for immediate CAPTCHA...');
        await page.goto('https://www.google.com/search?q=test', { waitUntil: 'networkidle2' });

        const content = await page.content();
        if (content.includes('recaptcha') || content.includes('unusual traffic')) {
            console.log('FAILED: Detected CAPTCHA or traffic block.');
        } else {
            console.log('SUCCESS: Google Search page loaded without immediate block.');
            const title = await page.title();
            console.log('Page Title:', title);
        }

        // Check automation flags
        const webdriver = await page.evaluate(() => navigator.webdriver);
        console.log('navigator.webdriver:', webdriver); // Should be false or undefined in stealth

        if (!webdriver) {
            console.log('SUCCESS: navigator.webdriver is hidden.');
        } else {
            console.log('WARNING: navigator.webdriver is true.');
        }

    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await browser.close();
    }
}

test();
