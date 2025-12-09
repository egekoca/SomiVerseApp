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
// Function selector: 0x5a1ee3ac = deposit(address from, address token, bytes32 id)
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
   * Bridge ETH from Ethereum to Somnia Mainnet SOMI
   * Flow: ETH -> WETH -> USDC (via swap) -> Relay Depository -> Somnia
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

      // Step 1: Wrap ETH to WETH
      console.log('Step 1: Wrapping ETH to WETH...');
      const wethContract = new ethers.Contract(WETH_ADDRESS, WETH9_ABI, signer);
      const wrapTx = await wethContract.deposit({ value: amountInWei });
      await wrapTx.wait();
      console.log('WETH wrapped:', wrapTx.hash);

      // Step 2: Swap WETH to USDC (using Uniswap V2 Router)
      console.log('Step 2: Swapping WETH to USDC...');
      const routerContract = new ethers.Contract(UNISWAP_ROUTER_ETH, UNISWAP_ROUTER_ABI, signer);
      
      // Approve WETH to router
      const wethTokenContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, signer);
      const allowance = await wethTokenContract.allowance(userAddress, UNISWAP_ROUTER_ETH);
      if (allowance < amountInWei) {
        const approveTx = await wethTokenContract.approve(UNISWAP_ROUTER_ETH, ethers.MaxUint256);
        await approveTx.wait();
        console.log('WETH approved');
      }

      // Swap path: WETH -> USDC
      const path = [WETH_ADDRESS, USDC_ADDRESS];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      // Get quote for minimum USDC out (with 1% slippage)
      const amounts = await routerContract.getAmountsOut(amountInWei, path);
      const minAmountOut = (amounts[1] * BigInt(99)) / BigInt(100); // 1% slippage

      const swapTx = await routerContract.swapExactTokensForTokens(
        amountInWei,
        minAmountOut,
        path,
        userAddress,
        deadline
      );
      const swapReceipt = await swapTx.wait();
      console.log('USDC received:', swapReceipt.hash);

      // Get USDC amount received
      const usdcBalance = await this.getUSDCBalance();
      const usdcAmount = ethers.parseUnits(usdcBalance, 6);

      // Step 3: Approve USDC to Relay Depository
      console.log('Step 3: Approving USDC to Relay Depository...');
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const usdcAllowance = await usdcContract.allowance(userAddress, RELAY_DEPOSITORY);
      if (usdcAllowance < usdcAmount) {
        const approveUsdcTx = await usdcContract.approve(RELAY_DEPOSITORY, ethers.MaxUint256);
        await approveUsdcTx.wait();
        console.log('USDC approved');
      }

      // Step 4: Deposit to Relay Depository
      console.log('Step 4: Depositing USDC to Relay Depository...');
      const relayContract = new ethers.Contract(RELAY_DEPOSITORY, RELAY_DEPOSITORY_ABI, signer);
      
      // Generate unique deposit ID (bytes32)
      // Format: keccak256(abi.encodePacked(userAddress, recipient, chainId, nonce))
      const nonce = await usdcContract.nonces(userAddress);
      const depositId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'uint256', 'uint256'],
          [userAddress, finalRecipient, SOMNIA_CHAIN_ID, nonce]
        )
      );

      const depositTx = await relayContract.deposit(
        userAddress,      // from
        USDC_ADDRESS,     // token
        depositId         // id
      );
      const depositReceipt = await depositTx.wait();
      console.log('Deposit successful:', depositReceipt.hash);

      // Find RelayErc20Deposit event
      const depositEvent = depositReceipt.logs.find(log => {
        try {
          const parsed = relayContract.interface.parseLog(log);
          return parsed.name === 'RelayErc20Deposit';
        } catch {
          return false;
        }
      });

      if (depositEvent) {
        const parsed = relayContract.interface.parseLog(depositEvent);
        console.log('RelayErc20Deposit event:', {
          from: parsed.args.from,
          token: parsed.args.token,
          amount: parsed.args.amount.toString(),
          id: parsed.args.id
        });
      }

      // Add XP reward
      ProfileService.addXP(userAddress, 100); // 100 XP for bridging
      ProfileService.updateStats(userAddress, 'bridgesCompleted');

      return {
        success: true,
        txHash: depositReceipt.hash,
        message: `Successfully bridged ${amount} ETH to Somnia Mainnet. Transaction: ${depositReceipt.hash}`
      };

    } catch (error) {
      console.error('BridgeService bridgeETHToSOMI error:', error);
      return {
        success: false,
        txHash: null,
        message: error.message || 'Bridge transaction failed'
      };
    }
  }

  /**
   * Get quote for bridging (ETH -> USDC conversion rate)
   */
  async getBridgeQuote(ethAmount) {
    try {
      await this.checkNetwork();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const routerContract = new ethers.Contract(UNISWAP_ROUTER_ETH, UNISWAP_ROUTER_ABI, provider);
      
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

