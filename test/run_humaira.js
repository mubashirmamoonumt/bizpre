/**
 * Run Humaira Yousaf Scan
 * Scans 'Humaira Yousaf' to verify website scraping and contact harvesting.
 */

const { scanBusiness } = require('../src/scrapers/index');
const { generateInsights } = require('../src/lib/insights');

async function run() {
    const business = {
        business_name: 'Humaira Yousaf',
        website: 'https://humairayousaf.com/',
        phone: '',
        address: '',
        city: '',
        country: ''
    };

    console.log('Starting scan for:', business);

    try {
        const results = await scanBusiness(business);

        // Summary for user
        console.log('\n--- Verified Fields ---');
        console.log((results.business_info.verified_fields || []).join(', '));

        console.log('\n--- Found Platforms ---');
        if (results.social_links && Array.isArray(results.social_links)) {
            results.social_links.filter(r => r.found).forEach(r => {
                console.log(`[${r.platform}] ${r.url} (Score: ${r.match_score})`);
            });
        }

        console.log('\n--- Contact Details (VERIFICATION TARGET) ---');
        console.log('Emails:', JSON.stringify(results.contact_details.emails, null, 2));
        console.log('Phones:', JSON.stringify(results.contact_details.phones, null, 2));
        console.log('Addresses:', JSON.stringify(results.contact_details.addresses, null, 2));

    } catch (error) {
        console.error('FAILED:', error);
    }
}

run();
