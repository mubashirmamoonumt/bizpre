/**
 * Verify Website Scraper
 * Tests if the scanner visits the provided website and finds social links.
 */

const { scanBusiness } = require('../src/scrapers/index');

async function test() {
    // Use a business with a known website that has social links.
    // Example: OpenAI (has twitter/youtube/linkedin usually) or something simpler.
    // Using a real website might be flaky if they change, but let's try a stable one or a mock one?
    // Let's try to scan a business provided WITH a website.

    const business = {
        business_name: 'OpenAI',
        website: 'https://openai.com', // Expected to have some social links
        phone: '',
        city: 'San Francisco',
        country: 'USA'
    };

    console.log('Testing website scrape for:', business.website);

    try {
        const results = await scanBusiness(business);
        console.log('Scan Results (summary):');
        results.forEach(r => {
            if (r.found) {
                console.log(`- Found ${r.platform}: ${r.url} (Score: ${r.match_score})`);
            }
        });

        // Check if we found any social links via website (score 100)
        const foundViaWebsite = results.some(r => r.match_score === 100 && r.platform !== 'Google Maps');
        if (foundViaWebsite) {
            console.log('SUCCESS: Found social links via website!');
        } else {
            console.log('WARNING: Did not find social links via website (or website has none).');
        }

    } catch (error) {
        console.error('FAILED:', error);
    }
}

test();
