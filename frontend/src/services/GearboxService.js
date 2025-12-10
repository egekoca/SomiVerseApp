/**
 * GearboxService
 * Handles lending operations via Gearbox Protocol
 * 
 * Features:
 * - Deposit assets to earn passive yield
 * - Withdraw deposited assets
 * - View pool APY and statistics
 * - Single-asset deposits (no impermanent loss)
 */
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../config/network.config.js';
import { GEARBOX_CONFIG, GEARBOX_CREDIT_FACADE_ABI, GEARBOX_CREDIT_MANAGER_ABI, GEARBOX_POOL_ABI, WETH_ABI, ERC20_ABI } from '../config/gearbox.config.js';
import { ProfileService } from './ProfileService.js';

class GearboxServiceClass {
  constructor() {
    this.isInitialized = false;
    this.provider = null;
    this.isGearboxAvailable = false; // Check if Gearbox is deployed on Somnia
    this.contractAddresses = {
      creditManager: null,
      creditFacade: null,
      poolService: null
    };
  }

  /**
   * Initialize the Gearbox service
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      // Create read-only provider
      // Gearbox is on Somnia Mainnet (chainId 5031), use mainnet RPC
      const mainnetRpcUrl = 'https://api.infra.mainnet.somnia.network'; // Mainnet RPC
      this.provider = new ethers.JsonRpcProvider(mainnetRpcUrl);
      
      // Check if Gearbox is available on Somnia
      // Try to find Gearbox contracts on Somnia
      // Contract addresses should be set in gearbox.config.js
      // If not set, we'll try to detect them or use mock data
      this.isGearboxAvailable = await this.detectGearboxContracts();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('GearboxService init error:', error);
      return false;
    }
  }

  /**
   * Get read-only provider
   * Uses mainnet RPC for Gearbox (chainId 5031) since Gearbox is deployed on mainnet
   */
  getProvider() {
    // Gearbox is on Somnia Mainnet (chainId 5031), not testnet
    // Use mainnet RPC URL from MetaMask network config
    const mainnetRpcUrl = 'https://api.infra.mainnet.somnia.network'; // Mainnet RPC
    return new ethers.JsonRpcProvider(mainnetRpcUrl);
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
   * Get signer from connected wallet
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
   * Check if MetaMask is on correct network
   * Gearbox is on Somnia Mainnet (chainId 5031)
   */
  async checkNetwork() {
    if (!window.ethereum) {
      throw new Error('No wallet detected');
    }
    
    // Gearbox is on Somnia Mainnet (chainId 5031)
    const targetChainId = 5031;
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
    return true;
  }

  /**
   * Detect Gearbox contracts on Somnia
   * Checks if addresses are configured or tries to find them from pool
   */
  async detectGearboxContracts() {
    // Check if pool address is configured
    if (GEARBOX_CONFIG.poolAddress) {
      try {
        // Pool contract is available - we can use it directly
        // Credit Manager is not needed for lending operations (deposit/withdraw)
        this.contractAddresses.poolService = GEARBOX_CONFIG.poolAddress;
        
        // Try to get Credit Manager (optional - may not exist on this pool)
        try {
          const poolContract = new ethers.Contract(
            GEARBOX_CONFIG.poolAddress,
            GEARBOX_POOL_ABI,
            this.provider
          );
          
          // Check if contract exists
          const code = await this.provider.getCode(GEARBOX_CONFIG.poolAddress);
          if (code === '0x' || code === '0x0') {
            return false;
          }
          
          // Try to get credit manager (may fail if function doesn't exist)
          try {
            const creditManagerAddress = await poolContract.creditManager();
            if (creditManagerAddress && creditManagerAddress !== ethers.ZeroAddress) {
              this.contractAddresses.creditManager = creditManagerAddress;
            }
          } catch (e) {
            // creditManager() function may not exist - that's okay
            // We can still use the pool directly
          }
        } catch (e) {
          // Pool contract query failed - continue anyway
        }
        
        return true;
      } catch (error) {
        console.error('Error detecting Gearbox contracts:', error);
        return false;
      }
    }

    // Check if addresses are manually configured
    if (GEARBOX_CONFIG.creditManager || GEARBOX_CONFIG.creditFacade || GEARBOX_CONFIG.poolService) {
      this.contractAddresses.creditManager = GEARBOX_CONFIG.creditManager;
      this.contractAddresses.creditFacade = GEARBOX_CONFIG.creditFacade;
      this.contractAddresses.poolService = GEARBOX_CONFIG.poolService;
      return true;
    }

    return false;
  }

  /**
   * Get available lending pools
   * Returns pool data with APY, TVL, etc.
   */
  async getPools() {
    await this.init();

    if (!this.isGearboxAvailable) {
      // Return configured pools if Gearbox not available
      const pools = GEARBOX_CONFIG.pools || [];
      return pools.map(pool => ({
        ...pool,
        tokenInfo: GEARBOX_CONFIG.supportedTokens[pool.token]
      }));
    }

    try {
      // Get SOMI v3 pool data
      const pools = GEARBOX_CONFIG.pools || [];
      if (pools.length === 0) {
        return [];
      }

      const pool = pools[0]; // SOMI v3 pool
      const poolContract = new ethers.Contract(
        pool.poolAddress,
        GEARBOX_POOL_ABI,
        this.provider
      );

      // Check if contract exists
      const code = await this.provider.getCode(pool.poolAddress);
      if (code === '0x' || code === '0x0') {
        // Contract doesn't exist - return configured pools
        return pools.map(p => ({
          ...p,
          tokenInfo: GEARBOX_CONFIG.supportedTokens[p.token]
        }));
      }

      // Fetch real pool data
      const [totalSupply, availableLiquidity, totalBorrowed] = await Promise.all([
        poolContract.totalSupply().catch(() => 0n),
        poolContract.availableLiquidity().catch(() => 0n),
        poolContract.totalBorrowed().catch(() => 0n)
      ]);

      // Try to get APY (may not be available)
      let lendAPY = 0n;
      try {
        lendAPY = await poolContract.getLendAPY();
      } catch (e) {
        // getLendAPY() may not exist - use default
        lendAPY = ethers.parseUnits('0', 18);
      }

      const utilizationRate = totalSupply > 0n 
        ? Number(totalBorrowed) / Number(totalSupply)
        : 0;

      return [{
        id: pool.id,
        token: pool.token,
        poolAddress: pool.poolAddress,
        apy: parseFloat(ethers.formatUnits(lendAPY, 18)) * 100,
        totalSupply: ethers.formatUnits(totalSupply, 18),
        totalValueLocked: ethers.formatUnits(totalSupply, 18),
        utilizationRate,
        availableLiquidity: ethers.formatUnits(availableLiquidity, 18),
        tokenInfo: GEARBOX_CONFIG.supportedTokens[pool.token]
      }];
    } catch (error) {
      console.error('Error fetching pools:', error);
      // Fallback to configured pools
      const pools = GEARBOX_CONFIG.pools || [];
      return pools.map(pool => ({
        ...pool,
        tokenInfo: GEARBOX_CONFIG.supportedTokens[pool.token]
      }));
    }
  }

  /**
   * Get user's Diesel token (dWSOMI-V3-1) balance directly
   * @param {string} tokenSymbol - Token symbol (only WSOMI supported)
   * @param {string} userAddress - User wallet address
   * @returns {Promise<string>} - Balance in dWSOMI-V3-1 (shares)
   */
  async getDieselBalance(tokenSymbol, userAddress) {
    if (!userAddress) return '0';

    await this.init();

    try {
      const pool = GEARBOX_CONFIG.pools.find(p => p.token === tokenSymbol || p.token === 'WSOMI');
      if (!pool) return '0';

      if (!this.isGearboxAvailable) {
        return '0';
      }

      // Get Diesel token (dWSOMI-V3-1) balance directly from pool contract
      const poolContract = new ethers.Contract(
        pool.poolAddress,
        GEARBOX_POOL_ABI,
        this.provider
      );

      const dieselBalance = await poolContract.balanceOf(userAddress);
      return ethers.formatUnits(dieselBalance, 18);
    } catch (error) {
      console.error('Error getting Diesel balance:', error);
      return '0';
    }
  }

  /**
   * Get user's deposit balance in a pool (Diesel/LP token balance)
   * Returns WSOMI equivalent (for display purposes)
   */
  async getDepositBalance(tokenSymbol, userAddress) {
    if (!userAddress) return '0';

    await this.init();

    try {
      const tokenInfo = GEARBOX_CONFIG.supportedTokens[tokenSymbol];
      if (!tokenInfo) return '0';

      if (!this.isGearboxAvailable) {
        return '0';
      }

      // Get pool info
      const pool = GEARBOX_CONFIG.pools.find(p => p.token === tokenSymbol || p.token === 'WSOMI');
      if (!pool) return '0';

      // Diesel token (dWSOMI-V3-1) is the same contract as pool
      // Get Diesel token balance directly from pool contract
      const poolContract = new ethers.Contract(
        pool.poolAddress,
        GEARBOX_POOL_ABI,
        this.provider
      );

      const dieselBalance = await poolContract.balanceOf(userAddress);
      
      if (dieselBalance === 0n) {
        return '0';
      }

      // Convert Diesel tokens back to underlying tokens
      // Diesel token represents shares in the pool
      const totalSupply = await poolContract.totalSupply();
      const totalLiquidity = await poolContract.availableLiquidity();
      
      // Calculate underlying amount: (dieselBalance / totalSupply) * totalLiquidity
      // But we need total assets, not just available liquidity
      // Try to get underlying token balance of pool
      const underlyingToken = await poolContract.underlyingToken();
      const underlyingContract = new ethers.Contract(underlyingToken, ERC20_ABI, this.provider);
      const poolBalance = await underlyingContract.balanceOf(pool.poolAddress);
      
      // Calculate: (dieselBalance / totalSupply) * poolBalance
      const underlyingAmount = totalSupply > 0n
        ? (dieselBalance * poolBalance) / totalSupply
        : 0n;
      
      return ethers.formatUnits(underlyingAmount, tokenInfo.decimals);
    } catch (error) {
      return '0';
    }
  }

  /**
   * Get pool APY (Annual Percentage Yield)
   */
  async getPoolAPY(tokenSymbol) {
    await this.init();

    // Get pool config - check if pools array exists
    const pools = GEARBOX_CONFIG.pools || [];
    const pool = pools.find(p => p.token === tokenSymbol || p.token === 'WSOMI');
    
    if (!pool) {
      return 0;
    }

    if (!this.isGearboxAvailable) {
      return pool.apy || 0;
    }

    try {
      // Get real APY from pool contract
      const poolContract = new ethers.Contract(
        pool.poolAddress,
        GEARBOX_POOL_ABI,
        this.provider
      );

      // Try to get APY (may not be available)
      try {
        const lendAPY = await poolContract.getLendAPY();
        return parseFloat(ethers.formatUnits(lendAPY, 18)) * 100;
      } catch (e) {
        // getLendAPY() may not exist - return pool default
        return pool.apy || 0;
      }
    } catch (error) {
      return pool.apy || 0;
    }
  }

  /**
   * Wrap native SOMI to WSOMI
   */
  async wrapSOMI(amount) {
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    await this.checkNetwork();

    const signer = await this.getSigner();
    const somiInfo = GEARBOX_CONFIG.supportedTokens.SOMI;
    const wsomiAddress = somiInfo.wrappedAddress;

    if (!wsomiAddress) {
      throw new Error('WSOMI contract address not configured');
    }

    const amountIn = ethers.parseUnits(amount.toString(), 18);

    // Check balance
    const provider = this.getProvider();
    const balance = await provider.getBalance(userAddress);
    if (balance < amountIn) {
      throw new Error('Insufficient SOMI balance');
    }

    // Wrap SOMI to WSOMI
    const wsomiContract = new ethers.Contract(wsomiAddress, WETH_ABI, signer);
    const wrapTx = await wsomiContract.deposit({ value: amountIn });
    await wrapTx.wait();

    return {
      success: true,
      message: `Successfully wrapped ${amount} SOMI to WSOMI!`,
      txHash: wrapTx.hash
    };
  }

  /**
   * Unwrap WSOMI to native SOMI
   */
  async unwrapWSOMI(amount) {
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    await this.checkNetwork();

    const signer = await this.getSigner();
    const wsomiAddress = GEARBOX_CONFIG.supportedTokens.WSOMI.address;
    const amountIn = ethers.parseUnits(amount.toString(), 18);

    // Check WSOMI balance
    const wsomiContract = new ethers.Contract(wsomiAddress, WETH_ABI, signer);
    const balance = await wsomiContract.balanceOf(userAddress);
    if (balance < amountIn) {
      throw new Error('Insufficient WSOMI balance');
    }

    // Unwrap WSOMI to SOMI
    const unwrapTx = await wsomiContract.withdraw(amountIn);
    await unwrapTx.wait();

    return {
      success: true,
      message: `Successfully unwrapped ${amount} WSOMI to SOMI!`,
      txHash: unwrapTx.hash
    };
  }

  /**
   * Deposit assets to Gearbox pool
   */
  async deposit(tokenSymbol, amount) {
    // Check wallet connection
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    // Ensure correct network
    await this.checkNetwork();

    const signer = await this.getSigner();
    // Gearbox uses WSOMI, not native SOMI
    // If user selects SOMI, we need to wrap it first
    let actualTokenSymbol = tokenSymbol;
    let actualTokenInfo = GEARBOX_CONFIG.supportedTokens[tokenSymbol];
    
    if (tokenSymbol === 'SOMI') {
      // Wrap SOMI to WSOMI first
      await this.wrapSOMI(amount);
      actualTokenSymbol = 'WSOMI';
      actualTokenInfo = GEARBOX_CONFIG.supportedTokens.WSOMI;
    }
    
    if (!actualTokenInfo) {
      throw new Error('Token not supported');
    }

    const amountIn = ethers.parseUnits(amount.toString(), actualTokenInfo.decimals);

    // Check token contract exists (read-only check)
    const provider = this.getProvider();
    const code = await provider.getCode(actualTokenInfo.address);
    if (code === '0x' || code === '0x0') {
      throw new Error('Token contract not found');
    }
    
    // Create token contract with signer (needed for approve transaction)
    const tokenContract = new ethers.Contract(actualTokenInfo.address, ERC20_ABI, signer);
    
    // Check WSOMI balance
    const balance = await tokenContract.balanceOf(userAddress);
    if (balance < amountIn) {
      throw new Error(`Insufficient ${actualTokenSymbol} balance. You need to wrap SOMI to WSOMI first.`);
    }

    if (!this.isGearboxAvailable) {
      throw new Error('Gearbox Protocol contracts not configured. Please set contract addresses in gearbox.config.js');
    }

    // Get pool for this token
    const pool = GEARBOX_CONFIG.pools.find(p => p.token === actualTokenSymbol);
    if (!pool) {
      throw new Error(`Pool not found for ${actualTokenSymbol}`);
    }

    // Real Gearbox deposit using Pool contract
    const poolContract = new ethers.Contract(
      pool.poolAddress,
      GEARBOX_POOL_ABI,
      signer
    );

    // Approve WSOMI to pool contract (first transaction)
    const allowance = await tokenContract.allowance(userAddress, pool.poolAddress);
    if (allowance < amountIn) {
      // Approve unlimited or specific amount
      const approveTx = await tokenContract.approve(pool.poolAddress, ethers.MaxUint256);
      await approveTx.wait();
    }

    // Deposit to pool using depositWithReferral (actual function used)
    const depositTx = await poolContract.depositWithReferral(
      amountIn,
      userAddress,
      0 // referralCode
    );

    // Wait for confirmation
    const receipt = await depositTx.wait();

    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Add XP reward
    ProfileService.addXP(userAddress, GEARBOX_CONFIG.settings.xpReward);
    ProfileService.updateStats(userAddress, 'lendingActions');

    // Dispatch success event
    window.dispatchEvent(new CustomEvent('lendingDeposited', {
      detail: {
        tokenSymbol: actualTokenSymbol,
        amount,
        txHash: depositTx.hash
      }
    }));

    return {
      success: true,
      message: `Successfully deposited ${amount} ${actualTokenSymbol}!`,
      txHash: depositTx.hash
    };
  }

  /**
   * Withdraw WSOMI from Gearbox Pool
   * 
   * Transaction örneği:
   * https://explorer.somnia.network/tx/0x229096ae41ef5b1159b199dc31cc91d36844a5b6ddb5fda05ae6b66751e4a70d
   * 
   * PoolV3 kontratı: 0x6f652fbCfC2107ef9C99456311B5650cd52D6419
   * Fonksiyon: redeem(uint256 shares, address to)
   * 
   * NOT: Orijinal Gearbox UI'da kullanıcı dWSOMI-V3-1 (shares) miktarını giriyor,
   * biz de bu miktarı direkt redeem fonksiyonuna gönderiyoruz.
   * 
   * @param {string} tokenSymbol - Token symbol (only WSOMI supported, ignored - for compatibility)
   * @param {string|number} amount - Amount in dWSOMI-V3-1 (shares) to redeem
   */
  async withdraw(tokenSymbol, amount) {
    const userAddress = await this.getWalletAddress();
    if (!userAddress) {
      throw new Error('Please connect your wallet first');
    }

    await this.checkNetwork();
    const signer = await this.getSigner();
    
    // Only WSOMI is supported
    const actualTokenSymbol = 'WSOMI';
    const tokenInfo = GEARBOX_CONFIG.supportedTokens[actualTokenSymbol];
    if (!tokenInfo) {
      throw new Error('Token not supported');
    }

    if (!this.isGearboxAvailable) {
      throw new Error('Gearbox Protocol contracts not configured');
    }

    // Get pool for WSOMI
    const pool = GEARBOX_CONFIG.pools.find(p => p.token === actualTokenSymbol);
    if (!pool) {
      throw new Error(`Pool not found for ${actualTokenSymbol}`);
    }

    // Create pool contract instance
    const poolContract = new ethers.Contract(
      pool.poolAddress,
      GEARBOX_POOL_ABI,
      signer
    );

    // Get user's Diesel token (dWSOMI-V3-1) balance
    const dieselBalance = await poolContract.balanceOf(userAddress);
    if (dieselBalance === 0n) {
      throw new Error('No deposit balance found');
    }

    // Convert amount to wei (amount is in dWSOMI-V3-1 shares)
    // Round to avoid precision issues
    const amountNum = parseFloat(amount.toString());
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    // Round to 6 decimal places to avoid precision issues
    const roundedAmount = Math.round(amountNum * 1000000) / 1000000;
    const dieselAmount = ethers.parseUnits(roundedAmount.toFixed(6), tokenInfo.decimals);
    
    if (dieselAmount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    // Check user has enough Diesel tokens
    if (dieselAmount > dieselBalance) {
      const dieselBalanceFormatted = ethers.formatUnits(dieselBalance, 18);
      const requestedFormatted = ethers.formatUnits(dieselAmount, 18);
      throw new Error(`Insufficient deposit balance. You have ${dieselBalanceFormatted} dWSOMI-V3-1. You tried to withdraw ${requestedFormatted} dWSOMI-V3-1.`);
    }
    
    // Ensure we don't try to redeem more than user has (safety check)
    if (dieselAmount > dieselBalance) {
      throw new Error(`Cannot redeem more than your balance. You have ${ethers.formatUnits(dieselBalance, 18)} dWSOMI-V3-1.`);
    }

    // Preview how much WSOMI user will get (for display/validation)
    let previewWSOMI;
    try {
      previewWSOMI = await poolContract.previewRedeem(dieselAmount);
    } catch (e) {
      // previewRedeem yoksa convertToAssets kullan
      try {
        previewWSOMI = await poolContract.convertToAssets(dieselAmount);
      } catch (e2) {
        // Her ikisi de yoksa manuel hesapla
        const totalSupply = await poolContract.totalSupply();
        const underlyingToken = await poolContract.underlyingToken();
        const underlyingContract = new ethers.Contract(underlyingToken, ERC20_ABI, this.provider);
        const poolBalance = await underlyingContract.balanceOf(pool.poolAddress);
        
        let totalBorrowed = 0n;
        try {
          totalBorrowed = await poolContract.totalBorrowed();
        } catch (err) {
          // totalBorrowed() may not exist
        }
        
        const totalAssets = poolBalance + totalBorrowed;
        if (totalAssets === 0n || totalSupply === 0n) {
          throw new Error('Pool is empty');
        }
        
        previewWSOMI = (dieselAmount * totalAssets) / totalSupply;
      }
    }

    // Check pool state
    let isPaused = false;
    try {
      isPaused = await poolContract.paused();
    } catch (e) {
      // paused() may not exist
    }
    
    if (isPaused) {
      throw new Error('Pool is currently paused. Withdrawals are not available.');
    }

    // Check available liquidity
    let availableLiquidity;
    try {
      availableLiquidity = await poolContract.availableLiquidity();
    } catch (e) {
      // availableLiquidity() may not exist, get from pool balance
      const underlyingToken = await poolContract.underlyingToken();
      const underlyingContract = new ethers.Contract(underlyingToken, ERC20_ABI, this.provider);
      availableLiquidity = await underlyingContract.balanceOf(pool.poolAddress);
    }
    
    if (availableLiquidity < previewWSOMI) {
      throw new Error(`Insufficient liquidity in pool. Available: ${ethers.formatUnits(availableLiquidity, 18)} WSOMI, You will get: ${ethers.formatUnits(previewWSOMI, 18)} WSOMI`);
    }

    // Debug log - tüm bilgileri yazdır
    console.log('=== WITHDRAW DEBUG INFO ===');
    console.log('User Address:', userAddress);
    console.log('Pool Address:', pool.poolAddress);
    console.log('Diesel Amount (shares):', ethers.formatUnits(dieselAmount, 18), 'dWSOMI-V3-1');
    console.log('Diesel Amount (raw):', dieselAmount.toString());
    console.log('Diesel Balance:', ethers.formatUnits(dieselBalance, 18), 'dWSOMI-V3-1');
    console.log('Diesel Balance (raw):', dieselBalance.toString());
    console.log('Preview WSOMI:', ethers.formatUnits(previewWSOMI, 18), 'WSOMI');
    console.log('Preview WSOMI (raw):', previewWSOMI.toString());
    console.log('Available Liquidity:', ethers.formatUnits(availableLiquidity, 18), 'WSOMI');
    console.log('Available Liquidity (raw):', availableLiquidity.toString());
    console.log('Pool Paused:', isPaused);
    
    // Check if previewWSOMI is greater than available liquidity
    if (previewWSOMI > availableLiquidity) {
      console.error('ERROR: Preview WSOMI > Available Liquidity!');
      console.error('This will cause the transaction to fail!');
    }
    
    // Check total supply and pool balance
    try {
      const totalSupply = await poolContract.totalSupply();
      const underlyingToken = await poolContract.underlyingToken();
      const underlyingContract = new ethers.Contract(underlyingToken, ERC20_ABI, this.provider);
      const poolBalance = await underlyingContract.balanceOf(pool.poolAddress);
      console.log('Total Supply (shares):', ethers.formatUnits(totalSupply, 18));
      console.log('Pool Balance (WSOMI):', ethers.formatUnits(poolBalance, 18));
    } catch (e) {
      console.log('Could not fetch pool state:', e);
    }
    
    console.log('===========================');

    // Try to estimate gas first to see if transaction would succeed
    let gasEstimate = null;
    try {
      // Try with 3 parameters (redeem(uint256,address,address))
      gasEstimate = await poolContract.redeem.estimateGas(dieselAmount, userAddress, userAddress);
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (estimateError) {
      console.error('Gas estimation failed:', estimateError);
      // Gas estimation başarısız olursa, manuel gas limit kullan
      // Başarılı transaction'da 143,186 gas kullanılmış, biraz buffer ekleyelim
      gasEstimate = 180000n; // 180k gas limit (başarılı transaction'da 143k kullanılmış, %25 buffer)
      console.log('Using manual gas limit:', gasEstimate.toString());
    }

    // Call redeem(uint256 shares, address to)
    // shares = dWSOMI-V3-1 amount to burn
    console.log('Calling redeem with:', {
      shares: dieselAmount.toString(),
      to: userAddress
    });
    
    // IMPORTANT: Gearbox V3 Pool might require the user to transfer shares to the pool first
    // OR it might use a different mechanism. Let's check if we need to approve/transfer
    
    // ERC4626 redeem(uint256,address,address) için:
    // Gearbox V3 pool kontratı approval gerektirebilir
    // Approval yapalım (zarar vermez, eğer gerekliyse çalışır)
    
    const dieselTokenContract = new ethers.Contract(
      pool.poolAddress, // Diesel token is the same as pool contract
      GEARBOX_POOL_ABI,
      signer
    );
    
    // Approval kontrolü ve gerekirse approval
    const allowance = await dieselTokenContract.allowance(userAddress, pool.poolAddress);
    console.log('Current allowance:', ethers.formatUnits(allowance, 18));
    
    if (allowance < dieselAmount) {
      console.log('Approval needed. Approving pool to spend Diesel tokens...');
      const approveTx = await dieselTokenContract.approve(pool.poolAddress, ethers.MaxUint256);
      console.log('Approval transaction sent, waiting for confirmation...');
      await approveTx.wait();
      console.log('Approval successful');
    } else {
      console.log('Approval already exists, skipping...');
    }
    
    console.log('Final check before redeem:');
    console.log('- User has', ethers.formatUnits(dieselBalance, 18), 'dWSOMI-V3-1');
    console.log('- Trying to redeem', ethers.formatUnits(dieselAmount, 18), 'dWSOMI-V3-1');
    console.log('- Will receive ~', ethers.formatUnits(previewWSOMI, 18), 'WSOMI');
    console.log('- Allowance:', ethers.formatUnits(allowance, 18));
    
    // Get current gas price and set manual gas settings
    // Başarılı transaction'da 6 gwei kullanılmış, 20-30 gwei kullanacağız
    // Somnia network EIP-1559'u desteklemiyor, sadece gasPrice kullan
    let gasPrice;
    try {
      const feeData = await signer.provider.getFeeData();
      gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    } catch (e) {
      // EIP-1559 desteklenmiyorsa, direkt gasPrice kullan
      gasPrice = ethers.parseUnits('20', 'gwei'); // 20 gwei (başarılı transaction'da 6 gwei kullanılmış)
    }
    
    // Minimum 6 gwei, maksimum 30 gwei
    if (gasPrice < ethers.parseUnits('6', 'gwei')) {
      gasPrice = ethers.parseUnits('6', 'gwei');
    }
    if (gasPrice > ethers.parseUnits('30', 'gwei')) {
      gasPrice = ethers.parseUnits('30', 'gwei');
    }
    
    console.log('Gas settings:', {
      gasLimit: gasEstimate?.toString() || '200000',
      gasPrice: ethers.formatUnits(gasPrice, 'gwei') + ' gwei'
    });
    
    // IMPORTANT: Gerçek transaction'da redeem(uint256 shares, address receiver, address owner) kullanılıyor
    // ERC4626 standardında bu fonksiyon owner'ın shares'ını yakıp receiver'a underlying asset'i gönderir
    // Transaction hash: 0x229096ae41ef5b1159b199dc31cc91d36844a5b6ddb5fda05ae6b66751e4a70d
    // Function selector: 0xba087652 = redeem(uint256,address,address)
    // Parametreler: redeem(0.02, userAddress, userAddress)
    
    // Call redeem(uint256 shares, address receiver, address owner)
    // shares: dWSOMI-V3-1 miktarı (dieselAmount)
    // receiver: WSOMI'nin gönderileceği adres (userAddress)
    // owner: shares'ın sahibi (userAddress - kendi shares'ını yakıyor)
    // ERC4626'da owner == msg.sender ise approval gerekmez
    
    console.log('Calling redeem with parameters:');
    console.log('- shares:', ethers.formatUnits(dieselAmount, 18), 'dWSOMI-V3-1');
    console.log('- receiver:', userAddress);
    console.log('- owner:', userAddress);
    console.log('- gasLimit:', gasEstimate?.toString() || '180000');
    console.log('- gasPrice:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
    
    // withdrawTx'yi try bloğu dışında tanımla
    let withdrawTx;
    try {
      withdrawTx = await poolContract.redeem(dieselAmount, userAddress, userAddress, {
        gasLimit: gasEstimate || 180000,
        gasPrice: gasPrice
      });

      console.log('Transaction sent, waiting for confirmation...');
      const receipt = await withdrawTx.wait();

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }
      
      console.log('Transaction successful!');
    } catch (error) {
      console.error('Transaction error:', error);
      // Daha detaylı hata mesajı
      if (error.reason) {
        throw new Error(`Transaction failed: ${error.reason}`);
      } else if (error.message) {
        throw new Error(`Transaction failed: ${error.message}`);
      } else {
        throw new Error('Transaction failed: Unknown error');
      }
    }

    // Add XP reward (smaller than deposit)
    ProfileService.addXP(userAddress, Math.floor(GEARBOX_CONFIG.settings.xpReward * 0.67));
    ProfileService.updateStats(userAddress, 'lendingActions');

    // Get actual WSOMI received from transaction (from events or calculate)
    const actualWSOMIReceived = previewWSOMI;

    // Dispatch success event
    window.dispatchEvent(new CustomEvent('lendingWithdrawn', {
      detail: {
        tokenSymbol: actualTokenSymbol,
        amount: ethers.formatUnits(actualWSOMIReceived, 18),
        shares: ethers.formatUnits(dieselAmount, 18),
        txHash: withdrawTx.hash
      }
    }));

    return {
      success: true,
      message: `Successfully withdrew ${ethers.formatUnits(actualWSOMIReceived, 18)} ${actualTokenSymbol}!`,
      txHash: withdrawTx.hash,
      sharesBurned: ethers.formatUnits(dieselAmount, 18),
      wsomiReceived: ethers.formatUnits(actualWSOMIReceived, 18)
    };
  }

  /**
   * Preview how much WSOMI user will get for given dWSOMI-V3-1 shares
   * @param {string|number} sharesAmount - Amount in dWSOMI-V3-1 (shares)
   * @returns {Promise<number>} - Amount in WSOMI
   */
  async previewWithdraw(sharesAmount) {
    await this.init();

    if (!this.isGearboxAvailable) {
      // Fallback to 1:1 ratio
      return parseFloat(sharesAmount);
    }

    try {
      const pool = GEARBOX_CONFIG.pools.find(p => p.token === 'WSOMI');
      if (!pool) {
        return parseFloat(sharesAmount);
      }

      const poolContract = new ethers.Contract(
        pool.poolAddress,
        GEARBOX_POOL_ABI,
        this.provider
      );

      const shares = ethers.parseUnits(sharesAmount.toString(), 18);

      // Try previewRedeem first (most accurate)
      try {
        const preview = await poolContract.previewRedeem(shares);
        return parseFloat(ethers.formatUnits(preview, 18));
      } catch (e) {
        // Try convertToAssets
        try {
          const assets = await poolContract.convertToAssets(shares);
          return parseFloat(ethers.formatUnits(assets, 18));
        } catch (e2) {
          // Fallback to manual calculation
          const totalSupply = await poolContract.totalSupply();
          const underlyingToken = await poolContract.underlyingToken();
          const underlyingContract = new ethers.Contract(underlyingToken, ERC20_ABI, this.provider);
          const poolBalance = await underlyingContract.balanceOf(pool.poolAddress);
          
          let totalBorrowed = 0n;
          try {
            totalBorrowed = await poolContract.totalBorrowed();
          } catch (err) {
            // totalBorrowed() may not exist
          }
          
          const totalAssets = poolBalance + totalBorrowed;
          if (totalAssets === 0n || totalSupply === 0n) {
            return parseFloat(sharesAmount);
          }
          
          const assets = (shares * totalAssets) / totalSupply;
          return parseFloat(ethers.formatUnits(assets, 18));
        }
      }
    } catch (error) {
      console.error('Error previewing withdraw:', error);
      // Fallback to 1:1 ratio
      return parseFloat(sharesAmount);
    }
  }

  /**
   * Get WSOMI balance (for display)
   */
  async getWSOMIBalance(userAddress) {
    if (!userAddress) return '0';

    try {
      await this.init();
      
      const wsomiInfo = GEARBOX_CONFIG.supportedTokens.WSOMI;
      if (!wsomiInfo || !wsomiInfo.address) {
        console.error('WSOMI token info not found in config');
        return '0';
      }

      // Normalize address to checksum format
      const wsomiAddress = ethers.getAddress(wsomiInfo.address.toLowerCase());
      
      const provider = this.getProvider();
      
      // Check if contract exists
      const code = await provider.getCode(wsomiAddress);
      if (code === '0x' || code === '0x0') {
        console.error('WSOMI contract not found at address:', wsomiAddress);
        return '0';
      }
      
      // Get balance
      const wsomiContract = new ethers.Contract(wsomiAddress, ERC20_ABI, provider);
      const balance = await wsomiContract.balanceOf(userAddress);
      const formatted = ethers.formatUnits(balance, 18);
      
      return formatted;
    } catch (error) {
      console.error('Error getting WSOMI balance:', error);
      return '0';
    }
  }

  /**
   * Get supported tokens for lending
   */
  getSupportedTokens() {
    // Return only SOMI and WSOMI for Gearbox
    return [
      GEARBOX_CONFIG.supportedTokens.SOMI,
      GEARBOX_CONFIG.supportedTokens.WSOMI
    ];
  }

  /**
   * Get lending settings
   */
  getSettings() {
    return GEARBOX_CONFIG.settings;
  }
}

// Singleton instance
export const GearboxService = new GearboxServiceClass();
export default GearboxService;

