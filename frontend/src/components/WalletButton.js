/**
 * WalletButton Component
 * MetaMask wallet connection button with profile integration
 */
import { ProfileService } from '../services/ProfileService.js';

export class WalletButton {
  constructor(profileModal = null) {
    this.element = null;
    this.isConnected = false;
    this.account = null;
    this.dropdownOpen = false;
    this.profileModal = profileModal;
    this.create();
  }

  setProfileModal(profileModal) {
    this.profileModal = profileModal;
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'wallet-container';
    this.element.innerHTML = `
      <button id="wallet-btn" class="wallet-button">
        <span class="wallet-text">CONNECT WALLET</span>
      </button>
      <div id="wallet-connected" class="wallet-connected hidden">
        <div class="wallet-info-btn">
          <span class="wallet-status">●</span>
          <span class="wallet-address"></span>
          <span class="wallet-arrow">▼</span>
        </div>
        <div class="wallet-dropdown hidden">
          <button class="profile-btn">MY PROFILE</button>
          <button class="disconnect-btn">DISCONNECT</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.element);

    // Event listeners
    this.element.querySelector('#wallet-btn').addEventListener('click', () => this.handleConnect());
    this.element.querySelector('.wallet-info-btn').addEventListener('click', () => this.toggleDropdown());
    this.element.querySelector('.profile-btn').addEventListener('click', () => this.openProfile());
    this.element.querySelector('.disconnect-btn').addEventListener('click', () => this.handleDisconnect());
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.closeDropdown();
      }
    });
    
    // Check if already connected
    this.checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => this.handleAccountsChanged(accounts));
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
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
    this.closeDropdown();
    if (this.profileModal && this.account) {
      this.profileModal.open(this.account);
    }
  }

  handleDisconnect() {
    this.closeDropdown();
    ProfileService.clearCurrentProfile();
    this.setDisconnected();
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
    if (this.isConnected) {
      return;
    }

    if (typeof window.ethereum === 'undefined') {
      // MetaMask not installed
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      // Request account access
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

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      ProfileService.clearCurrentProfile();
      this.setDisconnected();
    } else {
      this.setConnected(accounts[0]);
    }
  }

  setConnected(account) {
    this.isConnected = true;
    this.account = account;
    
    const btn = this.element.querySelector('#wallet-btn');
    const connected = this.element.querySelector('#wallet-connected');
    const address = this.element.querySelector('.wallet-address');
    
    // Hide connect button, show connected info
    btn.classList.add('hidden');
    connected.classList.remove('hidden');
    
    // Show shortened address
    const shortAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
    address.textContent = shortAddress;

    // Get or create profile
    const profile = ProfileService.getOrCreateProfile(account);
    console.log('Profile loaded:', profile);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('walletConnected', { 
      detail: { account, profile } 
    }));
  }

  setDisconnected() {
    this.isConnected = false;
    this.account = null;
    
    const btn = this.element.querySelector('#wallet-btn');
    const connected = this.element.querySelector('#wallet-connected');
    
    btn.classList.remove('hidden');
    connected.classList.add('hidden');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  getAccount() {
    return this.account;
  }

  getIsConnected() {
    return this.isConnected;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default WalletButton;
