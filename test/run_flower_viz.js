/**
 * Run Visible Scan
 * Scans 'The Flower Bazaar' in non-headless mode.
 */

const { scanBusiness } = require('../src/scrapers/index');
const { generateInsights } = require('../src/lib/insights');

async function run() {
    const business = {
        business_name: 'The Flower Bazaar',
        phone: '+13056043433',
        address: '', // Optional, not provided
        city: 'Miami',
        country: 'USA'
    };

    console.log('Starting visual scan for:', business);

    try {
        const results = await scanBusiness(business);
        console.log('Scan Results:', JSON.stringify(results, null, 2));

        const insights = generateInsights(results, business);
        console.log('Insights:', JSON.stringify(insights, null, 2));

    } catch (error) {
        console.error('FAILED:', error);
    }
}

run();
