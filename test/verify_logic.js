/**
 * Verification Script
 * Tests the core scanning logic without Queue/Redis.
 */

const { scanBusiness } = require('../src/scrapers/index');
const { generateInsights } = require('../src/lib/insights');

async function test() {
    const business = {
        business_name: 'Google',
        phone: '650-253-0000', // Example phone
        website: 'https://about.google/',
        address: '1600 Amphitheatre Parkway',
        city: 'Mountain View',
        country: 'USA'
    };

    console.log('Testing scan for:', business.business_name);

    try {
        const results = await scanBusiness(business);
        console.log('Scan Results:', JSON.stringify(results, null, 2));

        const insights = generateInsights(results, business);
        console.log('Insights:', JSON.stringify(insights, null, 2));

        if (results.length > 0) {
            console.log('SUCCESS: Components are working.');
        } else {
            console.log('WARNING: No results found, but code ran without error.');
        }
    } catch (error) {
        console.error('FAILED:', error);
    }
}

test();
