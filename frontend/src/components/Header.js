/**
 * Header Component
 * Main navigation bar with logo, profile, XP, and wallet
 */
import { ProfileService } from '../services/ProfileService.js';

export class Header {
  constructor(profileModal = null) {
    this.element = null;
    this.profileModal = profileModal;
    this.isConnected = false;
    this.account = null;
    this.dropdownOpen = false;
    this.xp = 0;
    this.level = 1;
    
    this.create();
    this.setupListeners();
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
        <button class="profile-link hidden" id="header-profile">
          MY PROFILE
        </button>
      </div>
      
      <div class="header-right">
        <div class="xp-display hidden" id="header-xp">
          <span class="xp-icon">⚡</span>
          <span class="xp-amount">0</span>
          <span class="xp-label">XP</span>
        </div>
        
        <div class="wallet-section">
          <button class="header-btn connect-btn" id="header-connect">
            CONNECT WALLET
          </button>
          
          <div class="wallet-connected hidden" id="header-wallet-info">
            <div class="wallet-address-btn" id="wallet-toggle">
              <span class="wallet-dot">●</span>
              <span class="wallet-addr"></span>
              <span class="wallet-arrow">▼</span>
            </div>
            <div class="wallet-dropdown hidden">
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
    
    // My Profile
    this.element.querySelector('#header-profile').addEventListener('click', () => this.openProfile());
    
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

  setConnected(account) {
    this.isConnected = true;
    this.account = account;

    // Update UI
    this.element.querySelector('#header-connect').classList.add('hidden');
    this.element.querySelector('#header-wallet-info').classList.remove('hidden');
    this.element.querySelector('#header-profile').classList.remove('hidden');
    this.element.querySelector('#header-xp').classList.remove('hidden');
    
    // Short address
    const shortAddr = `${account.slice(0, 6)}...${account.slice(-4)}`;
    this.element.querySelector('.wallet-addr').textContent = shortAddr;

    // Load profile
    const profile = await ProfileService.getOrCreateProfile(account);
    if (profile) {
      this.updateXP(profile.xp, profile.level);
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('walletConnected', { 
      detail: { account, profile } 
    }));
  }

  setDisconnected() {
    this.isConnected = false;
    this.account = null;
    this.closeDropdown();

    // Update UI
    this.element.querySelector('#header-connect').classList.remove('hidden');
    this.element.querySelector('#header-wallet-info').classList.add('hidden');
    this.element.querySelector('#header-profile').classList.add('hidden');
    this.element.querySelector('#header-xp').classList.add('hidden');

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
    this.element.querySelector('.xp-amount').textContent = xp;
  }

  getAccount() {
    return this.account;
  }

  getIsConnected() {
    return this.isConnected;
  }
}

export default Header;

