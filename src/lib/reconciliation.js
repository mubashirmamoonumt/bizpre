/**
 * Data Reconciliation Module
 * Merges scraped data with user input, verifying matches and storing secondary options.
 */

const { normalizePhone } = require('./fingerprint');

/**
 * Normalize email (lowercase, trim)
 */
function normalizeEmail(email) {
    if (!email) return '';
    return email.toLowerCase().trim();
}

/**
 * Reconcile scraped data with user input.
 * @param {object} userBusiness - Original user input
 * @param {object} scrapedData - Data collected from scraping
 * @returns {object} rich output object
 */
function reconcileData(userBusiness, scrapedData) {
    const output = {
        business_info: {
            ...userBusiness,
            verified_fields: [], // Fields where Scraped matched User
        },
        contact_details: {
            emails: {
                primary: userBusiness.email || null,
                secondary: [],
                verified: false
            },
            phones: {
                primary: userBusiness.phone || null,
                secondary: [],
                verified: false
            },
            addresses: {
                primary: userBusiness.address || null,
                secondary: [],
                verified: false
            }
        },
        social_links: scrapedData.social || [],
        confidence_score: 0, // Simplified score
    };

    // --- EMAIL RECONCILIATION ---
    const userEmail = normalizeEmail(userBusiness.email);
    const scrapedEmails = (scrapedData.emails || []).map(normalizeEmail);

    // If we have scraped emails
    if (scrapedEmails.length > 0) {
        // If user provided an email
        if (userEmail) {
            if (scrapedEmails.includes(userEmail)) {
                output.contact_details.emails.verified = true;
                output.business_info.verified_fields.push('email');
            }
        } else {
            // User didn't provide one, adopt the first scraped one as primary
            output.contact_details.emails.primary = scrapedEmails[0];
            scrapedEmails.shift();
        }

        // Add remaining to secondary (excluding primary)
        scrapedEmails.forEach(e => {
            if (e !== output.contact_details.emails.primary && !output.contact_details.emails.secondary.includes(e)) {
                output.contact_details.emails.secondary.push(e);
            }
        });
    }


    // --- PHONE RECONCILIATION ---
    const userPhoneStart = normalizePhone(userBusiness.phone || '');
    const scrapedPhones = (scrapedData.phones || []).map(p => ({ raw: p, norm: normalizePhone(p) }));

    if (scrapedPhones.length > 0) {
        if (userPhoneStart && userPhoneStart.length > 5) {
            // Check matches
            const match = scrapedPhones.find(p => p.norm.includes(userPhoneStart) || userPhoneStart.includes(p.norm));
            if (match) {
                output.contact_details.phones.verified = true;
                output.business_info.verified_fields.push('phone');
            }
        } else {
            // Adopt first
            output.contact_details.phones.primary = scrapedPhones[0].raw;
            scrapedPhones.shift();
        }

        // Add remaining
        scrapedPhones.forEach(p => {
            const primaryNorm = normalizePhone(output.contact_details.phones.primary || '');
            if (p.norm !== primaryNorm && !output.contact_details.phones.secondary.includes(p.raw)) {
                output.contact_details.phones.secondary.push(p.raw);
            }
        });
    }

    // --- ADDRESS RECONCILIATION ---
    // User address parsing is hard without a library, we'll do simple string inclusion
    const userAddr = (userBusiness.address || '').toLowerCase();
    const scrapedAddrs = (scrapedData.addresses || []);

    if (scrapedAddrs.length > 0) {
        if (userAddr) {
            const match = scrapedAddrs.find(a => a.toLowerCase().includes(userAddr) || userAddr.includes(a.toLowerCase()));
            if (match) {
                output.contact_details.addresses.verified = true;
                output.business_info.verified_fields.push('address');
            }
        } else {
            output.contact_details.addresses.primary = scrapedAddrs[0];
            scrapedAddrs.shift();
        }

        scrapedAddrs.forEach(a => {
            if (a !== output.contact_details.addresses.primary && !output.contact_details.addresses.secondary.includes(a)) {
                output.contact_details.addresses.secondary.push(a);
            }
        });
    }

    // --- WEBSITE ---
    // If we scraped it from a provided website, the website is verified by definition (it exists).
    // If we found it via maps, we verified it there.
    if (userBusiness.website) {
        output.business_info.verified_fields.push('website');
    }

    return output;
}

module.exports = { reconcileData };
