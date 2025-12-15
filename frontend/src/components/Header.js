/**
 * Header Component
 * Main navigation bar with logo, profile, XP, and wallet
 */
import { ProfileService } from '../services/ProfileService.js';
import { SomniaNameService } from '../services/SomniaNameService.js';
import { DomainService } from '../services/DomainService.js';

export class Header {
  constructor(profileModal = null) {
    this.element = null;
    this.profileModal = profileModal;
    this.isConnected = false;
    this.account = null;
    this.somName = null; // Somnia domain name (.somi)
    this.dropdownOpen = false;
    this.xp = 0;
    this.level = 1;
    this.domainService = new DomainService();
    
    this.create();
    this.setupListeners();
  }

  setWalletLabel(text) {
    const walletAddrEl = this.element.querySelector('.wallet-addr');
    if (walletAddrEl) {
      walletAddrEl.textContent = text;
    }
  }

  setProfileModal(profileModal) {
    this.profileModal = profileModal;
  }

  create() {
    this.element = document.createElement('header');
    this.element.id = 'game-header';
    this.element.innerHTML = `
      <div class="header-left">
        <img src="/Somi.png" alt="SomiVerse" class="header-logo" />
      </div>
      
      <div class="header-center">
      </div>
      
      <div class="header-right">
        <div class="xp-display hidden" id="header-xp">
          <div class="level-badge">
            <span class="level-num">LEVEL 1</span>
          </div>
          <div class="xp-details">
            <div class="xp-bar-container">
              <div class="xp-bar-fill" style="width: 0%"></div>
            </div>
            <span class="xp-text">0 / 100 XP</span>
          </div>
        </div>
        
        <div class="wallet-section">
          <button class="wallet-button" id="header-connect">
            <span class="wallet-text">CONNECT WALLET</span>
          </button>
          
          <div class="wallet-connected hidden" id="header-wallet-info">
            <div class="wallet-info-btn" id="wallet-toggle">
              <span class="wallet-dot">●</span>
              <span class="wallet-addr"></span>
              <span class="wallet-arrow">▼</span>
            </div>
            <div class="wallet-dropdown hidden">
              <button class="dropdown-item" id="header-profile-item">MY PROFILE</button>
              <button class="dropdown-item disconnect-btn">DISCONNECT</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.prepend(this.element);
  }

  setupListeners() {
    // Connect wallet
    this.element.querySelector('#header-connect').addEventListener('click', () => this.handleConnect());
    
    // Wallet toggle dropdown
    this.element.querySelector('#wallet-toggle').addEventListener('click', () => this.toggleDropdown());
    
    // Disconnect
    this.element.querySelector('.disconnect-btn').addEventListener('click', () => this.handleDisconnect());
    
    // My Profile (in dropdown)
    this.element.querySelector('#header-profile-item').addEventListener('click', () => this.openProfile());
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!this.element.querySelector('.wallet-section').contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Wallet events
    window.addEventListener('walletConnected', (e) => {
      this.setConnected(e.detail.account);
    });

    window.addEventListener('walletDisconnected', () => {
      this.setDisconnected();
    });

    // XP events
    window.addEventListener('xpGained', (e) => {
      this.updateXP(e.detail.totalXP, e.detail.level);
    });

    // Primary domain set event
    window.addEventListener('primaryDomainSet', async (e) => {
      const { domain } = e.detail;
      console.log('Primary domain set in header:', domain);
      
      // Update somName and wallet address display
      if (this.isConnected && this.account) {
        this.somName = domain;
        if (domain) {
          this.setWalletLabel(domain);
        } else {
          const shortAddr = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
          this.setWalletLabel(shortAddr);
        }
      }
    });

    // Check existing connection
    this.checkConnection();

    // MetaMask events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.setDisconnected();
        } else {
          this.setConnected(accounts[0]);
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }

  async checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.setConnected(accounts[0]);
        }
      } catch (err) {
        console.log('Error checking connection:', err);
      }
    }
  }

  async handleConnect() {
    if (this.isConnected) return;

    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        this.setConnected(accounts[0]);
      }
    } catch (err) {
      if (err.code === 4001) {
        console.log('User rejected connection');
      } else {
        console.error('Connection error:', err);
      }
    }
  }

  async setConnected(account) {
    if (this.isConnected && this.account === account) return;

    this.isConnected = true;
    this.account = account;
    this.somName = null; // Reset on new connection

    // Update UI
    this.element.querySelector('#header-connect').classList.add('hidden');
    
    const xpDisplay = this.element.querySelector('#header-xp');
    if (xpDisplay) xpDisplay.classList.remove('hidden');

    this.element.querySelector('#header-wallet-info').classList.remove('hidden');
    
    // Short address as fallback
    const shortAddr = `${account.slice(0, 6)}...${account.slice(-4)}`;
    this.setWalletLabel(shortAddr);

    // Resolve Somnia domain name (.somi)
    try {
      // Try DomainService first (new service)
      const primaryDomain = await this.domainService.getPrimaryDomain(account);
      if (primaryDomain) {
        this.somName = `${primaryDomain}.somi`;
        this.setWalletLabel(this.somName);
      } else {
        // Fallback to SomniaNameService
        const somName = await SomniaNameService.getPrimarySomName(account);
        if (somName) {
          this.somName = somName;
          this.setWalletLabel(somName);
        }
      }
    } catch (err) {
      // Silent fail - fallback to shortened address
      console.warn('Failed to resolve domain name:', err);
    }

    // Load profile
    const profile = await ProfileService.getOrCreateProfile(account);
    if (profile) {
      this.updateXP(profile.xp, profile.level);
    }

    // Dispatch event with somName included
    window.dispatchEvent(new CustomEvent('walletConnected', { 
      detail: { account, profile, somName: this.somName } 
    }));
  }

  setDisconnected() {
    this.isConnected = false;
    this.account = null;
    this.somName = null;
    this.closeDropdown();

    // Clear Somnia name cache
    SomniaNameService.clearCache();

    // Update UI
    this.element.querySelector('#header-connect').classList.remove('hidden');
    
    // Ensure XP display is hidden and cleaned up
    const xpDisplay = this.element.querySelector('#header-xp');
    if (xpDisplay) {
      xpDisplay.classList.add('hidden');
      // Optional: Reset text to avoid showing stale data if reconnected
      const levelNum = this.element.querySelector('.level-num');
      const xpText = this.element.querySelector('.xp-text');
      const xpBar = this.element.querySelector('.xp-bar-fill');
      if (levelNum) levelNum.textContent = 'LEVEL 1';
      if (xpText) xpText.textContent = '0 / 100 XP';
      if (xpBar) xpBar.style.width = '0%';
    }
    
    this.element.querySelector('#header-wallet-info').classList.add('hidden');

    ProfileService.clearCurrentProfile();

    // Dispatch event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  handleDisconnect() {
    this.closeDropdown();
    this.setDisconnected();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    const dropdown = this.element.querySelector('.wallet-dropdown');
    const arrow = this.element.querySelector('.wallet-arrow');
    
    if (this.dropdownOpen) {
      dropdown.classList.remove('hidden');
      arrow.textContent = '▲';
    } else {
      dropdown.classList.add('hidden');
      arrow.textContent = '▼';
    }
  }

  closeDropdown() {
    this.dropdownOpen = false;
    const dropdown = this.element.querySelector('.wallet-dropdown');
    const arrow = this.element.querySelector('.wallet-arrow');
    if (dropdown) dropdown.classList.add('hidden');
    if (arrow) arrow.textContent = '▼';
  }

  openProfile() {
    if (this.profileModal && this.account) {
      this.profileModal.open(this.account);
    }
  }

  updateXP(xp, level) {
    this.xp = xp;
    this.level = level;

    // Calculate progress
    const startXP = level * (level - 1) * 50;
    const endXP = (level + 1) * level * 50;
    const totalNeeded = endXP - startXP;
    const currentProgress = xp - startXP;
    const percentage = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));

    // Update DOM
    const levelNum = this.element.querySelector('.level-num');
    const xpBar = this.element.querySelector('.xp-bar-fill');
    const xpText = this.element.querySelector('.xp-text');

    if (levelNum) levelNum.textContent = `LEVEL ${level}`;
    if (xpBar) xpBar.style.width = `${percentage}%`;
    if (xpText) xpText.textContent = `${Math.floor(currentProgress)} / ${totalNeeded} XP`;
  }

  getAccount() {
    return this.account;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

export default Header;

