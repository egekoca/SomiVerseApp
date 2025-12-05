import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Highways
 * Yükseltilmiş otoyollar sistemi
 * OPTIMIZED: Araba sayısı azaltıldı, InstancedMesh kullanıldı
 */
export class Highways {
  constructor(scene) {
    this.scene = scene;
    this.highways = [];
    this.path = null;
    this.cars = [];
    this.carMesh = null;
    this.lastSpawnTime = 0;
    
    this.create();
  }

  create() {
    // Ana otoyol yolu
    this.path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-100, 20, -40),
      new THREE.Vector3(-30, 20, -40),
      new THREE.Vector3(30, 30, -50),
      new THREE.Vector3(100, 30, -50)
    ]);

    // OPTIMIZE: Segment azaltıldı
    const tubeGeo = new THREE.TubeGeometry(this.path, 20, 3, 6, false);
    const tubeMat = new THREE.MeshLambertMaterial({ color: 0x080808 });
    const highway = new THREE.Mesh(tubeGeo, tubeMat);
    highway.receiveShadow = false;
    this.scene.add(highway);
    this.highways.push(highway);

    // OPTIMIZE: Arabaları InstancedMesh ile oluştur
    this.setupCarPool();
  }

  setupCarPool() {
    const maxCars = CONFIG.highways.maxCars;
    const carGeo = new THREE.BoxGeometry(3, 0.8, 0.8);
    const carMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    this.carMesh = new THREE.InstancedMesh(carGeo, carMat, maxCars);
    this.carMesh.frustumCulled = false;
    this.scene.add(this.carMesh);
    
    // Arabaları başlat
    for (let i = 0; i < maxCars; i++) {
      this.cars.push({
        t: Math.random(), // Rastgele başlangıç pozisyonu
        speed: CONFIG.highways.minSpeed + Math.random() * (CONFIG.highways.maxSpeed - CONFIG.highways.minSpeed),
        active: true
      });
    }
  }

  update() {
    const dummy = new THREE.Object3D();
    
    this.cars.forEach((car, i) => {
      car.t += car.speed;
      if (car.t > 1) car.t = 0;
      
      const pos = this.path.getPointAt(car.t);
      const tangent = this.path.getTangentAt(car.t);
      
      dummy.position.copy(pos);
      dummy.lookAt(pos.clone().add(tangent));
      dummy.updateMatrix();
      
      this.carMesh.setMatrixAt(i, dummy.matrix);
    });
    
    this.carMesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.highways.forEach(highway => {
      highway.geometry.dispose();
      highway.material.dispose();
      this.scene.remove(highway);
    });
    
    if (this.carMesh) {
      this.carMesh.geometry.dispose();
      this.carMesh.material.dispose();
      this.scene.remove(this.carMesh);
    }
    
    this.highways = [];
    this.cars = [];
  }
}

export default Highways;
