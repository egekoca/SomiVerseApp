/**
 * ProfileModal Component
 * Shows user profile with 3D character viewer
 */
import * as THREE from 'three';
import { ProfileService } from '../services/ProfileService.js';

export class ProfileModal {
  constructor() {
    this.element = null;
    this.isOpen = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.character = null;
    this.animationId = null;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.id = 'profile-modal-overlay';
    this.element.innerHTML = `
      <div class="profile-modal">
        <div class="profile-header">
          <div class="profile-title-section">
            <h2 class="profile-title">MY PROFILE</h2>
            <span class="profile-subtitle">TITAN PILOT DATA</span>
          </div>
          <button class="profile-close-btn">×</button>
        </div>
        
        <div class="profile-content">
          <div class="profile-left">
            <div class="character-viewer">
              <canvas id="character-canvas"></canvas>
              <div class="character-hint">DRAG TO ROTATE</div>
            </div>
            <div class="character-name">TITAN MECH</div>
          </div>
          
          <div class="profile-right">
            <div class="profile-section">
              <div class="section-title">WALLET</div>
              <div class="wallet-display">
                <span class="wallet-full-address"></span>
                <button class="copy-btn" title="Copy">⧉</button>
              </div>
            </div>
            
            <div class="profile-section">
              <div class="section-title">LEVEL & XP</div>
              <div class="level-display">
                <div class="level-badge">LVL <span class="level-number">1</span></div>
                <div class="xp-bar-container">
                  <div class="xp-bar">
                    <div class="xp-fill"></div>
                  </div>
                  <div class="xp-text"><span class="current-xp">0</span> / <span class="next-level-xp">100</span> XP</div>
                </div>
              </div>
            </div>
            
            <div class="profile-section">
              <div class="section-title">STATS</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value swaps-count">0</span>
                  <span class="stat-label">SWAPS</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value lending-count">0</span>
                  <span class="stat-label">LENDING</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value minted-count">0</span>
                  <span class="stat-label">MINTED</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value faucet-count">0</span>
                  <span class="stat-label">CLAIMS</span>
                </div>
              </div>
            </div>
            
            <div class="profile-section nft-section">
              <div class="section-title">MY NFTs <span class="nft-count">(0)</span></div>
              <div class="nft-grid"></div>
              <div class="no-nfts">No NFTs yet. Visit the Mint building!</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.element);

    // Event listeners
    this.element.querySelector('.profile-close-btn').addEventListener('click', () => this.close());
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });
    this.element.querySelector('.copy-btn').addEventListener('click', () => this.copyAddress());

    // Character rotation
    const canvas = this.element.querySelector('#character-canvas');
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    canvas.addEventListener('touchend', () => this.onMouseUp());
  }

  open(walletAddress) {
    const profile = ProfileService.getOrCreateProfile(walletAddress);
    if (!profile) return;

    this.updateUI(profile);
    this.element.classList.add('active');
    this.isOpen = true;
    
    // Initialize 3D viewer
    setTimeout(() => this.init3DViewer(), 100);
  }

  close() {
    this.element.classList.remove('active');
    this.isOpen = false;
    this.dispose3DViewer();
  }

  updateUI(profile) {
    // Wallet
    this.element.querySelector('.wallet-full-address').textContent = profile.displayAddress;
    
    // Level & XP
    this.element.querySelector('.level-number').textContent = profile.level;
    this.element.querySelector('.current-xp').textContent = profile.xp;
    
    const nextLevelXP = ProfileService.getXPForNextLevel(profile.level);
    const prevLevelXP = profile.level > 1 ? ProfileService.getXPForNextLevel(profile.level - 1) : 0;
    const progress = ((profile.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
    
    this.element.querySelector('.next-level-xp').textContent = nextLevelXP;
    this.element.querySelector('.xp-fill').style.width = `${Math.min(progress, 100)}%`;
    
    // Stats
    this.element.querySelector('.swaps-count').textContent = profile.stats.swapsCompleted;
    this.element.querySelector('.lending-count').textContent = profile.stats.lendingActions;
    this.element.querySelector('.minted-count').textContent = profile.stats.nftsMinted;
    this.element.querySelector('.faucet-count').textContent = profile.stats.faucetClaims;
    
    // NFTs
    const nftGrid = this.element.querySelector('.nft-grid');
    const noNfts = this.element.querySelector('.no-nfts');
    const nftCount = this.element.querySelector('.nft-count');
    
    nftCount.textContent = `(${profile.nfts.length})`;
    
    if (profile.nfts.length > 0) {
      noNfts.style.display = 'none';
      nftGrid.innerHTML = profile.nfts.map(nft => `
        <div class="nft-item" title="${nft.name || 'NFT'}">
          <div class="nft-icon">${nft.icon || '◆'}</div>
          <div class="nft-name">${nft.name || 'NFT'}</div>
        </div>
      `).join('');
    } else {
      noNfts.style.display = 'block';
      nftGrid.innerHTML = '';
    }
  }

  copyAddress() {
    const address = this.element.querySelector('.wallet-full-address').textContent;
    navigator.clipboard.writeText(address).then(() => {
      const btn = this.element.querySelector('.copy-btn');
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = '⧉', 1500);
    });
  }

  init3DViewer() {
    const canvas = this.element.querySelector('#character-canvas');
    const container = this.element.querySelector('.character-viewer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0515);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.5, 5);
    this.camera.lookAt(0, 1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0x6644aa, 0.5);
    this.scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0x00ffcc, 1);
    frontLight.position.set(2, 3, 4);
    this.scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xff00ff, 0.5);
    backLight.position.set(-2, 2, -3);
    this.scene.add(backLight);

    // Create character
    this.createCharacter();

    // Grid floor
    const gridHelper = new THREE.GridHelper(6, 12, 0x440066, 0x220033);
    gridHelper.position.y = -0.5;
    this.scene.add(gridHelper);

    // Start animation
    this.animate();
  }

  createCharacter() {
    this.character = new THREE.Group();

    const darkMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a3a45, 
      emissive: 0x101015, 
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const jointMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a55, 
      emissive: 0x151518, 
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.4
    });
    
    const neonMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffcc, 
      transparent: true, 
      opacity: 0.9 
    });
    
    const visorMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8
    });

    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.0, 0.5),
      darkMat
    );
    torso.position.y = 1.5;
    this.character.add(torso);

    // Chest plate
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.3, 0.15),
      jointMat
    );
    chest.position.set(0, 1.7, 0.3);
    this.character.add(chest);

    // Core light
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      neonMat
    );
    core.position.set(0, 1.5, 0.3);
    this.character.add(core);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.4),
      darkMat
    );
    head.position.y = 2.3;
    this.character.add(head);

    // Visor
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, 0.1),
      visorMat
    );
    visor.position.set(0, 2.35, 0.2);
    this.character.add(visor);

    // Arms
    const shoulderGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);

    // Left arm
    const leftShoulder = new THREE.Mesh(shoulderGeo, darkMat);
    leftShoulder.position.set(-0.6, 1.7, 0);
    this.character.add(leftShoulder);

    const leftArm = new THREE.Mesh(armGeo, jointMat);
    leftArm.position.set(-0.6, 1.2, 0);
    this.character.add(leftArm);

    const leftRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 8, 16),
      neonMat
    );
    leftRing.rotation.x = Math.PI / 2;
    leftRing.position.set(-0.6, 1.55, 0);
    this.character.add(leftRing);

    // Right arm
    const rightShoulder = new THREE.Mesh(shoulderGeo, darkMat);
    rightShoulder.position.set(0.6, 1.7, 0);
    this.character.add(rightShoulder);

    const rightArm = new THREE.Mesh(armGeo, jointMat);
    rightArm.position.set(0.6, 1.2, 0);
    this.character.add(rightArm);

    const rightRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.03, 8, 16),
      neonMat
    );
    rightRing.rotation.x = Math.PI / 2;
    rightRing.position.set(0.6, 1.55, 0);
    this.character.add(rightRing);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.35);

    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.set(-0.25, 0.4, 0);
    this.character.add(leftLeg);

    const leftLegStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.7),
      neonMat
    );
    leftLegStrip.position.set(-0.25, 0.4, 0.18);
    this.character.add(leftLegStrip);

    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.set(0.25, 0.4, 0);
    this.character.add(rightLeg);

    const rightLegStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.7),
      neonMat
    );
    rightLegStrip.position.set(0.25, 0.4, 0.18);
    this.character.add(rightLegStrip);

    // Jetpack
    const jetpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.25),
      jointMat
    );
    jetpack.position.set(0, 1.4, -0.35);
    this.character.add(jetpack);

    // Thrusters
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 8);
    
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(-0.15, 1.05, -0.35);
    this.character.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(0.15, 1.05, -0.35);
    this.character.add(rightThruster);

    this.scene.add(this.character);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Subtle idle animation
    if (this.character && !this.isDragging) {
      this.character.rotation.y += 0.003;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e) {
    if (!this.isDragging || !this.character) return;
    
    const deltaX = e.clientX - this.previousMousePosition.x;
    this.character.rotation.y += deltaX * 0.01;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onTouchStart(e) {
    this.isDragging = true;
    this.previousMousePosition = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    };
  }

  onTouchMove(e) {
    if (!this.isDragging || !this.character) return;
    
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    this.character.rotation.y += deltaX * 0.01;
    this.previousMousePosition = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    };
  }

  dispose3DViewer() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    
    this.character = null;
  }

  destroy() {
    this.dispose3DViewer();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

export default ProfileModal;

