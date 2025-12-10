/**
 * Somnia Domains Service (.somi)
 * Resolves .somi domain names for wallet addresses
 * Uses backend proxy to avoid CORS issues
 */

// API URL from environment variable (for production) or localhost (for development)
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/profile/domain`
  : 'http://localhost:4000/api/profile/domain';

class SomniaNameServiceClass {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get primary .somi domain for a wallet address
   * @param {string} walletAddress
   * @returns {Promise<string|null>}
   */
  async getPrimarySomName(walletAddress) {
    if (!walletAddress) return null;

    const normalizedAddress = walletAddress.toLowerCase();

    // Check cache
    const cached = this.cache.get(normalizedAddress);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.name;
    }

    try {
      const response = await fetch(`${API_URL}/${walletAddress}`);
      if (!response.ok) return null;

      const data = await response.json();
      const resolvedName = (data.hasPrimary && data.primaryDomain) ? data.primaryDomain : null;

      // Cache result
      this.cache.set(normalizedAddress, {
        name: resolvedName,
        timestamp: Date.now()
      });

      return resolvedName;
    } catch (error) {
      // Cache failure to avoid spam
      this.cache.set(normalizedAddress, { name: null, timestamp: Date.now() });
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const SomniaNameService = new SomniaNameServiceClass();
export default SomniaNameService;
