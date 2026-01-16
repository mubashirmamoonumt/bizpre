/**
 * Insights Generator
 * Generates flags based on presence results.
 */

/**
 * Generate insights from results.
 * @param {Array<object>} results 
 * @param {object} businessInput 
 * @returns {object} Insights object
 */
/**
 * Generate insights from results.
 * @param {object|Array} results - Scan result object or legacy array
 * @param {object} businessInput 
 * @returns {object} Insights object
 */
function generateInsights(results, businessInput) {
    const flags = {
        missing_google: true,
        missing_facebook: true,
        missing_instagram: true,
        missing_yelp: true,
        no_website: !businessInput.website,
        low_reviews: false,
        bad_rating: false,
        missing_phone: true,
        missing_email: true
    };

    // 1. Handle "New Object" Structure
    if (results && !Array.isArray(results) && typeof results === 'object') {
        // Platforms (Object)
        if (results.platforms) {
            // Google Maps
            const gmaps = results.platforms.google_maps;
            if (gmaps) {
                flags.missing_google = false;
                if (gmaps.reviews !== undefined && gmaps.reviews < 5) flags.low_reviews = true;
                if (gmaps.rating !== undefined && gmaps.rating < 4.0) flags.bad_rating = true;
            }

            // Socials
            if (results.platforms.facebook) flags.missing_facebook = false;
            if (results.platforms.instagram) flags.missing_instagram = false;
            if (results.platforms.yelp) flags.missing_yelp = false;

            // Iterate other keys if needed dynamic checking
            Object.values(results.platforms).forEach(p => {
                if (p && p.rating && p.rating < 4.0) flags.bad_rating = true;
            });
        }

        // Social Links (Array - fallback/complementary)
        if (results.social_links && Array.isArray(results.social_links)) {
            results.social_links.forEach(link => {
                if (link.found) {
                    const p = link.platform ? link.platform.toUpperCase() : '';
                    if (p === 'FACEBOOK') flags.missing_facebook = false;
                    if (p === 'INSTAGRAM') flags.missing_instagram = false;
                    if (p === 'YELP') flags.missing_yelp = false;
                }
            });
        }

        // Phones
        if (results.phones) {
            if (typeof results.phones === 'object' && !Array.isArray(results.phones)) {
                if (results.phones.primary || (results.phones.secondary && results.phones.secondary.length > 0)) {
                    flags.missing_phone = false;
                }
            } else if (Array.isArray(results.phones) && results.phones.length > 0) {
                flags.missing_phone = false;
            } else if (typeof results.phones === 'string' && results.phones.length > 0) {
                flags.missing_phone = false;
            }
        }

        // Emails
        if (results.emails && Array.isArray(results.emails) && results.emails.length > 0) {
            flags.missing_email = false;
        }
    }
    // 2. Handle "Legacy Array" Structure
    else if (Array.isArray(results)) {
        results.forEach(res => {
            if (res.found) {
                if (res.platform === 'Google Maps') flags.missing_google = false;
                if (res.platform === 'FACEBOOK') flags.missing_facebook = false;
                if (res.platform === 'INSTAGRAM') flags.missing_instagram = false;
                if (res.platform === 'YELP') flags.missing_yelp = false;

                if (res.reviews !== undefined && res.reviews < 5) flags.low_reviews = true;
                if (res.rating !== undefined && res.rating < 4.0) flags.bad_rating = true;
            }
        });

        // In legacy array, phones/emails were not explicitly passed to this function usually,
        // or embedded in platform results. Assuming no change to phone/email flags for legacy.
        // We can check if businessInput has them if we want, but sticking to result analysis.
    }

    return flags;
}

module.exports = { generateInsights };
