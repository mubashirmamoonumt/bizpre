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
function generateInsights(results, businessInput) {
    const flags = {
        missing_google: true,
        missing_facebook: true,
        missing_instagram: true,
        missing_yelp: true,
        no_website: !businessInput.website,
        low_reviews: false,
        bad_rating: false
    };

    results.forEach(res => {
        if (res.found) {
            if (res.platform === 'Google Maps') flags.missing_google = false;
            if (res.platform === 'FACEBOOK') flags.missing_facebook = false;
            if (res.platform === 'INSTAGRAM') flags.missing_instagram = false;
            if (res.platform === 'YELP') flags.missing_yelp = false;

            if (res.reviews !== undefined && res.reviews < 5) flags.low_reviews = true; // threshold? 10? 5?
            if (res.rating !== undefined && res.rating < 4.0) flags.bad_rating = true;
        }
    });

    return flags;
}

module.exports = { generateInsights };
