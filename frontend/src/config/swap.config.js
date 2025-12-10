/**
 * Swap Configuration
 * Token addresses, router address, and ABIs for Somnia Network
 */

export const SWAP_CONFIG = {
  // Uniswap V2 Router address on Somnia Testnet
  // Factory address is fetched dynamically from router.factory()
  router: '0x8779b407ab9B91901df322B7d4226a3a059ABe76',
  
  // Token addresses (Somnia Testnet)
  tokens: {
    STT: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native token placeholder (Testnet)
    WSTT: '0xF22eF0085f6511f70b01a68F360dCc56261F768a', // Wrapped STT (Testnet)
    USDT: '0xDa4FDE38bE7a2b959BF46E032ECfA21e64019b76', // USDT on Somnia (Testnet)
    USDC: '0x0000000000000000000000000000000000000000', // USDC placeholder
    WETH: '0x0000000000000000000000000000000000000000', // WETH placeholder
    // Mainnet tokens
    SOMI: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native SOMI (Mainnet)
    WSOMI: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab' // Wrapped SOMI (Mainnet) - WETH9 contract
  },
  
  // WETH9 contract for wrapping native SOMI to WSOMI (Mainnet)
  weth9Contract: '0x046EDe9564A72571df6F5e44d0405360c0f4dCab',
  
  // Token display info
  tokenInfo: {
    STT: { 
      symbol: 'STT', 
      name: 'Somnia Token', 
      icon: 'S', 
      decimals: 18,
      network: 'testnet',
      logo: '/somniablack.png', // Will be grayed out for testnet
      chainLogo: '/somniablack.png' // Will be grayed out
    },
    WSTT: { 
      symbol: 'WSTT', 
      name: 'Wrapped STT', 
      icon: '◈', 
      decimals: 18,
      network: 'testnet'
    },
    USDT: { 
      symbol: 'USDT', 
      name: 'Tether USD', 
      icon: 'U', 
      decimals: 18,
      network: 'testnet',
      logo: '/somniablack.png', // Will be grayed out for testnet
      chainLogo: '/somniablack.png' // Will be grayed out
    },
    SOMI: { 
      symbol: 'SOMI', 
      name: 'Somnia Token', 
      icon: '◈', 
      decimals: 18,
      network: 'mainnet',
      logo: '/somniablack.png',
      chainLogo: '/somniablack.png'
    },
    WSOMI: { 
      symbol: 'WSOMI', 
      name: 'Wrapped Somnia Token', 
      icon: '◈', 
      decimals: 18,
      network: 'mainnet',
      logo: '/somniablack.png',
      chainLogo: '/somniablack.png'
    }
  },
  
  // Supported swap pairs (for UI dropdown)
  // Testnet: STT ↔ USDT
  // Mainnet: SOMI ↔ WSOMI (wrapping)
  supportedTokens: ['STT', 'USDT', 'SOMI', 'WSOMI'],
  
  // Swap settings
  settings: {
    slippageTolerance: 0.15, // 15% slippage (balanced for production)
    deadline: 600, // 10 minutes
    fee: 0.003, // 0.3% swap fee
    xpReward: 50 // XP reward for successful swap
  },
  
  // Fallback rates (when router query fails)
  // Based on actual swap: 2 STT → 7.08 USDT (1 STT ≈ 3.54 USDT)
  fallbackRates: {
    'STT-USDT': 3.5,     // 1 STT = 3.5 USDT
    'USDT-STT': 0.285,   // 1 USDT = 0.285 STT
    'SOMI-WSOMI': 1.0,   // 1 SOMI = 1 WSOMI (1:1 wrapping)
    'WSOMI-SOMI': 1.0    // 1 WSOMI = 1 SOMI (1:1 unwrapping)
  }
};

// ERC20 ABI (minimal for swap operations)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

// Uniswap V2 Factory ABI (minimal)
export const UNISWAP_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns (address pair)',
  'function allPairs(uint256) view returns (address pair)',
  'function allPairsLength() view returns (uint256)'
];

// Uniswap V2 Pair ABI (minimal)
export const UNISWAP_PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)'
];

// Uniswap V2 Router ABI (minimal for swap operations)
export const UNISWAP_ROUTER_ABI = [
  // Read functions
  'function factory() view returns (address)',
  'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] memory path) view returns (uint[] memory amounts)',
  'function WETH() view returns (address)',
  
  // Swap functions
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountIn, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)'
];

// WETH9 ABI (for wrapping/unwrapping native tokens)
export const WETH9_ABI = [
  'function deposit() payable returns (uint256)',
  'function withdraw(uint256 amount) returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)'
];

export default SWAP_CONFIG;

