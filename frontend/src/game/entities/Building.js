import * as THREE from 'three';

/**
 * Building Entity
 * Etkileşimli binalar ve arka plan binaları
 * OPTIMIZED: Material ve geometry basitleştirildi
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
  }

  addBaseElements() {
    // Zemin halkası - OPTIMIZE: Segment azaltıldı
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
  }

  getDistanceTo(position) {
    return position.distanceTo(new THREE.Vector3(this.x, 0, this.z));
  }

  getMesh() {
    return this.mesh;
  }
}

/**
 * Arka plan binası oluşturucu - artık kullanılmıyor, InstancedMesh'e taşındı
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
  }

  getMesh() {
    return this.mesh;
  }
}

export default Building;
