/**
 * SwapService
 * Handles token swaps via Uniswap V2 Router on Somnia Network
 */
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/network.config.js';
import { SWAP_CONFIG, ERC20_ABI, UNISWAP_ROUTER_ABI, UNISWAP_FACTORY_ABI, UNISWAP_PAIR_ABI, WETH9_ABI } from '../config/swap.config.js';
import { ProfileService } from './ProfileService.js';

class SwapServiceClass {
  constructor() {
    this.isInitialized = false;
    this.provider = null;
    this.signer = null;
    this.routerContract = null;
  }

  /**
   * Initialize the swap service
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      // Create read-only provider for quotes
      this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('SwapService init error:', error);
      return false;
    }
  }

  /**
   * Get read-only provider (always uses Somnia RPC)
   * For balance checks and quotes - ensures correct network
   */
  getProvider() {
    // Always use Somnia RPC for read operations to ensure correct network
    return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  }
  
  /**
   * Get browser provider (MetaMask) for transactions
   */
  getBrowserProvider() {
    if (window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }

  /**
   * Get signer from connected wallet (for transactions)
   */
  async getSigner() {
    const browserProvider = this.getBrowserProvider();
    if (!browserProvider) {
      throw new Error('No wallet detected');
    }
    return await browserProvider.getSigner();
  }

  /**
   * Get connected wallet address
   */
  async getWalletAddress() {
    if (!window.ethereum) return null;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token address from symbol (with checksum validation)
   */
  getTokenAddress(symbol) {
    const address = SWAP_CONFIG.tokens[symbol];
    if (!address) return null;
    
    // Native token placeholder doesn't need checksum
    if (address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      return address;
    }
    
    // Convert to checksum address
    try {
      return ethers.getAddress(address);
    } catch (e) {
      console.warn(`Invalid address for ${symbol}:`, address);
      return address;
    }
  }

  /**
   * Check if token is native (STT)
   */
  isNativeToken(symbol) {
    return symbol === 'STT' || symbol === 'WSTT';
  }

  /**
   * Get user's token balance
   * @param {string} tokenSymbol - Token symbol (STT, USDT, SOMI, WSOMI, etc.)
   * @param {string} userAddress - User wallet address
   */
  async getBalance(tokenSymbol, userAddress) {
    if (!userAddress) return '0';

    try {
      // Determine which network/provider to use based on token
      const isMainnet = await this.isMainnet();
      let provider;
      
      // Mainnet tokens (SOMI, WSOMI) use mainnet RPC
      if (tokenSymbol === 'SOMI' || tokenSymbol === 'WSOMI') {
        provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network');
      } 
      // Testnet tokens (STT, USDT) use testnet RPC
      else if (tokenSymbol === 'STT' || tokenSymbol === 'USDT') {
        provider = this.getProvider(); // Testnet RPC
      } else {
        // Unknown token, try to determine from network
        if (isMainnet) {
          provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network');
        } else {
          provider = this.getProvider();
        }
      }

      // Native tokens (STT on testnet, SOMI on mainnet)
      if (tokenSymbol === 'STT' || tokenSymbol === 'SOMI') {
        // Native token balance
        const balance = await provider.getBalance(userAddress);
        return ethers.formatUnits(balance, 18);
      } else {
        // ERC20 token balance
        const tokenAddress = this.getTokenAddress(tokenSymbol);
        if (!tokenAddress) return '0';
        
        // Skip if placeholder address
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
          return '0';
        }

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        
        // Check if contract exists by getting code
        const code = await provider.getCode(tokenAddress);
        if (code === '0x' || code === '0x0') {
          // Contract doesn't exist at this address
          return '0';
        }
        
        const balance = await tokenContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, 18);
      }
    } catch (error) {
      // Silently return 0 for any balance errors
      return '0';
    }
  }

  /**
   * Get rate from pool reserves
   * @param {string} tokenInAddress - Input token address
   * @param {string} tokenOutAddress - Output token address
   */
  async getRateFromPool(tokenInAddress, tokenOutAddress) {
    try {
      const provider = this.getProvider();
      
      // Skip if either token is placeholder
      if (tokenInAddress === '0x0000000000000000000000000000000000000000' ||
          tokenOutAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      // Get factory address from router dynamically
      const routerAddress = ethers.getAddress(SWAP_CONFIG.router);
      
      // Check if router contract exists
      const routerCode = await provider.getCode(routerAddress);
      if (routerCode === '0x' || routerCode === '0x0') {
        return null;
      }
      
      const routerContract = new ethers.Contract(
        routerAddress,
        UNISWAP_ROUTER_ABI,
        provider
      );
      
      // Router has factory() function that returns the factory address
      const factoryAddress = await routerContract.factory();
      
      const factoryContract = new ethers.Contract(
        factoryAddress,
        UNISWAP_FACTORY_ABI,
        provider
      );

      // Get pair address
      const pairAddress = await factoryContract.getPair(tokenInAddress, tokenOutAddress);
      
      // Check if pair exists
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get pair contract
      const pairContract = new ethers.Contract(
        pairAddress,
        UNISWAP_PAIR_ABI,
        provider
      );

      // Get reserves
      const [reserve0, reserve1] = await pairContract.getReserves();
      const token0 = await pairContract.token0();

      // Calculate rate based on token order
      let rate;
      if (token0.toLowerCase() === tokenInAddress.toLowerCase()) {
        // tokenIn is token0, so rate = reserve1 / reserve0
        rate = Number(reserve1) / Number(reserve0);
      } else {
        // tokenIn is token1, so rate = reserve0 / reserve1
        rate = Number(reserve0) / Number(reserve1);
      }

      return rate;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get swap quote from router or pool
   * @param {string} fromToken - Source token symbol
   * @param {string} toToken - Destination token symbol
   * @param {string} amount - Input amount
   */
  async getSwapQuote(fromToken, toToken, amount) {
    await this.init();

    const tokenInAddress = this.getTokenAddress(fromToken === 'STT' ? 'WSTT' : fromToken);
    const tokenOutAddress = this.getTokenAddress(toToken === 'STT' ? 'WSTT' : toToken);

    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error('Token not supported');
    }

    if (tokenInAddress === tokenOutAddress) {
      throw new Error('Cannot swap same token');
    }

    const provider = this.getProvider();
    const routerAddress = ethers.getAddress(SWAP_CONFIG.router);
    const routerContract = new ethers.Contract(
      routerAddress,
      UNISWAP_ROUTER_ABI,
      provider
    );

    const amountIn = ethers.parseUnits(amount.toString(), 18);
    const path = [tokenInAddress, tokenOutAddress];

    try {
      // Try to get quote from router
      const amounts = await routerContract.getAmountsOut(amountIn, path);
      const outputAmount = ethers.formatUnits(amounts[1], 18);
      const rate = (parseFloat(outputAmount) / parseFloat(amount)).toFixed(4);
      const feeAmount = parseFloat(amount) * SWAP_CONFIG.settings.fee;

      return {
        fromToken,
        toToken,
        inputAmount: amount,
        outputAmount: parseFloat(outputAmount).toFixed(4),
        rate,
        priceImpact: '< 0.5%',
        fee: feeAmount.toFixed(4),
        estimated: false
      };
    } catch (routerError) {
      // Router failed, try to get rate from pool reserves
      const poolRate = await this.getRateFromPool(tokenInAddress, tokenOutAddress);
      
      let estimatedRate;
      if (poolRate !== null) {
        // Use pool rate from reserves
        estimatedRate = poolRate;
      } else {
        // Fallback to configured rates
        const pairKey = `${fromToken}-${toToken}`;
        const reversePairKey = `${toToken}-${fromToken}`;
        
        estimatedRate = SWAP_CONFIG.fallbackRates[pairKey];
        if (!estimatedRate && SWAP_CONFIG.fallbackRates[reversePairKey]) {
          estimatedRate = 1 / SWAP_CONFIG.fallbackRates[reversePairKey];
        }
        estimatedRate = estimatedRate || 1.0;
      }

      const outputAmount = (parseFloat(amount) * estimatedRate * (1 - SWAP_CONFIG.settings.fee)).toFixed(4);
      const feeAmount = (parseFloat(amount) * SWAP_CONFIG.settings.fee).toFixed(4);

      return {
        fromToken,
        toToken,
        inputAmount: amount,
        outputAmount,
        rate: estimatedRate.toFixed(4),
        priceImpact: '< 10%',
        fee: feeAmount,
        estimated: true
      };
    }
  }

  /**
   * Check if MetaMask is on correct network (Somnia)
   */
  async checkNetwork() {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }
    
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainIdHex, 16);
    
    if (currentChainId !== NETWORK_CONFIG.chainId) {
      // Try to switch network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + NETWORK_CONFIG.chainId.toString(16) }]
        });
      } catch (switchError) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + NETWORK_CONFIG.chainId.toString(16),
              chainName: NETWORK_CONFIG.chainName,
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              nativeCurrency: NETWORK_CONFIG.nativeCurrency,
              blockExplorerUrls: [NETWORK_CONFIG.blockExplorer]
            }]
          });
        } else {
          throw new Error('Please switch to Somnia Testnet in your wallet');
        }
      }
    }
    return true;
  }

  /**
   * Execute token swap
   * @param {string} fromToken - Source token symbol
   * @param {string} toToken - Destination token symbol
   * @param {string} amount - Amount to swap
   */
  async swapTokens(fromToken, toToken, amount) {
    // Check wallet connection
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    // Ensure MetaMask is on Somnia network
    await this.checkNetwork();

    const signer = await this.getSigner();
    
    const tokenInAddress = this.getTokenAddress(fromToken === 'STT' ? 'WSTT' : fromToken);
    const tokenOutAddress = this.getTokenAddress(toToken === 'STT' ? 'WSTT' : toToken);

    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error('Token not supported');
    }

    const amountIn = ethers.parseUnits(amount.toString(), 18);

    // Check balance using Somnia RPC (not MetaMask's network)
    const somniaProvider = this.getProvider();
    
    if (fromToken === 'STT') {
      const balance = await somniaProvider.getBalance(userAddress);
      if (balance < amountIn) {
        throw new Error('Insufficient STT balance');
      }
    } else {
      const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, somniaProvider);
      const balance = await tokenContract.balanceOf(userAddress);
      if (balance < amountIn) {
        throw new Error(`Insufficient ${fromToken} balance`);
      }
    }

    // Get quote for minimum output calculation
    const quote = await this.getSwapQuote(fromToken, toToken, amount);
    const minAmountOut = ethers.parseUnits(
      (parseFloat(quote.outputAmount) * (1 - SWAP_CONFIG.settings.slippageTolerance)).toFixed(18),
      18
    );

    const deadline = Math.floor(Date.now() / 1000) + SWAP_CONFIG.settings.deadline;
    const path = [tokenInAddress, tokenOutAddress];

    const routerAddress = ethers.getAddress(SWAP_CONFIG.router);
    const routerContract = new ethers.Contract(
      routerAddress,
      UNISWAP_ROUTER_ABI,
      signer
    );

    let swapTx;

    try {
      if (fromToken === 'STT') {
        // Native STT → Token
        swapTx = await routerContract.swapExactETHForTokens(
          minAmountOut,
          path,
          userAddress,
          deadline,
          { value: amountIn }
        );
      } else if (toToken === 'STT') {
        // Token → Native STT
        // First, check and approve if needed
        const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
        const currentAllowance = await tokenContract.allowance(userAddress, routerAddress);

        if (currentAllowance < amountIn) {
          const approveTx = await tokenContract.approve(routerAddress, amountIn);
          await approveTx.wait();
        }

        swapTx = await routerContract.swapExactTokensForETH(
          amountIn,
          minAmountOut,
          path,
          userAddress,
          deadline
        );
      } else {
        // Token → Token
        // First, check and approve if needed
        const tokenContract = new ethers.Contract(tokenInAddress, ERC20_ABI, signer);
        const currentAllowance = await tokenContract.allowance(userAddress, routerAddress);

        if (currentAllowance < amountIn) {
          const approveTx = await tokenContract.approve(routerAddress, amountIn);
          await approveTx.wait();
        }

        swapTx = await routerContract.swapExactTokensForTokens(
          amountIn,
          minAmountOut,
          path,
          userAddress,
          deadline
        );
      }

      // Wait for confirmation
      const receipt = await swapTx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Add XP reward
      const xpReward = SWAP_CONFIG.settings.xpReward;
      ProfileService.addXP(userAddress, xpReward);
      ProfileService.updateStats(userAddress, 'swapsCompleted');

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('swapCompleted', {
        detail: {
          fromToken,
          toToken,
          amount,
          outputAmount: quote.outputAmount,
          txHash: swapTx.hash,
          xpReward
        }
      }));

      return {
        success: true,
        message: `Successfully swapped ${amount} ${fromToken} to ${quote.outputAmount} ${toToken}!`,
        txHash: swapTx.hash,
        outputAmount: quote.outputAmount
      };

    } catch (error) {
      console.error('Swap error:', error);

      // Parse error message for user-friendly display
      let message = error.message;
      if (message.includes('insufficient funds')) {
        message = 'Insufficient funds for gas';
      } else if (message.includes('user rejected')) {
        message = 'Transaction rejected by user';
      } else if (message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        message = 'Price changed too much. Try increasing slippage.';
      } else if (message.includes('EXPIRED')) {
        message = 'Transaction expired. Please try again.';
      }

      throw new Error(message);
    }
  }

  /**
   * Get supported tokens list (filtered by network)
   */
  async getSupportedTokens() {
    // Return all tokens (mainnet and testnet) - user will select in popup
    const tokens = ['SOMI', 'WSOMI', 'STT', 'USDT'];
    
    return tokens.map(symbol => ({
      symbol,
      ...SWAP_CONFIG.tokenInfo[symbol]
    }));
  }
  
  /**
   * Get token balance based on network
   * @param {string} tokenSymbol - Token symbol
   * @param {string} userAddress - User wallet address
   */
  async getTokenBalance(tokenSymbol, userAddress) {
    if (!userAddress) return '0';
    
    try {
      const tokenInfo = SWAP_CONFIG.tokenInfo[tokenSymbol];
      if (!tokenInfo) return '0';
      
      // Use appropriate provider based on network
      let provider;
      if (tokenInfo.network === 'mainnet') {
        provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network');
      } else {
        provider = this.getProvider(); // Testnet RPC
      }
      
      // Native tokens
      if (tokenSymbol === 'STT' || tokenSymbol === 'SOMI') {
        const balance = await provider.getBalance(userAddress);
        return ethers.formatUnits(balance, 18);
      } else {
        // ERC20 tokens
        const tokenAddress = this.getTokenAddress(tokenSymbol);
        if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
          return '0';
        }
        
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, tokenInfo.decimals || 18);
      }
    } catch (error) {
      console.error(`Error getting balance for ${tokenSymbol}:`, error);
      return '0';
    }
  }

  /**
   * Get swap settings
   */
  getSettings() {
    return SWAP_CONFIG.settings;
  }

  /**
   * Check if current network is mainnet (chainId 5031)
   */
  async isMainnet() {
    if (!window.ethereum) return false;
    try {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      return currentChainId === 5031; // Somnia Mainnet
    } catch (error) {
      return false;
    }
  }

  /**
   * Wrap native SOMI to WSOMI (Mainnet only)
   * @param {string} amount - Amount of SOMI to wrap
   */
  async wrapSOMI(amount) {
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    // Ensure MetaMask is on Somnia Mainnet (will switch automatically if needed)
    const targetChainId = 5031;
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainIdHex, 16);

    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + targetChainId.toString(16) }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + targetChainId.toString(16),
              chainName: 'Somnia Mainnet',
              rpcUrls: ['https://api.infra.mainnet.somnia.network'],
              nativeCurrency: {
                name: 'Somnia Token',
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

    const signer = await this.getSigner();
    const weth9Address = ethers.getAddress(SWAP_CONFIG.weth9Contract);
    const weth9Contract = new ethers.Contract(weth9Address, WETH9_ABI, signer);

    const amountIn = ethers.parseUnits(amount.toString(), 18);

    // Check native SOMI balance
    const provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network');
    const balance = await provider.getBalance(userAddress);
    if (balance < amountIn) {
      throw new Error('Insufficient SOMI balance');
    }

    try {
      // Call deposit() function with native SOMI as value
      const wrapTx = await weth9Contract.deposit({
        value: amountIn
      });

      // Wait for confirmation
      const receipt = await wrapTx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Add XP reward
      const xpReward = SWAP_CONFIG.settings.xpReward;
      ProfileService.addXP(userAddress, xpReward);
      ProfileService.updateStats(userAddress, 'swapsCompleted');

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('swapCompleted', {
        detail: {
          fromToken: 'SOMI',
          toToken: 'WSOMI',
          amount,
          outputAmount: amount, // 1:1 wrapping
          txHash: wrapTx.hash,
          xpReward
        }
      }));

      return {
        success: true,
        message: `Successfully wrapped ${amount} SOMI to ${amount} WSOMI!`,
        txHash: wrapTx.hash,
        outputAmount: amount
      };

    } catch (error) {
      console.error('Wrap error:', error);

      let message = error.message;
      if (message.includes('insufficient funds')) {
        message = 'Insufficient funds for gas';
      } else if (message.includes('user rejected')) {
        message = 'Transaction rejected by user';
      }

      throw new Error(message);
    }
  }

  /**
   * Unwrap WSOMI to native SOMI (Mainnet only)
   * @param {string} amount - Amount of WSOMI to unwrap
   */
  async unwrapWSOMI(amount) {
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    // Ensure MetaMask is on Somnia Mainnet (will switch automatically if needed)
    const targetChainId = 5031;
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }

    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainIdHex, 16);

    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + targetChainId.toString(16) }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x' + targetChainId.toString(16),
              chainName: 'Somnia Mainnet',
              rpcUrls: ['https://api.infra.mainnet.somnia.network'],
              nativeCurrency: {
                name: 'Somnia Token',
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

    const signer = await this.getSigner();
    const weth9Address = ethers.getAddress(SWAP_CONFIG.weth9Contract);
    const weth9Contract = new ethers.Contract(weth9Address, WETH9_ABI, signer);

    const amountIn = ethers.parseUnits(amount.toString(), 18);

    // Check WSOMI balance
    const provider = new ethers.JsonRpcProvider('https://api.infra.mainnet.somnia.network');
    const balance = await weth9Contract.balanceOf(userAddress);
    if (balance < amountIn) {
      throw new Error('Insufficient WSOMI balance');
    }

    try {
      // Call withdraw() function
      const unwrapTx = await weth9Contract.withdraw(amountIn);

      // Wait for confirmation
      const receipt = await unwrapTx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Add XP reward
      const xpReward = SWAP_CONFIG.settings.xpReward;
      ProfileService.addXP(userAddress, xpReward);
      ProfileService.updateStats(userAddress, 'swapsCompleted');

      // Dispatch success event
      window.dispatchEvent(new CustomEvent('swapCompleted', {
        detail: {
          fromToken: 'WSOMI',
          toToken: 'SOMI',
          amount,
          outputAmount: amount, // 1:1 unwrapping
          txHash: unwrapTx.hash,
          xpReward
        }
      }));

      return {
        success: true,
        message: `Successfully unwrapped ${amount} WSOMI to ${amount} SOMI!`,
        txHash: unwrapTx.hash,
        outputAmount: amount
      };

    } catch (error) {
      console.error('Unwrap error:', error);

      let message = error.message;
      if (message.includes('insufficient funds')) {
        message = 'Insufficient funds for gas';
      } else if (message.includes('user rejected')) {
        message = 'Transaction rejected by user';
      }

      throw new Error(message);
    }
  }
}

// Singleton instance
export const SwapService = new SwapServiceClass();
export default SwapService;

