/**
 * Domain Service Configuration
 * Somnia Domain Service (.somi) contract addresses and ABIs
 */

export const DOMAIN_CONFIG = {
  // Somnia Mainnet
  mainnet: {
    registry: '0x611D77150354Fc327803484359527478e0E7CC63',
    chainId: 5031
  },
  
  // Somnia Testnet (if needed)
  testnet: {
    registry: '0x611D77150354Fc327803484359527478e0E7CC63', // Same for now
    chainId: 50312
  }
};

// SomiNameRegistryV2 ABI (from verified contract)
export const DOMAIN_REGISTRY_ABI = [
  // Register domain (requires years parameter)
  {
    inputs: [
      { internalType: 'string', name: 'rawName', type: 'string' },
      { internalType: 'uint8', name: 'years_', type: 'uint8' }
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  
  // Set primary domain
  {
    inputs: [
      { internalType: 'string', name: 'rawName', type: 'string' }
    ],
    name: 'setPrimary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Clear primary domain
  {
    inputs: [],
    name: 'clearPrimary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  
  // Get primary domain
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' }
    ],
    name: 'getPrimary',
    outputs: [
      { internalType: 'string', name: '', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Get domain info (owner and expiry)
  {
    inputs: [
      { internalType: 'string', name: '', type: 'string' }
    ],
    name: 'domains',
    outputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'expiry', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Get all domains owned by address
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' }
    ],
    name: 'getDomainsOf',
    outputs: [
      { internalType: 'string[]', name: '', type: 'string[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Get price for years
  {
    inputs: [
      { internalType: 'uint8', name: 'years_', type: 'uint8' }
    ],
    name: 'getPrice',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Renew domain
  {
    inputs: [
      { internalType: 'string', name: 'rawName', type: 'string' },
      { internalType: 'uint8', name: 'years_', type: 'uint8' }
    ],
    name: 'renew',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  
  // Primary name mapping
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' }
    ],
    name: 'primaryName',
    outputs: [
      { internalType: 'string', name: '', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Owned names mapping
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    name: 'ownedNames',
    outputs: [
      { internalType: 'string', name: '', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Owned names index mapping
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'string', name: '', type: 'string' }
    ],
    name: 'ownedNamesIndex',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  
  // Registered event
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'name', type: 'string' },
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'expiry', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'payment', type: 'uint256' }
    ],
    name: 'Registered',
    type: 'event'
  }
];

export default DOMAIN_CONFIG;

