/**
 * Google Search Scraper
 * Strict mode: Phone-based site searches.
 */

// Helper: Random delay
const delay = (min, max) => new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/**
 * Perform a Google Search and return results.
 * @param {import('puppeteer').Page} page 
 * @param {string} query 
 * @returns {Promise<Array<{title: string, link: string, snippet: string}>>}
 */
async function searchGoogle(page, query) {
    try {
        console.log(`[GoogleSearch] Strict Query: ${query}`);

        await delay(1500, 3500); // Increased think time

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`, { waitUntil: 'networkidle2' });

        // Cookie consent
        try {
            const consentBtn = await page.$('button[aria-label="Accept all"]');
            if (consentBtn) {
                await delay(500, 1500);
                await consentBtn.click();
            }
        } catch (e) { }

        // Humanize
        await page.evaluate(async () => {
            window.scrollBy(0, 150);
            await new Promise(r => setTimeout(r, 700));
            window.scrollBy(0, 200);
        });

        await delay(1000, 2500);

        // Extract results
        return await page.evaluate(() => {
            const results = [];
            const blocks = document.querySelectorAll('.g');

            blocks.forEach(block => {
                const titleEl = block.querySelector('h3');
                const linkEl = block.querySelector('a');
                const snippetEl = block.querySelector('.VwiC3b'); // generic snippet class

                if (titleEl && linkEl) {
                    results.push({
                        title: titleEl.textContent,
                        link: linkEl.href,
                        snippet: snippetEl ? snippetEl.textContent : ''
                    });
                }
            });
            return results;
        });
    } catch (error) {
        console.error(`[GoogleSearch] Error searching ${query}:`, error);
        return [];
    }
}

module.exports = { searchGoogle };
