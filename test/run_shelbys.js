/**
 * Run Shelby's Scan
 * Scans 'Shelbys Canada' to verify website scraping.
 */

const { scanBusiness } = require('../src/scrapers/index');
const { generateInsights } = require('../src/lib/insights');

async function run() {
    const business = {
        business_name: 'Shelby\'s Legendary Shawarma',
        website: 'https://www.shelbys.ca/',
        phone: '',
        address: '',
        city: 'London',
        country: 'Canada'
    };

    console.log('Starting scan for:', business);

    try {
        const results = await scanBusiness(business);
        // console.log('Scan Results:', JSON.stringify(results, null, 2));

        // Summary for user
        console.log('\n--- Verified Fields ---');
        console.log((results.business_info.verified_fields || []).join(', '));

        console.log('\n--- Contact Details ---');
        console.log('Emails:', JSON.stringify(results.contact_details.emails, null, 2));
        console.log('Phones:', JSON.stringify(results.contact_details.phones, null, 2));
        console.log('Addresses:', JSON.stringify(results.contact_details.addresses, null, 2));

        console.log('\n--- Found Platforms ---');
        if (results.social_links && Array.isArray(results.social_links)) {
            results.social_links.filter(r => r.found).forEach(r => {
                console.log(`[${r.platform}] ${r.url} (Score: ${r.match_score})`);
            });
        }

    } catch (error) {
        console.error('FAILED:', error);
    }
}

run();
