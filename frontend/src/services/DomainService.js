/**
 * Domain Service
 * Handles .somi domain registration and management
 */
import { ethers } from 'ethers';
import { DOMAIN_CONFIG, DOMAIN_REGISTRY_ABI } from '../config/domain.config.js';
import { SwapService } from './SwapService.js';

export class DomainService {
  constructor() {
    this.registryAddress = null;
    this.registryContract = null;
  }

  /**
   * Initialize domain service
   * Always uses Mainnet RPC since domains are on Mainnet
   */
  async init() {
    try {
      // Domain service always uses Mainnet (chainId 5031)
      const mainnetRpcUrl = 'https://api.infra.mainnet.somnia.network';
      this.provider = new ethers.JsonRpcProvider(mainnetRpcUrl);
      
      this.registryAddress = DOMAIN_CONFIG.mainnet.registry;

      this.registryContract = new ethers.Contract(
        this.registryAddress,
        DOMAIN_REGISTRY_ABI,
        this.provider
      );

      return true;
    } catch (error) {
      console.error('DomainService init error:', error);
      return false;
    }
  }

  /**
   * Switch to Somnia Mainnet
   */
  async switchToMainnet() {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    const browserProvider = SwapService.getBrowserProvider();
    if (browserProvider) {
      const network = await browserProvider.getNetwork();
      if (network.chainId !== BigInt(DOMAIN_CONFIG.mainnet.chainId)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${DOMAIN_CONFIG.mainnet.chainId.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Chain not added, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${DOMAIN_CONFIG.mainnet.chainId.toString(16)}`,
                chainName: 'Somnia Mainnet',
                rpcUrls: ['https://mainnet-rpc.somnia.network'],
                nativeCurrency: {
                  name: 'SOMI',
                  symbol: 'SOMI',
                  decimals: 18
                },
                blockExplorerUrls: ['https://explorer.somnia.network']
              }]
            });
          } else {
            throw new Error('Please switch to Somnia Mainnet in your wallet');
          }
        }
      }
    }
  }

  /**
   * Check if domain is available
   * Checks by getting domain info - if owner is zero address, domain is available
   */
  async isAvailable(domainName) {
    try {
      if (!this.registryContract) {
        await this.init();
      }

      // Remove .somi if present and convert to lowercase
      const cleanName = domainName.replace(/\.somi$/i, '').toLowerCase();
      
      if (!cleanName || cleanName.length === 0) {
        return false;
      }
      
      // Try to get domain info - domains() returns a tuple [owner, expiry]
      try {
        const domainInfo = await this.registryContract.domains(cleanName);
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        
        // domainInfo is a tuple: [owner, expiry]
        let owner;
        if (Array.isArray(domainInfo) && domainInfo.length >= 2) {
          owner = domainInfo[0];
        } else if (domainInfo && domainInfo.owner) {
          owner = domainInfo.owner;
        } else {
          // If we can't parse the structure, assume available
          return true;
        }
        
        // Check if owner is zero address
        if (owner) {
          const ownerStr = String(owner).toLowerCase();
          const isZero = ownerStr === zeroAddress.toLowerCase() || ownerStr === '0x0' || ownerStr === '';
          return isZero;
        }
        
        // If no owner, assume available
        return true;
      } catch (domainError) {
        // If domains() call reverts, domain might not exist (available)
        // But we need to be careful - if it's a real revert, domain might be taken
        console.log('Domain check error:', domainError);
        
        // If it's a revert error, it could mean:
        // 1. Domain doesn't exist (available) - but this shouldn't revert
        // 2. Domain exists but contract has an issue
        // To be safe, if it reverts, assume NOT available
        if (domainError.message && domainError.message.includes('revert')) {
          return false;
        }
        
        // For other errors (network, etc.), assume not available to be safe
        return false;
      }
    } catch (error) {
      console.error('DomainService isAvailable error:', error);
      // If check fails, assume not available to be safe
      return false;
    }
  }

  /**
   * Register a new domain
   * @param {string} domainName - Domain name without .somi
   * @returns {Promise<Object>} Transaction receipt
   */
  async register(domainName) {
    try {
      const signer = await SwapService.getSigner();
      if (!signer) {
        throw new Error('No signer available. Please connect wallet.');
      }

      // Ensure we're on mainnet
      await this.switchToMainnet();

      if (!this.registryContract) {
        await this.init();
      }

      // Remove .somi if present and convert to lowercase
      const cleanName = domainName.replace(/\.somi$/i, '').toLowerCase();
      
      // Validate domain name (only letters, numbers, hyphens)
      if (!/^[a-z0-9-]+$/.test(cleanName)) {
        throw new Error('Domain name can only contain letters, numbers, and hyphens');
      }
      
      // Domain name cannot be empty
      if (!cleanName || cleanName.length === 0) {
        throw new Error('Domain name cannot be empty');
      }

      // Get contract with signer
      const registryWithSigner = new ethers.Contract(
        this.registryAddress,
        DOMAIN_REGISTRY_ABI,
        signer
      );

      // Get price for 1 year registration
      const years = 1; // Default to 1 year
      let cost;
      try {
        cost = await this.registryContract.getPrice(years);
        console.log(`Price for ${years} year(s):`, ethers.formatEther(cost), 'SOMI');
      } catch (priceError) {
        console.warn('Could not get price, using default 5 SOMI:', priceError);
        cost = ethers.parseEther('5'); // Fallback to 5 SOMI
      }
      
      // Check user balance
      const balance = await signer.provider.getBalance(await signer.getAddress());
      console.log('User balance:', ethers.formatEther(balance), 'SOMI');
      console.log('Required cost:', ethers.formatEther(cost), 'SOMI');
      
      if (balance < cost) {
        throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} SOMI but need ${ethers.formatEther(cost)} SOMI.`);
      }
      
      // Check if domain is already taken
      try {
        const domainInfo = await this.registryContract.domains(cleanName);
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        if (domainInfo.owner && domainInfo.owner.toLowerCase() !== zeroAddress.toLowerCase()) {
          throw new Error(`Domain ${cleanName}.somi is already registered by ${domainInfo.owner}`);
        }
      } catch (domainCheckError) {
        if (domainCheckError.message.includes('already registered')) {
          throw domainCheckError;
        }
        // If check fails, continue (domain might be available)
        console.log('Domain availability check inconclusive, proceeding with registration');
      }
      
      console.log(`Registering domain: ${cleanName}.somi`);
      console.log(`Years: ${years}, Cost: ${ethers.formatEther(cost)} SOMI`);

      // Try to estimate gas first
      let gasLimit = 500000n; // Default gas limit
      try {
        const estimatedGas = await registryWithSigner.register.estimateGas(cleanName, years, { value: cost });
        gasLimit = estimatedGas + (estimatedGas / 10n); // Add 10% buffer
        console.log('Gas estimated:', gasLimit.toString());
      } catch (estimateError) {
        console.warn('Gas estimation failed, using manual limit:', estimateError);
        // If gas estimation fails, it might indicate the transaction will revert
        // Check the error message for clues
        if (estimateError.message && estimateError.message.includes('revert')) {
          throw new Error('Transaction would revert. Domain may already be taken or you may not have enough SOMI.');
        }
        // Use manual limit if estimation fails for other reasons
        gasLimit = 500000n;
      }

      console.log('Calling register with:', {
        name: cleanName,
        years: years,
        value: cost.toString(),
        gasLimit: gasLimit.toString(),
        gasPrice: '6 gwei'
      });

      const tx = await registryWithSigner.register(cleanName, years, {
        value: cost,
        gasPrice: ethers.parseUnits('6', 'gwei'),
        gasLimit: gasLimit
      });

      console.log('Registration transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      
      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction reverted. Domain may already be taken or insufficient funds.');
      }
      
      // Parse events to get registered domain name
      let registeredDomain = cleanName;
      try {
        // Look for Registered event
        const iface = new ethers.Interface(DOMAIN_REGISTRY_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === 'Registered') {
              // Ensure domain is a string
              const domainFromEvent = parsed.args.name;
              registeredDomain = typeof domainFromEvent === 'string' 
                ? domainFromEvent 
                : String(domainFromEvent);
              console.log('Found Registered event:', registeredDomain);
              break;
            }
          } catch (e) {
            // Not our event, continue
          }
        }
      } catch (e) {
        console.warn('Could not parse events:', e);
      }
      
      // Ensure registeredDomain is always a string
      if (typeof registeredDomain !== 'string') {
        registeredDomain = String(registeredDomain);
      }
      
      console.log('Domain registered successfully:', receipt);
      console.log('Registered domain:', registeredDomain);

      // Save domain to local storage
      const signerAddress = await signer.getAddress();
      console.log('Saving domain to storage for address:', signerAddress);
      this.addDomainToStorage(signerAddress, registeredDomain);
      console.log('Domain saved to storage. Current domains:', this.getDomainsFromStorage(signerAddress));

      return {
        success: true,
        txHash: tx.hash,
        receipt,
        domain: registeredDomain
      };
    } catch (error) {
      console.error('DomainService register error:', error);
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('execution reverted')) {
        throw new Error('Registration failed. Domain may already be taken, or you may not have enough SOMI (5 SOMI required).');
      } else if (error.message && error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds. You need at least 5 SOMI to register a domain.');
      }
      
      throw error;
    }
  }

  /**
   * Set primary domain
   * @param {string} domainName - Domain name without .somi
   * @returns {Promise<Object>} Transaction receipt
   */
  async setPrimary(domainName) {
    try {
      const signer = await SwapService.getSigner();
      if (!signer) {
        throw new Error('No signer available. Please connect wallet.');
      }

      // Ensure we're on mainnet
      await this.switchToMainnet();

      if (!this.registryContract) {
        await this.init();
      }

      // Remove .somi if present and convert to lowercase
      const cleanName = domainName.replace(/\.somi$/i, '').toLowerCase();

      // Get contract with signer
      const registryWithSigner = new ethers.Contract(
        this.registryAddress,
        DOMAIN_REGISTRY_ABI,
        signer
      );

      console.log(`Setting primary domain: ${cleanName}.somi`);

      const tx = await registryWithSigner.setPrimary(cleanName, {
        gasPrice: ethers.parseUnits('6', 'gwei')
      });

      console.log('SetPrimary transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Primary domain set successfully:', receipt);

      // Save to local storage
      const signerAddress = await signer.getAddress();
      const key = `primary_${signerAddress.toLowerCase()}`;
      localStorage.setItem(key, cleanName);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('DomainService setPrimary error:', error);
      throw error;
    }
  }

  /**
   * Clear primary domain on-chain
   * Calls clearPrimary() on SomiNameRegistryV2
   */
  async clearPrimary() {
    try {
      const signer = await SwapService.getSigner();
      if (!signer) {
        throw new Error('No signer available. Please connect wallet.');
      }

      // Ensure we're on mainnet
      await this.switchToMainnet();

      if (!this.registryContract) {
        await this.init();
      }

      const registryWithSigner = new ethers.Contract(
        this.registryAddress,
        DOMAIN_REGISTRY_ABI,
        signer
      );

      console.log('Clearing primary domain for signer');

      const tx = await registryWithSigner.clearPrimary({
        gasPrice: ethers.parseUnits('6', 'gwei')
      });

      console.log('clearPrimary transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Primary domain cleared successfully:', receipt);

      // Clear local storage cache
      const signerAddress = (await signer.getAddress()).toLowerCase();
      const key = `primary_${signerAddress}`;
      localStorage.removeItem(key);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('DomainService clearPrimary error:', error);
      throw error;
    }
  }

  /**
   * Get domains from local storage (cached)
   * @param {string} address - Wallet address
   * @returns {Array} Array of domain names
   */
  getDomainsFromStorage(address) {
    try {
      const normalizedAddress = address.toLowerCase();
      const key = `domains_${normalizedAddress}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const domains = JSON.parse(stored);
        console.log(`Found ${domains.length} domains from storage for ${normalizedAddress}:`, domains);
        return domains;
      }
      console.log(`No domains in storage for ${normalizedAddress}`);
      return [];
    } catch (error) {
      console.error('Error reading from storage:', error);
      return [];
    }
  }

  /**
   * Save domains to local storage
   * @param {string} address - Wallet address
   * @param {Array} domains - Array of domain names (without .somi)
   */
  saveDomainsToStorage(address, domains) {
    try {
      const normalizedAddress = address.toLowerCase();
      const key = `domains_${normalizedAddress}`;
      // Ensure all domains are without .somi extension
      const cleanDomains = domains.map(d => d.replace(/\.somi$/i, ''));
      localStorage.setItem(key, JSON.stringify(cleanDomains));
      console.log(`Saved ${cleanDomains.length} domains to storage for ${normalizedAddress}:`, cleanDomains);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  /**
   * Add a domain to local storage
   * @param {string} address - Wallet address
   * @param {string} domain - Domain name (without .somi)
   */
  addDomainToStorage(address, domain) {
    // Ensure address is lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Ensure domain is a string
    if (typeof domain !== 'string') {
      domain = String(domain);
    }
    
    // Remove .somi if present
    const cleanDomain = domain.replace(/\.somi$/i, '');
    
    const domains = this.getDomainsFromStorage(normalizedAddress);
    if (!domains.includes(cleanDomain)) {
      domains.push(cleanDomain);
      this.saveDomainsToStorage(normalizedAddress, domains);
      console.log(`Added domain ${cleanDomain} to storage. Total domains:`, domains.length);
    } else {
      console.log(`Domain ${cleanDomain} already in storage`);
    }
  }

  /**
   * Query past Registered events to get user's domains (limited to last 1000 blocks)
   * @param {string} address - Wallet address
   * @returns {Promise<Array>} Array of domain names
   */
  async getDomainsFromEvents(address) {
    try {
      if (!this.registryContract) {
        await this.init();
      }

      // Get current block number
      if (!this.provider) {
        await this.init();
      }
      const currentBlock = await this.provider.getBlockNumber();
      
      // Query in smaller chunks to avoid "block range exceeds" error
      // Try last 500 blocks first, then expand if needed
      let fromBlock = Math.max(0, currentBlock - 500);
      let events = [];
      
      try {
        const filter = this.registryContract.filters.Registered(null, address);
        events = await this.registryContract.queryFilter(filter, fromBlock, currentBlock);
      } catch (error) {
        // If 500 blocks fails, try even smaller chunks
        if (error.message && error.message.includes('block range')) {
          fromBlock = Math.max(0, currentBlock - 100);
          try {
            const filter = this.registryContract.filters.Registered(null, address);
            events = await this.registryContract.queryFilter(filter, fromBlock, currentBlock);
          } catch (smallError) {
            // If even 100 blocks fails, return empty
            return [];
          }
        } else {
          throw error;
        }
      }
      
      const domains = events.map(e => {
        let name = e.args.name;
        // Remove .somi if present
        if (name && name.endsWith('.somi')) {
          name = name.replace(/\.somi$/i, '');
        }
        return name;
      }).filter(name => name && name.length > 0);
      
      // Save to storage for future use
      if (domains.length > 0) {
        this.saveDomainsToStorage(address, domains);
      }
      
      return domains;
    } catch (error) {
      console.error('Error querying events:', error);
      return [];
    }
  }

  /**
   * Get all domains owned by address
   * @param {string} address - Wallet address
   * @returns {Promise<Array>} Array of domain names
   */
  async getDomains(address) {
    try {
      // First, try to get from local storage (fastest and most reliable)
      const storedDomains = this.getDomainsFromStorage(address);
      if (storedDomains.length > 0) {
        console.log('Using domains from storage:', storedDomains);
        // Still try to refresh from contract in background (non-blocking)
        this.tryRefreshDomainsFromContract(address).catch(() => {});
        return storedDomains;
      }

      // If no stored domains, try to get from contract
      return await this.tryRefreshDomainsFromContract(address);
    } catch (error) {
      console.error('DomainService getDomains error:', error);
      // Final fallback: return from storage (might be empty)
      return this.getDomainsFromStorage(address);
    }
  }

  /**
   * Get domains from Somnia API
   * @param {string} address - Wallet address
   * @returns {Promise<Array>} Array of domain names
   */
  async getDomainsFromAPI(address) {
    try {
      // Try GraphQL format first
      const graphqlBody = {
        query: `
          query GetDomains($address: String!) {
            domains(owner: $address) {
              name
              expiry
              isPrimary
            }
          }
        `,
        variables: {
          address: address.toLowerCase()
        }
      };

      // Try REST format as alternative
      const restBody = {
        address: address.toLowerCase(),
        method: 'getDomains'
      };

      // Try JSON-RPC format (most likely based on error response)
      const jsonRpcBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getDomains',
        params: [address.toLowerCase()]
      };

      // Try JSON-RPC first
      let response = await fetch('https://api.infra.mainnet.somnia.network/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonRpcBody)
      });

      let data = await response.json();
      // Only log if there's actual data, not errors
      if (data.result && !data.error) {
        console.log('API response (JSON-RPC):', data);
      }

      // If JSON-RPC doesn't work, try GraphQL
      if (data.error || !data.result) {
        response = await fetch('https://api.infra.mainnet.somnia.network/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(graphqlBody)
        });
        data = await response.json();
        // Only log if there's actual data
        if (data.data && !data.error) {
          console.log('API response (GraphQL):', data);
        }
      }

      // If GraphQL doesn't work, try REST
      if ((data.error || !data.result) && (!data.data || !data.data.domains)) {
        response = await fetch('https://api.infra.mainnet.somnia.network/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(restBody)
        });
        data = await response.json();
        // Only log if there's actual data
        if (data.domains && !data.error) {
          console.log('API response (REST):', data);
        }
      }

      // Parse response
      let domains = [];
      if (data.result && Array.isArray(data.result)) {
        // JSON-RPC format
        domains = data.result.map(d => {
          const name = typeof d === 'string' ? d : (d.name || d);
          return name.replace(/\.somi$/i, '');
        });
      } else if (data.data && data.data.domains) {
        // GraphQL format
        domains = data.data.domains.map(d => d.name.replace(/\.somi$/i, ''));
      } else if (data.domains) {
        // REST format
        domains = data.domains.map(d => {
          const name = typeof d === 'string' ? d : d.name;
          return name.replace(/\.somi$/i, '');
        });
      } else if (Array.isArray(data)) {
        // Direct array
        domains = data.map(d => {
          const name = typeof d === 'string' ? d : d.name;
          return name.replace(/\.somi$/i, '');
        });
      }

      console.log('Found domains from API:', domains);
      if (domains.length > 0) {
        this.saveDomainsToStorage(address, domains);
      }
      return domains;
    } catch (error) {
      console.error('Error fetching domains from API:', error);
      return [];
    }
  }

  /**
   * Try to refresh domains from contract (non-blocking, used in background)
   */
  async tryRefreshDomainsFromContract(address) {
    try {
      // First try API (most reliable)
      try {
        const apiDomains = await this.getDomainsFromAPI(address);
        if (apiDomains.length > 0) {
          return apiDomains;
        }
      } catch (error) {
        console.warn('API request failed:', error.message);
      }

      if (!this.registryContract) {
        await this.init();
      }

      // Try getDomainsOf with mainnet RPC provider (most reliable)
      try {
        if (!this.registryContract) {
          await this.init();
        }
        
        const domains = await this.registryContract.getDomainsOf(address);
        console.log('getDomainsOf result (mainnet RPC):', domains);
        if (domains && domains.length > 0) {
          // Filter out empty strings and remove .somi extension
          const filtered = domains.filter(d => d && d.length > 0).map(d => {
            // Remove .somi if present (contract returns with .somi)
            return d.replace(/\.somi$/i, '');
          });
          console.log('Filtered domains (without .somi):', filtered);
          if (filtered.length > 0) {
            this.saveDomainsToStorage(address, filtered);
            return filtered;
          }
        }
      } catch (error) {
        console.warn('getDomainsOf failed, trying browser provider:', error.message);
        
        // Fallback: Try with browser provider (MetaMask)
        try {
          const browserProvider = SwapService.getBrowserProvider();
          if (browserProvider) {
            const contractWithBrowser = new ethers.Contract(
              this.registryAddress,
              DOMAIN_REGISTRY_ABI,
              browserProvider
            );
            
            const domains = await contractWithBrowser.getDomainsOf(address);
            if (domains && domains.length > 0) {
              const filtered = domains.filter(d => d && d.length > 0).map(d => {
                return d.replace(/\.somi$/i, '');
              });
              if (filtered.length > 0) {
                this.saveDomainsToStorage(address, filtered);
                return filtered;
              }
            }
          }
        } catch (browserError) {
          console.warn('Browser provider also failed:', browserError.message);
        }
      }

      // Try events as last resort
      try {
        const eventDomains = await this.getDomainsFromEvents(address);
        if (eventDomains.length > 0) {
          return eventDomains;
        }
      } catch (error) {
        console.warn('Events query failed:', error.message);
      }

      // Return empty array if all methods fail
      return [];
    } catch (error) {
      console.error('Error refreshing domains from contract:', error);
      return [];
    }
  }

  /**
   * Get primary domain for address
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Primary domain name
   */
  async getPrimaryDomain(address) {
    try {
      // First, try to get from local storage (most reliable)
      const key = `primary_${address.toLowerCase()}`;
      const stored = localStorage.getItem(key);
      if (stored && stored.length > 0) {
        console.log('Using primary from storage:', stored);
        // Try to refresh from contract in background (non-blocking)
        this.tryRefreshPrimaryFromContract(address).catch(() => {});
        return stored;
      }

      // If no stored primary, try to get from contract
      return await this.tryRefreshPrimaryFromContract(address);
    } catch (error) {
      console.error('DomainService getPrimaryDomain error:', error);
      // Fallback: return from storage (might be empty)
      const key = `primary_${address.toLowerCase()}`;
      return localStorage.getItem(key) || '';
    }
  }

  /**
   * Get primary domain from Somnia API
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Primary domain name
   */
  async getPrimaryFromAPI(address) {
    try {
      // Get all domains and find primary
      const domains = await this.getDomainsFromAPI(address);
      
      // Try to get primary from API response
      const graphqlBody = {
        query: `
          query GetPrimary($address: String!) {
            domains(owner: $address, isPrimary: true) {
              name
            }
          }
        `,
        variables: {
          address: address.toLowerCase()
        }
      };

      const response = await fetch('https://api.infra.mainnet.somnia.network/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlBody)
      });

      const data = await response.json();
      // Only log if there's actual data, not errors
      if (data.data && !data.error) {
        console.log('Primary API response:', data);
      }

      let primary = '';
      if (data.data && data.data.domains && data.data.domains.length > 0) {
        primary = data.data.domains[0].name.replace(/\.somi$/i, '');
      } else if (data.primary) {
        primary = typeof data.primary === 'string' ? data.primary : data.primary.name;
        primary = primary.replace(/\.somi$/i, '');
      }

      if (primary) {
        const key = `primary_${address.toLowerCase()}`;
        localStorage.setItem(key, primary);
      }

      return primary;
    } catch (error) {
      console.error('Error fetching primary from API:', error);
      return '';
    }
  }

  /**
   * Try to refresh primary domain from contract (non-blocking, used in background)
   */
  async tryRefreshPrimaryFromContract(address) {
    try {
      // First try API (most reliable)
      try {
        const apiPrimary = await this.getPrimaryFromAPI(address);
        if (apiPrimary) {
          return apiPrimary;
        }
      } catch (error) {
        console.warn('Primary API request failed:', error.message);
      }

      if (!this.registryContract) {
        await this.init();
      }

      const key = `primary_${address.toLowerCase()}`;

      // Try getPrimary with mainnet RPC provider (most reliable)
      try {
        if (!this.registryContract) {
          await this.init();
        }
        
        const primary = await this.registryContract.getPrimary(address);
        console.log('getPrimary result (mainnet RPC):', primary);
        if (primary && primary.length > 0) {
          // Remove .somi if present
          const cleanPrimary = primary.replace(/\.somi$/i, '');
          localStorage.setItem(key, cleanPrimary);
          return cleanPrimary;
        }
      } catch (error) {
        console.warn('getPrimary failed, trying browser provider:', error.message);
        
        // Fallback: Try with browser provider (MetaMask)
        try {
          const browserProvider = SwapService.getBrowserProvider();
          if (browserProvider) {
            const contractWithBrowser = new ethers.Contract(
              this.registryAddress,
              DOMAIN_REGISTRY_ABI,
              browserProvider
            );
            
            const primary = await contractWithBrowser.getPrimary(address);
            if (primary && primary.length > 0) {
              const cleanPrimary = primary.replace(/\.somi$/i, '');
              localStorage.setItem(key, cleanPrimary);
              return cleanPrimary;
            }
          }
        } catch (browserError) {
          console.warn('Browser provider also failed:', browserError.message);
        }
      }

      // Try primaryName mapping
      try {
        const primary = await this.registryContract.primaryName(address);
        if (primary && primary.length > 0 && primary !== '0x') {
          // Remove .somi if present
          const cleanPrimary = primary.replace(/\.somi$/i, '');
          localStorage.setItem(key, cleanPrimary);
          return cleanPrimary;
        }
      } catch (error) {
        // Silently fail
      }

      return '';
    } catch (error) {
      console.error('Error refreshing primary from contract:', error);
      return '';
    }
  }

  /**
   * Get domain expiry timestamp
   * @param {string} domainName - Domain name without .somi
   * @returns {Promise<number>} Expiry timestamp
   */
  async getExpiry(domainName) {
    try {
      if (!this.registryContract) {
        await this.init();
      }

      // Remove .somi if present and convert to lowercase
      const cleanName = domainName.replace(/\.somi$/i, '').toLowerCase();
      
      // Try with mainnet RPC provider first (most reliable)
      try {
        const domainInfo = await this.registryContract.domains(cleanName);
        console.log('Domain info for', cleanName, ' (mainnet RPC):', domainInfo);
        
        if (domainInfo && domainInfo.length >= 2) {
          // domainInfo is a tuple: [owner, expiry]
          const expiry = domainInfo[1];
          return Number(expiry);
        }
      } catch (rpcError) {
        console.warn('getExpiry failed with mainnet RPC, trying browser provider:', rpcError.message);
        
        // Fallback to browser provider
        try {
          const browserProvider = SwapService.getBrowserProvider();
          if (browserProvider) {
            const contractWithBrowser = new ethers.Contract(
              this.registryAddress,
              DOMAIN_REGISTRY_ABI,
              browserProvider
            );
            
            const domainInfo = await contractWithBrowser.domains(cleanName);
            if (domainInfo && domainInfo.length >= 2) {
              const expiry = domainInfo[1];
              return Number(expiry);
            }
          }
        } catch (browserError) {
          console.warn('getExpiry failed with browser provider:', browserError.message);
        }
      }
      
      // If both fail, return 0 (unknown expiry)
      return 0;
    } catch (error) {
      console.error('DomainService getExpiry error:', error);
      return 0;
    }
  }

  /**
   * Renew domain
   * @param {string} domainName - Domain name without .somi
   * @returns {Promise<Object>} Transaction receipt
   */
  async renew(domainName) {
    try {
      const signer = await SwapService.getSigner();
      if (!signer) {
        throw new Error('No signer available. Please connect wallet.');
      }

      // Ensure we're on mainnet
      await this.switchToMainnet();

      if (!this.registryContract) {
        await this.init();
      }

      // Remove .somi if present and convert to lowercase
      const cleanName = domainName.replace(/\.somi$/i, '').toLowerCase();

      // Get contract with signer
      const registryWithSigner = new ethers.Contract(
        this.registryAddress,
        DOMAIN_REGISTRY_ABI,
        signer
      );

      // Renew domain - 5 SOMI cost
      const cost = ethers.parseEther('5');
      
      console.log(`Renewing domain: ${cleanName}.somi`);
      console.log(`Cost: 5 SOMI`);

      const tx = await registryWithSigner.renew(cleanName, {
        value: cost,
        gasPrice: ethers.parseUnits('6', 'gwei')
      });

      console.log('Renewal transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Domain renewed successfully:', receipt);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (error) {
      console.error('DomainService renew error:', error);
      throw error;
    }
  }
}

// Singleton instance
export const domainService = new DomainService();

