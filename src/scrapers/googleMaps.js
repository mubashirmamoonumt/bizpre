/**
 * Google Maps Scraper
 * Verification Only. Fetches Website/Phone/Address.
 */

const { normalizeText } = require('../lib/fingerprint');
// Helper: Random delay
const delay = (min, max) => new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/**
 * Scrape Google Maps.
 * @param {import('puppeteer').Page} page 
 * @param {object} business 
 * @returns {Promise<object|null>}
 */
async function scrapeGoogleMaps(page, business) {
    try {
        // Strategy: Search by Name + City (Verification)
        // We strictly use this to find the business entity and its metadata.
        // We DO NOT use this to prompt social profiles (Maps doesn't usually show them anyway).

        let query = `${business.business_name} ${business.city}`;
        if (business.address) query = `${business.business_name} ${business.address}`;

        console.log(`[GoogleMaps] Verifying: ${query}`);
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, { waitUntil: 'networkidle2' });

        await delay(2000, 4000);

        // Check if we Landed on a Result (H1 present)
        try {
            await page.waitForSelector('h1', { timeout: 6000 });
        } catch (e) {
            // Might be a list or no result
            console.log('[GoogleMaps] No direct result found, skipping verification.');
            return { platform: 'Google Maps', found: false };
        }

        const title = await page.$eval('h1', el => el.textContent.trim()).catch(() => null);

        if (title) {
            // Extract basic details for verification
            const ratingText = await page.evaluate(() => {
                const span = Array.from(document.querySelectorAll('span')).find(s => s.getAttribute('aria-label') && s.getAttribute('aria-label').includes('stars'));
                return span ? span.getAttribute('aria-label') : null;
            });

            const reviewsText = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const reviewBtn = buttons.find(b => b.textContent.includes('reviews'));
                return reviewBtn ? reviewBtn.textContent : null;
            });

            // Extract Website - CRITICAL for discovery
            const website = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                const external = anchors.find(a => a.href && !a.href.includes('google.com') && !a.href.startsWith('javascript') && !a.href.startsWith('tel:') && !a.href.startsWith('mailto:'));
                return external ? external.href : null;
            });

            const address = await page.evaluate(() => {
                const button = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('data-item-id') === 'address');
                return button ? button.textContent : null;
            });

            const phone = await page.evaluate(() => {
                const button = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('data-item-id') && b.getAttribute('data-item-id').includes('phone'));
                return button ? button.textContent : null;
            });

            return {
                platform: 'Google Maps',
                url: page.url(),
                name: title,
                rating: ratingText ? parseFloat(ratingText) : null,
                reviews: reviewsText ? parseInt(reviewsText.replace(/\D/g, '')) : 0,
                website: website,
                address: address,
                phone: phone,
                found: true
            };
        }

        return { platform: 'Google Maps', found: false };

    } catch (error) {
        console.error('[GoogleMaps] Error:', error);
        return { platform: 'Google Maps', error: error.message };
    }
}

module.exports = { scrapeGoogleMaps };
