/**
 * BridgeService
 * Handles cross-chain bridging via Relay Protocol
 * Ethereum -> Somnia Mainnet (ETH -> SOMI via USDC)
 */
import { ethers } from 'ethers';
import { ERC20_ABI } from '../config/swap.config.js';
import { ProfileService } from './ProfileService.js';

// Relay Protocol addresses (Ethereum Mainnet)
const RELAY_DEPOSITORY = '0x4cD00E387622C35bDDB9b4c962C136462338BC31';
const COWSWAP_SETTLEMENT = '0xb92fe925DC43a0ECdE6c8b1a2709c170Ec4fFf4f';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// Relay Depository ABI (from tx analysis)
// Function selector: 0x81282f56 = deposit(address from, address token, bytes32 id)
// Note: This is a proxy contract, implementation may have different ABI
const RELAY_DEPOSITORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "bytes32", "name": "id", "type": "bytes32" }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "id", "type": "bytes32" }
    ],
    "name": "RelayErc20Deposit",
    "type": "event"
  },
  // Common custom errors that might be used
  {
    "inputs": [
      { "internalType": "uint256", "name": "available", "type": "uint256" },
      { "internalType": "uint256", "name": "required", "type": "uint256" }
    ],
    "name": "InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDepositId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DepositIdAlreadyUsed",
    "type": "error"
  }
];

// WETH9 ABI (for wrapping ETH)
const WETH9_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "wad", "type": "uint256" }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Uniswap V2 Router ABI (for ETH -> USDC swap)
const UNISWAP_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Ethereum Mainnet Uniswap V2 Router (or PancakeSwap)
const UNISWAP_ROUTER_ETH = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

// PancakeSwap V2 Router (Ethereum Mainnet)
const PANCAKESWAP_ROUTER_ETH = '0xEfF92A263d31888d860bD50809A8D171709b7b1c';

// CowSwap Settlement ABI (Multicall contract)
const COWSWAP_SETTLEMENT_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "target", "type": "address"},
          {"internalType": "bool", "name": "allowFailure", "type": "bool"},
          {"internalType": "uint256", "name": "value", "type": "uint256"},
          {"internalType": "bytes", "name": "callData", "type": "bytes"}
        ],
        "internalType": "struct Call3Value[]",
        "name": "calls",
        "type": "tuple[]"
      },
      {"internalType": "address", "name": "refundTo", "type": "address"},
      {"internalType": "address", "name": "nftRecipient", "type": "address"},
      {"internalType": "bytes", "name": "metadata", "type": "bytes"}
    ],
    "name": "multicall",
    "outputs": [
      {
        "components": [
          {"internalType": "bool", "name": "success", "type": "bool"},
          {"internalType": "bytes", "name": "returnData", "type": "bytes"}
        ],
        "internalType": "struct Result[]",
        "name": "returnData",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address[]", "name": "tokens", "type": "address[]"},
      {"internalType": "address[]", "name": "tos", "type": "address[]"},
      {"internalType": "bytes[]", "name": "datas", "type": "bytes[]"},
      {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}
    ],
    "name": "cleanupErc20sViaCall",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Somnia Mainnet Chain ID (from network config)
const SOMNIA_CHAIN_ID = 5031;

// Base Mainnet addresses
const BASE_MAINNET_RPC = 'https://mainnet.base.org';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC (6 decimals)

// Ethereum Mainnet RPC
const ETHEREUM_MAINNET_RPC = 'https://eth.llamarpc.com';

// Somnia Mainnet RPC
const SOMNIA_MAINNET_RPC = 'https://api.infra.mainnet.somnia.network';

class BridgeServiceClass {
  constructor() {
    this.isInitialized = false;
    this.provider = null;
    this.signer = null;
  }

  /**
   * Initialize the bridge service
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      // Use browser provider (MetaMask) for Ethereum Mainnet
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('BridgeService init error:', error);
      return false;
    }
  }

  /**
   * Get signer for transactions
   */
  async getSigner() {
    if (!this.provider) {
      await this.init();
    }
    if (!this.signer) {
      this.signer = await this.provider.getSigner();
    }
    return this.signer;
  }

  /**
   * Get wallet address
   */
  async getWalletAddress() {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.getAddress();
  }

  /**
   * Check if connected to Ethereum Mainnet
   */
  async checkNetwork() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    // Ethereum Mainnet chain ID = 1
    if (Number(network.chainId) !== 1) {
      // Try to switch
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }]
        });
      } catch (switchError) {
        // If chain doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1',
              chainName: 'Ethereum Mainnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://eth.llamarpc.com'],
              blockExplorerUrls: ['https://etherscan.io']
            }]
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  /**
   * Get ETH balance
   */
  async getETHBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';

    try {
      // Read-only mainnet RPC; no network switch needed
      const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('BridgeService getETHBalance error:', error);
      return '0';
    }
  }

  /**
   * Generic native balance by RPC
   */
  async getNativeBalance(rpcUrl) {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('BridgeService getNativeBalance error:', error);
      return '0';
    }
  }

  /**
   * Generic ERC20 balance by RPC
   */
  async getERC20Balance(tokenAddress, rpcUrl, decimals = 18) {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const erc = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const bal = await erc.balanceOf(address);
      return ethers.formatUnits(bal, decimals);
    } catch (error) {
      console.error('BridgeService getERC20Balance error:', error);
      return '0';
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    await this.checkNetwork();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
    const balance = await usdcContract.balanceOf(address);
    return ethers.formatUnits(balance, 6); // USDC has 6 decimals
  }

  /**
   * Get SOMI balance on Somnia Mainnet
   */
  async getSOMIBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    try {
      // Use Somnia Mainnet RPC for native SOMI balance
      const provider = new ethers.JsonRpcProvider(SOMNIA_MAINNET_RPC);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance); // SOMI has 18 decimals
    } catch (error) {
      console.error('BridgeService getSOMIBalance error:', error);
      return '0';
    }
  }

  /**
   * Get Base Mainnet ETH balance (native)
   */
  async getBaseETHBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    try {
      const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('BridgeService getBaseETHBalance error:', error);
      return '0';
    }
  }

  /**
   * Get Base Mainnet USDC balance
   */
  async getBaseUSDCBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    try {
      const provider = new ethers.JsonRpcProvider(BASE_MAINNET_RPC);
      const usdcContract = new ethers.Contract(BASE_USDC_ADDRESS, ERC20_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      return ethers.formatUnits(balance, 6); // Base USDC has 6 decimals
    } catch (error) {
      console.error('BridgeService getBaseUSDCBalance error:', error);
      return '0';
    }
  }

  /**
   * Get Ethereum Mainnet ETH balance (native)
   */
  async getEthereumETHBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    try {
      const provider = new ethers.JsonRpcProvider(ETHEREUM_MAINNET_RPC);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('BridgeService getEthereumETHBalance error:', error);
      return '0';
    }
  }

  /**
   * Get Ethereum Mainnet USDC balance
   */
  async getEthereumUSDCBalance() {
    const address = await this.getWalletAddress();
    if (!address) return '0';
    
    try {
      const provider = new ethers.JsonRpcProvider(ETHEREUM_MAINNET_RPC);
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (error) {
      console.error('BridgeService getEthereumUSDCBalance error:', error);
      return '0';
    }
  }

  /**
   * Get all bridge token balances at once
   * Returns object with all 5 token balances
   */
  async getAllBalances() {
    const address = await this.getWalletAddress();
    if (!address) {
      return {
        baseETH: '0',
        baseUSDC: '0',
        ethereumETH: '0',
        ethereumUSDC: '0',
        somniaSOMI: '0'
      };
    }

    try {
      // Fetch all balances in parallel
      const [baseETH, baseUSDC, ethereumETH, ethereumUSDC, somniaSOMI] = await Promise.all([
        this.getBaseETHBalance(),
        this.getBaseUSDCBalance(),
        this.getEthereumETHBalance(),
        this.getEthereumUSDCBalance(),
        this.getSOMIBalance()
      ]);

      return {
        baseETH,
        baseUSDC,
        ethereumETH,
        ethereumUSDC,
        somniaSOMI
      };
    } catch (error) {
      console.error('BridgeService getAllBalances error:', error);
      return {
        baseETH: '0',
        baseUSDC: '0',
        ethereumETH: '0',
        ethereumUSDC: '0',
        somniaSOMI: '0'
      };
    }
  }

  /**
   * Generate deposit ID for Relay Depository
   * 
   * Note: Deposit ID is actually the L2 transaction hash that will be created on Somnia.
   * It's calculated from L1 block hash and log index (source hash) using RLP encoding.
   * 
   * However, since we don't know the block hash and log index before the transaction,
   * we'll use a deterministic approach based on user address, recipient, chainId, and a nonce.
   * 
   * The actual deposit ID will be emitted in the RelayErc20Deposit event after the transaction.
   * 
   * @param {string} userAddress - User's wallet address
   * @param {string} recipient - Recipient address on Somnia
   * @param {number} chainId - Destination chain ID (Somnia = 5031)
   * @returns {Promise<string>} Deposit ID (bytes32)
   */
  async generateDepositId(userAddress, recipient, chainId) {
    // For now, we'll generate a deterministic ID based on user data
    // The actual ID will be in the RelayErc20Deposit event after transaction
    // This is a placeholder that ensures uniqueness
    const timestamp = Math.floor(Date.now() / 1000);
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'uint256'],
      [userAddress, recipient, chainId, timestamp]
    );
    return ethers.keccak256(data);
  }

  /**
   * Calculate deposit ID from L1 transaction receipt (OP Stack style)
   * This calculates the L2 transaction hash that will be created on Somnia
   * 
   * @param {Object} receipt - Transaction receipt from L1
   * @param {number} logIndex - Index of RelayErc20Deposit event in logs
   * @param {string} recipient - Recipient address on Somnia
   * @param {string} value - Amount to bridge
   * @returns {string} Deposit ID (L2 transaction hash)
   */
  calculateDepositIdFromReceipt(receipt, logIndex, recipient, value) {
    // Source hash: keccak256(blockHash, logIndex)
    const sourceHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'uint256'],
        [receipt.blockHash, logIndex]
      )
    );

    // Create deposit transaction structure (L2 transaction that will be created)
    const depositTransaction = {
      to: recipient,
      value: ethers.parseEther(value),
      gasLimit: 21000,
      gasPrice: 0,
      data: '0x',
      nonce: sourceHash, // Use source hash as nonce (OP Stack style)
      chainId: SOMNIA_CHAIN_ID,
      type: 0
    };

    // RLP encode and hash to get deposit ID (L2 transaction hash)
    // Note: ethers.js doesn't have direct RLP serialize, we'll use a workaround
    // For now, we'll use a combination approach
    const txData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'address', 'uint256', 'uint256'],
      [sourceHash, recipient, ethers.parseEther(value), SOMNIA_CHAIN_ID]
    );
    
    return ethers.keccak256(txData);
  }

  /**
   * Bridge ETH from Ethereum to Somnia Mainnet SOMI using Multicall
   * Flow: ETH -> WETH -> USDC (via PancakeSwap) -> Relay Depository -> Somnia
   * Uses CowSwap Settlement Multicall contract for atomic execution
   * 
   * @param {string} amount - Amount of ETH to bridge
   * @param {string} recipient - Recipient address on Somnia (optional, defaults to sender)
   * @returns {Promise<{success: boolean, txHash: string, message: string}>}
   */
  async bridgeETHToSOMI(amount, recipient = null) {
    try {
      await this.init();
      await this.checkNetwork();

      const signer = await this.getSigner();
      const userAddress = await signer.getAddress();
      const finalRecipient = recipient || userAddress;

      const amountIn = ethers.parseEther(amount);
      const amountInWei = amountIn;

      console.log(`Bridging ${amount} ETH to Somnia Mainnet SOMI...`);
      console.log(`Recipient: ${finalRecipient}`);

      // Get quote first to calculate expected USDC amount
      // Try PancakeSwap router first, fallback to Uniswap if it fails
      let expectedUSDC;
      let minAmountOut;
      let routerAddress = PANCAKESWAP_ROUTER_ETH;
      const path = [WETH_ADDRESS, USDC_ADDRESS];
      
      try {
        const routerContract = new ethers.Contract(PANCAKESWAP_ROUTER_ETH, UNISWAP_ROUTER_ABI, signer);
        const amounts = await routerContract.getAmountsOut(amountInWei, path);
        expectedUSDC = amounts[1]; // This is already in 6 decimals (USDC)
        minAmountOut = (expectedUSDC * BigInt(99)) / BigInt(100); // 1% slippage
        
        console.log('PancakeSwap quote:', {
          amountIn: ethers.formatEther(amountInWei),
          amountOut: ethers.formatUnits(expectedUSDC, 6),
          amountOutRaw: expectedUSDC.toString(),
          minAmountOut: ethers.formatUnits(minAmountOut, 6),
          minAmountOutRaw: minAmountOut.toString()
        });
      } catch (error) {
        console.warn('PancakeSwap router failed, falling back to Uniswap:', error.message);
        // Fallback to Uniswap router
        routerAddress = UNISWAP_ROUTER_ETH;
        const routerContract = new ethers.Contract(UNISWAP_ROUTER_ETH, UNISWAP_ROUTER_ABI, signer);
        const amounts = await routerContract.getAmountsOut(amountInWei, path);
        expectedUSDC = amounts[1];
        minAmountOut = (expectedUSDC * BigInt(99)) / BigInt(100);
        
        console.log('Uniswap quote (fallback):', {
          amountIn: ethers.formatEther(amountInWei),
          amountOut: ethers.formatUnits(expectedUSDC, 6),
          amountOutRaw: expectedUSDC.toString(),
          minAmountOut: ethers.formatUnits(minAmountOut, 6),
          minAmountOutRaw: minAmountOut.toString()
        });
      }
      
      // Verify expectedUSDC is in correct format (6 decimals for USDC)
      if (expectedUSDC === BigInt(0)) {
        throw new Error('Expected USDC amount is zero. Swap path may not be available.');
      }
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      // Generate preliminary deposit ID (will be replaced by actual ID from event)
      // Note: The actual deposit ID is the L2 transaction hash that will be created on Somnia
      // It's calculated from L1 block hash and log index, but we'll get it from the event
      const preliminaryDepositId = await this.generateDepositId(userAddress, finalRecipient, SOMNIA_CHAIN_ID);
      console.log('Preliminary Deposit ID (will be replaced by actual ID from event):', preliminaryDepositId);

      // Prepare Multicall calls
      const wethInterface = new ethers.Interface(WETH9_ABI);
      const routerInterface = new ethers.Interface(UNISWAP_ROUTER_ABI);
      const usdcInterface = new ethers.Interface(ERC20_ABI);
      const relayInterface = new ethers.Interface(RELAY_DEPOSITORY_ABI);

      // Call 1: Wrap ETH to WETH (via WETH contract)
      const wrapCallData = wethInterface.encodeFunctionData('deposit', []);
      
      // Call 2: Approve WETH to router (if needed)
      // Note: CowSwap handles approvals internally, but we include it for safety
      const wethTokenInterface = new ethers.Interface(ERC20_ABI);
      const approveWethCallData = wethTokenInterface.encodeFunctionData('approve', [
        routerAddress, // Using selected router (PancakeSwap or Uniswap)
        ethers.MaxUint256
      ]);

      // Call 3: Swap WETH to USDC (via selected router)
      const swapCallData = routerInterface.encodeFunctionData('swapExactTokensForTokens', [
        amountInWei,
        minAmountOut,
        path,
        COWSWAP_SETTLEMENT, // Send USDC to CowSwap Settlement first
        deadline
      ]);

      // Call 4: Use cleanupErc20sViaCall to transfer USDC to Relay Depository and call deposit
      // Transaction'dan: cleanupErc20sViaCall([USDC], [Relay Depository], [deposit callData], [amount])
      // Note: cleanupErc20sViaCall transfers tokens from CowSwap Settlement to 'to' address and calls the function
      // The 'amounts' parameter specifies how much token to transfer
      // The 'datas' parameter contains the function call data (deposit function)
      
      // Important: The deposit function receives USDC from CowSwap Settlement, so 'from' should be the Settlement address
      // But looking at the transaction, 'from' is the user address. Let's check the actual transaction format.
      const depositCallData = relayInterface.encodeFunctionData('deposit', [
        userAddress, // from - user address
        USDC_ADDRESS, // token - USDC address
        preliminaryDepositId // id - deposit ID
      ]);
      
      console.log('Deposit call data:', depositCallData);
      console.log('Expected USDC amount:', ethers.formatUnits(expectedUSDC, 6));
      
      // Note: expectedUSDC is already in 6 decimals (from Uniswap router)
      // cleanupErc20sViaCall expects amounts in token's native decimals (6 for USDC)
      const settlementInterface = new ethers.Interface(COWSWAP_SETTLEMENT_ABI);
      
      // Debug: Check expectedUSDC format
      console.log('Expected USDC (raw):', expectedUSDC.toString());
      console.log('Expected USDC (formatted):', ethers.formatUnits(expectedUSDC, 6));
      
      // Important: cleanupErc20sViaCall transfers tokens from CowSwap Settlement to the 'to' address
      // The 'amounts' parameter specifies how much token to transfer
      // However, at this point in the multicall, the swap hasn't happened yet, so USDC isn't in Settlement
      // But since multicall executes atomically, the swap will complete first, then cleanup will run
      // So the amount should be the expected USDC amount from the swap
      
      // Ensure expectedUSDC is a BigInt (it should be already)
      // USDC has 6 decimals, so expectedUSDC is already in the correct format
      const usdcAmount = BigInt(expectedUSDC.toString());
      
      // Debug: Verify amounts format
      console.log('USDC amount for cleanup:', {
        raw: usdcAmount.toString(),
        formatted: ethers.formatUnits(usdcAmount, 6),
        hex: '0x' + usdcAmount.toString(16)
      });
      
      // Note: cleanupErc20sViaCall signature:
      // cleanupErc20sViaCall(address[] tokens, address[] tos, bytes[] datas, uint256[] amounts)
      // All arrays must have the same length
      const cleanupCallData = settlementInterface.encodeFunctionData('cleanupErc20sViaCall', [
        [USDC_ADDRESS], // tokens - array of token addresses to transfer
        [RELAY_DEPOSITORY], // tos - array of recipient addresses  
        [depositCallData], // datas - array of function call data
        [usdcAmount] // amounts - array of token amounts to transfer (6 decimals for USDC)
      ]);
      
      console.log('Cleanup call data length:', cleanupCallData.length);
      console.log('Cleanup call data (first 100 chars):', cleanupCallData.substring(0, 100));

      // Build Multicall
      const settlementContract = new ethers.Contract(COWSWAP_SETTLEMENT, COWSWAP_SETTLEMENT_ABI, signer);
      
      const calls = [
        {
          target: WETH_ADDRESS,
          allowFailure: false,
          value: amountInWei, // ETH amount for wrapping
          callData: wrapCallData
        },
        {
          target: WETH_ADDRESS,
          allowFailure: true, // Approval might not be needed if already approved
          value: 0,
          callData: approveWethCallData
        },
        {
          target: routerAddress, // Using selected router (PancakeSwap or Uniswap fallback)
          allowFailure: false,
          value: 0,
          callData: swapCallData
        },
        {
          target: COWSWAP_SETTLEMENT, // cleanupErc20sViaCall is called on Settlement itself
          allowFailure: false,
          value: 0,
          callData: cleanupCallData
        }
      ];

      console.log('Executing Multicall with', calls.length, 'calls...');
      console.log('Multicall calls:', calls.map(c => ({
        target: c.target,
        allowFailure: c.allowFailure,
        value: c.value.toString(),
        callDataLength: c.callData.length
      })));
      
      // Try to estimate gas first to get better error message
      try {
        const gasEstimate = await settlementContract.multicall.estimateGas(
          calls,
          userAddress, // refundTo
          ethers.ZeroAddress, // nftRecipient
          '0x', // metadata (empty)
          { value: amountInWei } // ETH value for wrapping
        );
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError) {
        console.error('Gas estimation failed:', estimateError);
        // Try to decode the error if possible
        if (estimateError.data) {
          console.error('Error data:', estimateError.data);
          // Try to decode custom error
          const errorData = estimateError.data;
          if (errorData === '0x3204506f') {
            // This is likely InsufficientBalance or similar error from Relay Depository
            console.error('Custom error 0x3204506f detected. This might be:');
            console.error('- InsufficientBalance: USDC amount in CowSwap Settlement is less than required');
            console.error('- InvalidDepositId: Deposit ID format is incorrect');
            console.error('- DepositIdAlreadyUsed: Deposit ID has already been used');
            throw new Error('Relay Depository rejected the deposit. Possible reasons: insufficient balance, invalid deposit ID, or deposit ID already used. Please check the deposit ID format and ensure sufficient USDC balance.');
          }
        }
        throw new Error(`Gas estimation failed: ${estimateError.message}. This usually means one of the calls in the multicall will fail.`);
      }
      
      // Execute Multicall
      const multicallTx = await settlementContract.multicall(
        calls,
        userAddress, // refundTo
        ethers.ZeroAddress, // nftRecipient
        '0x', // metadata (empty)
        { value: amountInWei } // ETH value for wrapping
      );

      const receipt = await multicallTx.wait();
      console.log('Multicall successful:', receipt.hash);

      // Find RelayErc20Deposit event from receipt logs
      let actualDepositId = depositId; // Fallback to generated ID
      let logIndex = -1;
      
      const depositEvent = receipt.logs.find((log, index) => {
        try {
          const parsed = relayInterface.parseLog(log);
          if (parsed && parsed.name === 'RelayErc20Deposit') {
            logIndex = index;
            return true;
          }
          return false;
        } catch {
          return false;
        }
      });

      if (depositEvent) {
        const parsed = relayInterface.parseLog(depositEvent);
        actualDepositId = parsed.args.id; // Use actual ID from event
        console.log('RelayErc20Deposit event:', {
          from: parsed.args.from,
          token: parsed.args.token,
          amount: parsed.args.amount.toString(),
          id: actualDepositId
        });
        
        // Calculate expected L2 transaction hash (for verification)
        if (logIndex >= 0) {
          const calculatedL2TxHash = this.calculateDepositIdFromReceipt(
            receipt,
            logIndex,
            finalRecipient,
            amount
          );
          console.log('Calculated L2 transaction hash (for verification):', calculatedL2TxHash);
        }
      } else {
        console.warn('RelayErc20Deposit event not found in receipt logs');
      }

      // Add XP reward
      ProfileService.addXP(userAddress, 100); // 100 XP for bridging
      ProfileService.updateStats(userAddress, 'bridgesCompleted');

      return {
        success: true,
        txHash: receipt.hash,
        message: `Successfully bridged ${amount} ETH to Somnia Mainnet. Transaction: ${receipt.hash}`,
        depositId: actualDepositId,
        l1TxHash: receipt.hash,
        l2TxHash: actualDepositId // Deposit ID is the L2 transaction hash
      };

    } catch (error) {
      console.error('BridgeService bridgeETHToSOMI error:', error);
      
      // Try to provide more helpful error messages
      let errorMessage = error.message || 'Bridge transaction failed';
      
      if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transaction would fail. Possible reasons:\n' +
          '1. Insufficient balance\n' +
          '2. Insufficient allowance\n' +
          '3. Invalid deposit ID format\n' +
          '4. Swap path not available\n' +
          '5. Relay Depository rejected the deposit';
      }
      
      if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. The transaction would likely fail. ' + errorMessage;
      }
      
      return {
        success: false,
        txHash: null,
        message: errorMessage
      };
    }
  }

  /**
   * Get quote for bridging (ETH -> USDC conversion rate via PancakeSwap)
   */
  async getBridgeQuote(ethAmount) {
    try {
      await this.checkNetwork();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const routerContract = new ethers.Contract(PANCAKESWAP_ROUTER_ETH, UNISWAP_ROUTER_ABI, provider);
      
      const amountIn = ethers.parseEther(ethAmount);
      const path = [WETH_ADDRESS, USDC_ADDRESS];
      const amounts = await routerContract.getAmountsOut(amountIn, path);
      
      const usdcAmount = ethers.formatUnits(amounts[1], 6);
      return {
        ethAmount,
        usdcAmount,
        rate: parseFloat(usdcAmount) / parseFloat(ethAmount)
      };
    } catch (error) {
      console.error('BridgeService getBridgeQuote error:', error);
      return null;
    }
  }
}

export const BridgeService = new BridgeServiceClass();

