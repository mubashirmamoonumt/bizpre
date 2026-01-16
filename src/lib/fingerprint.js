/**
 * Identity Fingerprint Module
 * Normalizes business data for consistent matching.
 */

const { URL } = require('url');

/**
 * Extract root domain from a URL.
 * e.g. https://www.example.com/foo -> example.com
 * @param {string} urlString 
 * @returns {string|null}
 */
function extractRootDomain(urlString) {
  if (!urlString) return null;
  try {
    // Add protocol if missing
    if (!urlString.startsWith('http')) {
      urlString = 'http://' + urlString;
    }
    const parsed = new URL(urlString);
    let hostname = parsed.hostname;
    
    // Remove www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    
    return hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

/**
 * Normalize phone number to digits only.
 * @param {string} phone 
 * @returns {string}
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalize text: lowercase, trim, remove symbols.
 * @param {string} text 
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  // Lowercase and trim
  let normalized = text.toLowerCase().trim();
  // Remove symbols (keep alphanumeric and spaces for readability in some cases, 
  // but prompt says "Remove symbols", usually implies keeping letters/numbers)
  // Let's keep spaces for "Business Name" vs "businessname" check, 
  // or strictly remove everything non-alphanumeric? 
  // "Remove symbols" usually means punctuation. 
  // Let's remove punctuation but keep spaces for name/address parts.
  normalized = normalized.replace(/[^\w\s]/g, '');
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized.trim();
}

/**
 * Create a fingerprint object.
 * @param {object} business 
 * @returns {object}
 */
function createFingerprint(business) {
  return {
    name: normalizeText(business.business_name),
    phone: normalizePhone(business.phone),
    domain: extractRootDomain(business.website),
    address: normalizeText(business.address),
    city: normalizeText(business.city),
    country: normalizeText(business.country),
    original: business // Keep reference if needed
  };
}

module.exports = {
  createFingerprint,
  normalizeText,
  normalizePhone,
  extractRootDomain
};
