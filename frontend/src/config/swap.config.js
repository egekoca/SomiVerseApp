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
    STT: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native token placeholder
    WSTT: '0xF22eF0085f6511f70b01a68F360dCc56261F768a', // Wrapped STT
    USDT: '0xDa4FDE38bE7a2b959BF46E032ECfA21e64019b76', // USDT on Somnia
    USDC: '0x0000000000000000000000000000000000000000', // USDC placeholder
    WETH: '0x0000000000000000000000000000000000000000'  // WETH placeholder
  },
  
  // Token display info
  tokenInfo: {
    STT: { symbol: 'STT', name: 'Somnia Token', icon: '◈', decimals: 18 },
    WSTT: { symbol: 'WSTT', name: 'Wrapped STT', icon: '◈', decimals: 18 },
    USDT: { symbol: 'USDT', name: 'Tether USD', icon: '$', decimals: 18 }
  },
  
  // Supported swap pairs (for UI dropdown)
  // Only tokens with valid addresses on Somnia Testnet
  supportedTokens: ['STT', 'USDT'],
  
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
    'USDT-STT': 0.285    // 1 USDT = 0.285 STT
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

export default SWAP_CONFIG;

