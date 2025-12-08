import * as THREE from 'three';

/**
 * Building Entity
 * Etkileşimli binalar - HER ZAMAN GÖRÜNÜR (frustumCulled = false)
 */
export class Building {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.z = options.z || 0;
    this.color = options.color || 0x00ccff;
    this.title = options.title || 'BİNA';
    this.subtitle = options.subtitle || '';
    this.type = options.type || 'DEFAULT';
    this.contentGenerator = options.contentGenerator || (() => '');
    this.builderFn = options.builderFn;
    
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.x, 0, this.z);
    
    this.animItem = null;
    this.animType = null;
    
    if (this.builderFn) {
      this.builderFn(this.mesh);
      this.animItem = this.mesh.userData.animItem;
      this.animType = this.mesh.userData.animType;
    }
    
    this.addBaseElements();
    
    // ANA BİNALAR HER ZAMAN GÖRÜNÜR - frustum culling kapalı
    this.disableFrustumCulling();
  }

  disableFrustumCulling() {
    // Tüm child mesh'ler için frustumCulled = false
    this.mesh.traverse((child) => {
      if (child.isMesh || child.isLine || child.isPoints) {
        child.frustumCulled = false;
      }
    });
    this.mesh.frustumCulled = false;
  }

  addBaseElements() {
    // Zemin halkası
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(18, 20, 32),
      new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.5;
    ring.frustumCulled = false;
    this.mesh.add(ring);

    // Point light
    const light = new THREE.PointLight(this.color, 1.5, 50);
    light.position.y = 20;
    this.mesh.add(light);

    // Tabela
    this.createSign();
  }

  createSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + this.color.toString(16).padStart(6, '0');
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.type, 128, 48);
    
    const tex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 4),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    sign.position.y = 10;
    sign.position.z = 15;
    sign.frustumCulled = false;
    this.mesh.add(sign);
  }

  update() {
    if (this.animItem) {
      if (this.animType === 'float') {
        this.animItem.position.y = 25 + Math.sin(Date.now() * 0.003) * 2;
      } else {
        this.animItem.rotation.y += 0.02;
      }
    }
    
    // Animate billboard scrolling text (for domain building)
    if (this.mesh.userData.billboardTexture && this.mesh.userData.billboardCanvas) {
      const canvas = this.mesh.userData.billboardCanvas;
      const ctx = canvas.getContext('2d', { alpha: true }); // Alpha channel for transparent background
      
      // Clear entire canvas - transparent background (frame provides the purple border)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Text styling - white text with purple glow (set font first to measure text)
      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#ffffff'; // White text
      ctx.font = 'bold 100px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Draw text multiple times for seamless continuous scrolling
      const text = 'SOMNIA DOMAIN SERVICE';
      
      // Measure actual text width
      const textMetrics = ctx.measureText(text);
      const actualTextWidth = textMetrics.width;
      const spacing = actualTextWidth + 300; // Space between text instances (300px gap)
      
      // Calculate scroll offset for continuous seamless scrolling
      const scrollSpeed = 0.5; // pixels per frame
      const time = Date.now();
      const scrollOffset = (time * scrollSpeed) % spacing;
      
      // Draw text instances to cover entire canvas width with seamless loop
      // Start from left edge and draw enough instances to cover entire width
      const startX = -scrollOffset;
      const endX = canvas.width + spacing;
      
      for (let x = startX; x < endX; x += spacing) {
        ctx.fillText(text, x, canvas.height / 2);
      }
      
      this.mesh.userData.billboardTexture.needsUpdate = true;
    }
  }

  getDistanceTo(position) {
    return position.distanceTo(new THREE.Vector3(this.x, 0, this.z));
  }

  getMesh() {
    return this.mesh;
  }
}

/**
 * Arka plan binası - frustum culling AÇIK (performans için)
 */
export class BackgroundBuilding {
  constructor(x, z, width, depth, height) {
    const mat = new THREE.MeshLambertMaterial({ color: 0x111118 });
    
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      mat
    );
    this.mesh.position.set(x, height / 2, z);
    this.mesh.scale.set(width, height, depth);
    // Arka plan binaları için frustumCulled = true (varsayılan)
  }

  getMesh() {
    return this.mesh;
  }
}

export default Building;
