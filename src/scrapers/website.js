/**
 * Website Scraper
 * Visits the business website and extracts social media links, emails, phones, and addresses.
 * Depth 2: Crawls Homepage + Contact/About pages.
 */

const { URL } = require('url');

const SOCIAL_DOMAINS = {
    'facebook.com': 'FACEBOOK',
    'instagram.com': 'INSTAGRAM',
    'linkedin.com': 'LINKEDIN',
    'yelp.com': 'YELP',
    'twitter.com': 'TWITTER',
    'x.com': 'TWITTER',
    'youtube.com': 'YOUTUBE',
    'pinterest.com': 'PINTEREST',
    'tiktok.com': 'TIKTOK',
    'tripadvisor.com': 'TRIPADVISOR',
    'foursquare.com': 'FOURSQUARE',
    'yellowpages.com': 'YELLOWPAGES',
    'wa.me': 'WHATSAPP',
    'whatsapp.com': 'WHATSAPP',
    'github.com': 'GITHUB'
};

// Improved Regex Parsers
const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
// Supports international formats like +971 55 891 0258, +1 (555) 123-4567
const PHONE_REGEX = /(?:\+|00)(?:[0-9]{1,3})[\s.-]?\(?[0-9]{2,4}\)?[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{3,9}/g;
// Keywords to identify address-like text blocks (simple heuristic)
const ADDRESS_KEYWORDS = ['street', 'road', 'avenue', 'boulevard', 'lane', 'drive', 'way', 'suite', 'floor', 'box', 'dubai', 'uae', 'usa', 'uk', 'canada', 'london'];

/**
 * Scroll to bottom of page to trigger lazy loading.
 * @param {import('puppeteer').Page} page 
 */
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

/**
 * Extract links from a page.
 * @param {import('puppeteer').Page} page 
 * @returns {Promise<Array<string>>}
 */
async function extractLinks(page) {
    return await page.$$eval('a', anchors =>
        anchors.map(a => a.href).filter(href => href)
    );
}

/**
 * Filter for interesting subpages (Contact, About).
 * @param {string} baseUrl 
 * @param {Array<string>} urls 
 * @returns {Array<string>}
 */
function getInterestingSubpages(baseUrl, urls) {
    const interestTerms = ['contact', 'about', 'connect', 'location', 'find-us'];
    const candidates = urls.filter(u => {
        try {
            if (!u.startsWith(baseUrl)) return false;
            const lower = u.toLowerCase();
            return interestTerms.some(term => lower.includes(term));
        } catch (e) { return false; }
    });
    return [...new Set(candidates)].slice(0, 3);
}

/**
 * Scrape website using Depth 2.
 * @param {import('puppeteer').Page} page 
 * @param {string} url 
 * @returns {Promise<object>} Returns rich object { social, emails, phones, schema }
 */
async function scrapeWebsite(page, url) {
    if (!url) return { social: [], emails: [], phones: [], addresses: [] };

    // Normalize URL
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    console.log(`[Website] Crawling ${url}...`);

    const data = {
        social: [],
        emails: [],
        phones: [],
        addresses: []
    };

    const foundPlatforms = new Set();
    const processedSubpages = new Set();

    // Helper to process a page
    const processPage = async (targetUrl) => {
        try {
            console.log(`[Website] Visiting ${targetUrl}`);
            await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });

            // Auto-scroll to load dynamic content (footer etc)
            await autoScroll(page);
            await new Promise(r => setTimeout(r, 2000)); // Wait for lazy load

            const content = await page.content();
            const hrefs = await extractLinks(page);

            // 1. Social Links
            const uniqueHrefs = [...new Set(hrefs)];
            for (const href of uniqueHrefs) {
                try {
                    if (href.startsWith('http')) {
                        const parsed = new URL(href);
                        const hostname = parsed.hostname.toLowerCase().replace('www.', '');
                        for (const [domain, platform] of Object.entries(SOCIAL_DOMAINS)) {
                            if (hostname === domain || hostname.endsWith('.' + domain)) {
                                if (!foundPlatforms.has(platform)) {
                                    if (!href.includes('share') && !href.includes('intent')) {
                                        data.social.push({ platform: platform, url: href });
                                        foundPlatforms.add(platform);
                                    }
                                }
                            }
                        }
                    } else if (href.startsWith('mailto:')) {
                        const email = decodeURIComponent(href.replace('mailto:', '')).split('?')[0].trim();
                        if (email && email.includes('@')) data.emails.push(email);
                    } else if (href.startsWith('tel:')) {
                        const phone = decodeURIComponent(href.replace('tel:', '')).trim();
                        if (phone.length > 5) data.phones.push(phone);
                    }
                } catch (e) { }
            }

            // 2. Text Extraction (Regex)
            const textContent = await page.evaluate(() => document.body.innerText);

            const foundEmails = textContent.match(EMAIL_REGEX) || [];
            foundEmails.forEach(e => data.emails.push(e.trim()));

            const foundPhones = textContent.match(PHONE_REGEX) || [];
            foundPhones.forEach(p => data.phones.push(p.trim()));

            // Basic Address Heuristic: Look for lines containing address keywords
            const lines = textContent.split('\n');
            const STRONG_LOCATIONS = ['dubai', 'uae', 'usa', 'uk', 'canada', 'london', 'ny', 'ny', 'ca'];

            lines.forEach(line => {
                const lower = line.toLowerCase().replace(/[^\w\s]/g, '');
                if (line.length < 150 && line.length > 10) {
                    // If it has digits OR strong location keywords
                    const hasDigit = /\d/.test(line);
                    const hasStrongLocation = STRONG_LOCATIONS.some(k => lower.includes(k));
                    const hasAddressKeyword = ADDRESS_KEYWORDS.some(k => lower.includes(k));

                    if ((hasDigit && hasAddressKeyword) || (hasStrongLocation && hasAddressKeyword)) {
                        if (!lower.includes('contact') && !lower.includes('about') && !lower.includes('rights reserved')) {
                            data.addresses.push(line.trim());
                        }
                    }
                }
            });

            // 3. Schema.org / JSON-LD
            const schemas = await page.evaluate(() => {
                const results = [];
                const tags = document.querySelectorAll('script[type="application/ld+json"]');
                tags.forEach(tag => {
                    try {
                        const json = JSON.parse(tag.innerText);
                        results.push(json);
                    } catch (e) { }
                });
                return results;
            });

            schemas.forEach(schema => {
                const parseEntity = (entity) => {
                    if (!entity) return;
                    if (entity['@type'] === 'LocalBusiness' || entity['@type'] === 'Organization' || entity['@type'] === 'Restaurant') {
                        if (entity.telephone) data.phones.push(entity.telephone);
                        if (entity.email) data.emails.push(entity.email);
                        if (entity.address) {
                            if (typeof entity.address === 'string') {
                                data.addresses.push(entity.address);
                            } else if (entity.address.streetAddress) {
                                // Composite address
                                const addr = [entity.address.streetAddress, entity.address.addressLocality, entity.address.addressRegion].filter(Boolean).join(', ');
                                data.addresses.push(addr);
                            }
                        }
                        if (entity.sameAs) {
                            const links = Array.isArray(entity.sameAs) ? entity.sameAs : [entity.sameAs];
                            links.forEach(l => {
                                try {
                                    const parsed = new URL(l);
                                    const hostname = parsed.hostname.toLowerCase().replace('www.', '');
                                    for (const [domain, platform] of Object.entries(SOCIAL_DOMAINS)) {
                                        if (hostname === domain || hostname.endsWith('.' + domain)) {
                                            if (!foundPlatforms.has(platform)) {
                                                data.social.push({ platform: platform, url: l });
                                                foundPlatforms.add(platform);
                                            }
                                        }
                                    }
                                } catch (e) { }
                            });
                        }
                    }
                };

                if (Array.isArray(schema)) {
                    schema.forEach(parseEntity);
                } else {
                    parseEntity(schema);
                }
            });

            return uniqueHrefs;
        } catch (error) {
            console.error(`[Website] Error visiting ${targetUrl}:`, error.message);
            return [];
        }
    };

    // 1. Crawl Homepage
    const homeLinks = await processPage(url);
    processedSubpages.add(url);
    if (!url.endsWith('/')) processedSubpages.add(url + '/');

    // 2. Crawl Subpages (Depth 2)
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const subpages = getInterestingSubpages(baseUrl, homeLinks);

    for (const subpage of subpages) {
        if (processedSubpages.has(subpage)) continue;
        await processPage(subpage);
        processedSubpages.add(subpage);
    }

    // Deduplicate Arrays
    data.emails = [...new Set(data.emails.map(e => e.toLowerCase()))];
    data.phones = [...new Set(data.phones)];
    data.addresses = [...new Set(data.addresses)];

    return data;
}

module.exports = { scrapeWebsite };
