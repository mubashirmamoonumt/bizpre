/**
 * Discovery Engine Orchestrator
 * Strict Hierarchy: Website -> Maps (Verify) -> Phone Search -> Fallback.
 * + Full Contact Harvesting & Reconciliation.
 */

const { launchBrowser } = require('./browser');
const { scrapeGoogleMaps } = require('./googleMaps');
const { searchGoogle } = require('./googleSearch');
const { scrapeWebsite } = require('./website');
const { calculateScore } = require('../lib/scorer');
const { createFingerprint } = require('../lib/fingerprint');
const { reconcileData } = require('../lib/reconciliation');

const PLATFORMS = {
    FACEBOOK: 'site:facebook.com',
    INSTAGRAM: 'site:instagram.com',
    LINKEDIN: 'site:linkedin.com/company',
    YELP: 'site:yelp.com',
    YELLOWPAGES: 'site:yellowpages.com',
    FOURSQUARE: 'site:foursquare.com',
    APPLE_MAPS: 'site:maps.apple.com',
    BING_PLACES: 'site:bing.com/maps',
    TRIPADVISOR: 'site:tripadvisor.com',
    YOUTUBE: 'site:youtube.com',
    TIKTOK: 'site:tiktok.com'
};

/**
 * Scan a business strict mode.
 * @param {object} businessInput 
 * @returns {Promise<object>} Presence Map + Insights
 */
async function scanBusiness(businessInput) {
    const browser = await launchBrowser();
    const fingerprint = createFingerprint(businessInput);

    // Data Containers for Harvesting
    const harvestedData = {
        social: [],
        emails: [],
        phones: [],
        addresses: []
    };

    const foundPlatforms = new Set();

    let knownWebsite = businessInput.website;
    let knownPhone = businessInput.phone;

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // STEP 1: Website Crawl (Primary Source)
        if (knownWebsite) {
            const siteData = await scrapeWebsite(page, knownWebsite);

            // Merge harvesting results
            harvestedData.emails.push(...siteData.emails);
            harvestedData.phones.push(...siteData.phones);
            harvestedData.addresses.push(...siteData.addresses);

            for (const link of siteData.social) {
                console.log(`[Discovery] Found ${link.platform} via website: ${link.url}`);
                harvestedData.social.push({
                    platform: link.platform,
                    found: true,
                    url: link.url,
                    match_score: 100 // Highest priority
                });
                foundPlatforms.add(link.platform);
            }
        }

        // STEP 2: Google Maps (Verifier & Metadata)
        const mapsResult = await scrapeGoogleMaps(page, businessInput);
        if (mapsResult.found) {
            const score = calculateScore(fingerprint, mapsResult);
            if (score >= 40) {
                harvestedData.social.push({ ...mapsResult, match_score: score });

                // Harvest from Maps
                if (mapsResult.phone) harvestedData.phones.push(mapsResult.phone);
                if (mapsResult.address) harvestedData.addresses.push(mapsResult.address);

                // New Website Discovery
                if (mapsResult.website && !knownWebsite) {
                    console.log(`[Discovery] Maps found website: ${mapsResult.website}. Triggering crawl.`);
                    knownWebsite = mapsResult.website;

                    // Trigger Website Crawl (Late Binding)
                    const siteData = await scrapeWebsite(page, knownWebsite);

                    // Merge harvesting results
                    harvestedData.emails.push(...siteData.emails);
                    harvestedData.phones.push(...siteData.phones);
                    harvestedData.addresses.push(...siteData.addresses);

                    for (const link of siteData.social) {
                        if (!foundPlatforms.has(link.platform)) {
                            console.log(`[Discovery] Found ${link.platform} via maps-discovered website: ${link.url}`);
                            harvestedData.social.push({
                                platform: link.platform,
                                found: true,
                                url: link.url,
                                match_score: 100
                            });
                            foundPlatforms.add(link.platform);
                        }
                    }
                }
                if (mapsResult.phone && !knownPhone) {
                    knownPhone = mapsResult.phone;
                }
            }
        } else {
            harvestedData.social.push({ platform: 'Google Maps', found: false });
        }

        // STEP 3: Phone Based Discovery
        if (knownPhone) {
            // Normalize phone for search
            for (const [platformName, siteQuery] of Object.entries(PLATFORMS)) {
                if (foundPlatforms.has(platformName)) continue;

                const query = `${siteQuery} "${knownPhone}"`;
                const searchRes = await searchGoogle(page, query);

                if (searchRes.length > 0) {
                    const firstRes = searchRes[0];
                    harvestedData.social.push({
                        platform: platformName,
                        found: true,
                        url: firstRes.link,
                        match_score: 100
                    });
                    foundPlatforms.add(platformName);
                } else {
                    harvestedData.social.push({ platform: platformName, found: false });
                }
            }
        } else {
            // STEP 4: Fallback
            console.log('[Discovery] No phone number available. Running minimal fallback search.');

            for (const [platformName, siteQuery] of Object.entries(PLATFORMS)) {
                if (foundPlatforms.has(platformName)) continue;

                if (businessInput.business_name && businessInput.city) {
                    const query = `${siteQuery} "${businessInput.business_name}" ${businessInput.city}`;
                    const searchRes = await searchGoogle(page, query);

                    if (searchRes.length > 0) {
                        const firstRes = searchRes[0];
                        const profile = { name: firstRes.title, url: firstRes.link };
                        const score = calculateScore(fingerprint, profile);

                        if (score >= 40) {
                            harvestedData.social.push({
                                platform: platformName,
                                found: true,
                                url: firstRes.link,
                                match_score: score
                            });
                        }
                    }
                }
            }
        }

    } catch (e) {
        console.error('Scan failed', e);
    } finally {
        await browser.close();
    }

    // --- RECONCILIATION ---
    const finalOutput = reconcileData(businessInput, harvestedData);
    return finalOutput;
}

module.exports = { scanBusiness };
