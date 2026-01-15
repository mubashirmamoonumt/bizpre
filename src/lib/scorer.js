/**
 * Match Scoring Module
 * Calculates relevance score between input business and found profile.
 */

const { normalizeText, normalizePhone, extractRootDomain } = require('./fingerprint');

/**
 * Calculate match score.
 * @param {object} fingerprint - Normalized fingerprint of the input business
 * @param {object} profile - Scraped profile (normalized where possible)
 * @returns {number} Score (0-100)
 */
function calculateScore(fingerprint, profile) {
    let score = 0;

    // Normalize profile fields on the fly if not already
    const profilePhone = normalizePhone(profile.phone);
    const profileDomain = extractRootDomain(profile.website || profile.url);

    // Normalize profile text fields
    const profileName = normalizeText(profile.name);
    const profileAddress = normalizeText(profile.address);
    const profileCity = normalizeText(profile.city);

    // 4 Matching Criteria
    let matchCount = 0;

    // 1. Phone Match
    const phoneMatch = fingerprint.phone && profilePhone && profilePhone.includes(fingerprint.phone);
    if (phoneMatch) {
        matchCount++;
    }

    // 2. Domain Match
    const domainMatch = fingerprint.domain && profileDomain && profileDomain === fingerprint.domain;
    if (domainMatch) {
        matchCount++;
    }

    // 3. Address Match (City included in specific check or separate?)
    // Prompt says "Address". Let's use strict address check or combined checks.
    // If Address is present in both and matches fuzzy
    if (fingerprint.address && profileAddress && (profileAddress.includes(fingerprint.address) || fingerprint.address.includes(profileAddress))) {
        matchCount++;
    }

    // 4. Name Match
    if (fingerprint.name && profileName && (profileName.includes(fingerprint.name) || fingerprint.name.includes(profileName))) {
        matchCount++;
    }

    // 2-of-4 Rule Integration
    // If we have >= 2 matches, confidence is high.
    if (matchCount >= 2) {
        return 100;
    }

    // Fallback specific overrides as per previous priorities
    if (domainMatch || phoneMatch) return 100; // Strongest single signals
    // If name matches + City (which we can treat as partial address signal)
    if (fingerprint.name && profileName && profileName === fingerprint.name && fingerprint.city && profileCity && profileCity.includes(fingerprint.city)) {
        return 70; // Name + City
    }

    // If only name matches, minimal score
    // if (fingerprint.name === profileName) return 40;

    return 0;
}

module.exports = { calculateScore };
