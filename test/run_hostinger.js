/**
 * Run Hostinger Scan
 * Scans 'Hostinger' to verify website scraping.
 */

const { scanBusiness } = require('../src/scrapers/index');
const { generateInsights } = require('../src/lib/insights');

async function run() {
    const business = {
        business_name: 'Hostinger',
        website: 'https://www.hostinger.com/',
        phone: '', // Optional
        address: '',
        city: '', // Global
        country: ''
    };

    console.log('Starting scan for:', business);

    try {
        const results = await scanBusiness(business);
        console.log('Scan Results:', JSON.stringify(results, null, 2));

        const insights = generateInsights(results, business);
        console.log('Insights:', JSON.stringify(insights, null, 2));

        // Summary for user
        console.log('\n--- Found Platforms ---');
        results.filter(r => r.found).forEach(r => {
            console.log(`[${r.platform}] ${r.url} (Score: ${r.match_score})`);
        });

    } catch (error) {
        console.error('FAILED:', error);
    }
}

run();
