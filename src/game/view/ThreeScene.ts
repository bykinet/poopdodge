import * as THREE from 'three';
import { Poop, CollectibleItem } from '../sim/types';

export interface ThreeSceneConfig {
  container: HTMLElement;
  showShadowBorder?: boolean;
}

export class ThreeScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Elements
  private playerMesh: THREE.Mesh;
  private playerMaterial: THREE.MeshBasicMaterial;
  private ground: THREE.Mesh;
  private skyColor: THREE.Color;
  private climaxSkyColor: THREE.Color;
  private buttGroup: THREE.Group;

  // Dynamic 3D animation states
  private lastPlayerX: number = 50;
  private currentTilt: number = 0;
  private catchHopTimer: number = 0;
  private dodgeSpinTimer: number = 0;

  // Textures
  private poopTexture: THREE.Texture | null = null;
  private toiletPaperTexture: THREE.Texture | null = null;

  // Meshes
  private poopMeshes: Map<number, { mesh: THREE.Mesh; shadow: THREE.Mesh; ring?: THREE.LineLoop }> = new Map();
  private itemMeshes: Map<number, { mesh: THREE.Mesh; shadow: THREE.Mesh }> = new Map();

  private showShadowBorder: boolean;
  private isDestroyed = false;

  constructor(config: ThreeSceneConfig) {
    this.showShadowBorder = config.showShadowBorder ?? true;

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/game-assets/items/poop.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.poopTexture = tex;
    });
    textureLoader.load('/game-assets/items/toilet_paper.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.toiletPaperTexture = tex;
    });

    // Scene
    this.scene = new THREE.Scene();
    this.skyColor = new THREE.Color(0x84c2f4);
    this.climaxSkyColor = new THREE.Color(0x282348);
    this.scene.background = this.skyColor.clone();

    // Camera: slightly elevated Front fixed camera with dynamic 3D depth perception
    const aspect = config.container.clientWidth / config.container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(50, 32, 70);
    this.camera.lookAt(50, 14, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(config.container.clientWidth, config.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    config.container.appendChild(this.renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.85);
    dirLight.position.set(50, 60, 40);
    this.scene.add(dirLight);

    // Anime Alley Background & Ground
    this.ground = this.createAlleyEnvironment();
    this.scene.add(this.ground);

    // Giant Butt (Apricot silhouette width ~27 at top center)
    this.buttGroup = this.createGiantButt();
    this.buttGroup.position.set(50, 52, -5);
    this.scene.add(this.buttGroup);

    // Player Billboard (scaled to 2/3: width ~5.33, height 8.0, transparent cutout)
    const playerWidth = 8 * (2 / 3);
    const playerHeight = 12 * (2 / 3);
    const playerGeo = new THREE.PlaneGeometry(playerWidth, playerHeight);
    this.playerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.08, // Cutout transparent background cleanly!
    });
    this.playerMesh = new THREE.Mesh(playerGeo, this.playerMaterial);
    this.playerMesh.position.set(50, playerHeight / 2, 0);
    this.scene.add(this.playerMesh);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.renderer.domElement.parentElement) return;
    const parent = this.renderer.domElement.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private createAlleyEnvironment(): THREE.Mesh {
    const groundGroup = new THREE.Group();

    // Alley pavement [0, 100]
    const groundGeo = new THREE.PlaneGeometry(120, 40);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd6cbb8 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(50, 0, 0);
    groundGroup.add(groundMesh);

    // Left wall
    const wallGeo = new THREE.BoxGeometry(4, 30, 40);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xbfb3a4 });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-2, 15, 0);
    groundGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(102, 15, 0);
    groundGroup.add(rightWall);

    // Back wall
    const backGeo = new THREE.BoxGeometry(110, 40, 2);
    const backMat = new THREE.MeshLambertMaterial({ color: 0xa99f92 });
    const backWall = new THREE.Mesh(backGeo, backMat);
    backWall.position.set(50, 20, -10);
    groundGroup.add(backWall);

    // Warm street lamp
    const lampPoleGeo = new THREE.CylinderGeometry(0.3, 0.4, 20);
    const lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const lamp = new THREE.Mesh(lampPoleGeo, lampMat);
    lamp.position.set(10, 10, -5);
    groundGroup.add(lamp);

    const lampLight = new THREE.PointLight(0xffe6a3, 1.2, 50);
    lampLight.position.set(10, 20, -4);
    groundGroup.add(lampLight);

    return groundMesh;
  }

  private createGiantButt(): THREE.Group {
    const group = new THREE.Group();
    const buttMat = new THREE.MeshLambertMaterial({ color: 0xffbfa3 });

    const leftCheekGeo = new THREE.SphereGeometry(8, 24, 24);
    const leftCheek = new THREE.Mesh(leftCheekGeo, buttMat);
    leftCheek.position.set(-5.5, 0, 0);
    leftCheek.scale.set(1.1, 1.2, 0.8);
    group.add(leftCheek);

    const rightCheekGeo = new THREE.SphereGeometry(8, 24, 24);
    const rightCheek = new THREE.Mesh(rightCheekGeo, buttMat);
    rightCheek.position.set(5.5, 0, 0);
    rightCheek.scale.set(1.1, 1.2, 0.8);
    group.add(rightCheek);

    const creaseGeo = new THREE.CylinderGeometry(0.5, 0.5, 10);
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xdf8d71 });
    const crease = new THREE.Mesh(creaseGeo, creaseMat);
    crease.position.set(0, -1, 1);
    group.add(crease);

    return group;
  }

  public setCharacterTexture(textureUrl: string) {
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.playerMaterial.map = tex;
        this.playerMaterial.color.setHex(0xffffff);
        this.playerMaterial.transparent = true;
        this.playerMaterial.alphaTest = 0.08;
        this.playerMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        this.playerMaterial.color.setHex(0x3b82f6);
      }
    );
  }

  public setPlayerColor(hex: number) {
    this.playerMaterial.map = null;
    this.playerMaterial.color.setHex(hex);
    this.playerMaterial.needsUpdate = true;
  }

  public triggerCatchHop() {
    this.catchHopTimer = 0.35;
  }

  public triggerDodgeSpin() {
    this.dodgeSpinTimer = 0.32;
  }

  public update(
    playerX: number,
    invincibleTimer: number,
    poops: Poop[],
    items: CollectibleItem[],
    isClimax: boolean,
    dt: number
  ) {
    // 1. Calculate dynamic player velocity & 3D action
    const dx = playerX - this.lastPlayerX;
    this.lastPlayerX = playerX;
    const vx = dx / Math.max(dt, 0.001);

    // Target dynamic 3D sprint lean / tilt angle
    let targetTilt = 0;
    if (vx < -3) {
      targetTilt = -0.36; // Dynamic 3D sprint bank left (-20 deg)
    } else if (vx > 3) {
      targetTilt = 0.36; // Dynamic 3D sprint bank right (+20 deg)
    }

    // Smooth tilt interpolation
    this.currentTilt += (targetTilt - this.currentTilt) * Math.min(1, dt * 14);

    // Vertical running stride hop / bounce & idle breathing
    const isRunning = Math.abs(vx) > 3;
    const runBounce = isRunning ? Math.abs(Math.sin(performance.now() * 0.016)) * 0.55 : 0;
    const idleBreathe = !isRunning ? Math.sin(performance.now() * 0.004) * 0.15 : 0;

    // Process catch hop & dodge somersault spin
    let specialHop = 0;
    if (this.catchHopTimer > 0) {
      this.catchHopTimer -= dt;
      specialHop = Math.sin((1 - this.catchHopTimer / 0.35) * Math.PI) * 1.8;
    }

    let spinRotation = 0;
    if (this.dodgeSpinTimer > 0) {
      this.dodgeSpinTimer -= dt;
      spinRotation = (1 - this.dodgeSpinTimer / 0.32) * Math.PI * 2; // Full 360 somersault!
    }

    const basePlayerY = 4.0;
    this.playerMesh.position.x = playerX;
    this.playerMesh.position.y = basePlayerY + runBounce + idleBreathe + specialHop;

    // Dynamic 3D depth oscillation along Z axis
    this.playerMesh.position.z = isRunning ? Math.sin(performance.now() * 0.016) * 0.6 : 0;

    if (invincibleTimer > 0) {
      // Comedic 3D wobble on hit
      this.playerMesh.rotation.z = Math.sin(invincibleTimer * 38) * 0.4;
      this.playerMesh.rotation.y = Math.sin(invincibleTimer * 20) * 0.4;
      this.playerMesh.rotation.x = 0.25;
      const blink = Math.sin(invincibleTimer * 30) > 0;
      this.playerMaterial.opacity = blink ? 0.35 : 0.9;
    } else {
      // Dynamic 3D running lean, banking, and face-turn
      this.playerMesh.rotation.z = this.currentTilt + spinRotation;
      this.playerMesh.rotation.y = -this.currentTilt * 0.75; // 3D yaw face towards motion
      this.playerMesh.rotation.x = isRunning ? 0.18 : 0.0; // 3D pitch sprint lean forward
      this.playerMaterial.opacity = 1.0;
    }

    // Dynamic squash-and-stretch
    if (isRunning) {
      this.playerMesh.scale.set(0.9, 1.12, 1.0);
    } else if (specialHop > 0) {
      this.playerMesh.scale.set(1.12, 0.88, 1.0);
    } else {
      this.playerMesh.scale.set(1.0, 1.0, 1.0);
    }

    // 2. Climax sky & dynamic 3D giant butt pulse
    const targetSky = isClimax ? this.climaxSkyColor : this.skyColor;
    (this.scene.background as THREE.Color).lerp(targetSky, dt * 4.0);

    const targetButtY = isClimax ? 34 : 52;
    this.buttGroup.position.y += (targetButtY - this.buttGroup.position.y) * Math.min(1, dt * 5);

    if (isClimax) {
      const pulse = 1.0 + Math.sin(performance.now() * 0.008) * 0.09;
      this.buttGroup.scale.set(pulse, pulse * 1.05, pulse);
      this.buttGroup.rotation.z = Math.sin(performance.now() * 0.005) * 0.06;
    } else {
      this.buttGroup.scale.set(1, 1, 1);
      this.buttGroup.rotation.z = 0;
    }

    // 3. Poops with dynamic 3D tumbling rotation
    const activePoopIds = new Set<number>();
    for (const poop of poops) {
      activePoopIds.add(poop.id);
      let meshObj = this.poopMeshes.get(poop.id);

      if (!meshObj) {
        meshObj = this.createPoopMeshes(poop);
        this.poopMeshes.set(poop.id, meshObj);
        this.scene.add(meshObj.mesh);
        this.scene.add(meshObj.shadow);
        if (meshObj.ring) this.scene.add(meshObj.ring);
      }

      // Height decreases from 1 down to 0
      const poopY = 1 + poop.height * 31;
      meshObj.mesh.position.set(poop.x, poopY, 0);

      // True 3D tumbling rotation around multiple axes!
      meshObj.mesh.rotation.x = poop.elapsedTime * 3.6;
      meshObj.mesh.rotation.y = poop.elapsedTime * 2.8;
      meshObj.mesh.rotation.z = Math.sin(poop.elapsedTime * 7) * 0.45;

      // Dynamic 3D squash-and-stretch wobble
      const jiggle = Math.sin(poop.elapsedTime * 14 + poop.id) * 0.14;
      meshObj.mesh.scale.set(1.0 + jiggle, 1.0 - jiggle, 1.0);

      // Shadow on ground
      meshObj.shadow.position.set(poop.x, 0.05, 0);
      const shadowScaleFactor = 0.3 + 0.7 * (1.0 - poop.height);
      const currentRadius = poop.radius * shadowScaleFactor;

      meshObj.shadow.scale.set(currentRadius, currentRadius, 1);
      if (meshObj.ring) {
        meshObj.ring.position.set(poop.x, 0.06, 0);
        meshObj.ring.scale.set(currentRadius, currentRadius, 1);
      }
    }

    // Remove expired poops
    for (const [id, meshObj] of this.poopMeshes.entries()) {
      if (!activePoopIds.has(id)) {
        this.scene.remove(meshObj.mesh);
        this.scene.remove(meshObj.shadow);
        if (meshObj.ring) this.scene.remove(meshObj.ring);
        this.poopMeshes.delete(id);
      }
    }

    // 4. Collectible Items with 3D multi-axis tumbling and floating wave
    const activeItemIds = new Set<number>();
    for (const item of items) {
      activeItemIds.add(item.id);
      let itemObj = this.itemMeshes.get(item.id);

      if (!itemObj) {
        itemObj = this.createItemMeshes(item);
        this.itemMeshes.set(item.id, itemObj);
        this.scene.add(itemObj.mesh);
        this.scene.add(itemObj.shadow);
      }

      const itemY = 1 + item.height * 31;
      itemObj.mesh.position.set(item.x, itemY, 0);

      // True 3D multi-axis fluttering, spinning, and depth floating
      itemObj.mesh.rotation.x = item.elapsedTime * 2.5;
      itemObj.mesh.rotation.y += dt * 4.0;
      itemObj.mesh.rotation.z = Math.sin(item.elapsedTime * 6) * 0.5;
      itemObj.mesh.position.z = Math.sin(item.elapsedTime * 4) * 0.8;

      itemObj.shadow.position.set(item.x, 0.05, 0);
      const shadowScaleFactor = 0.3 + 0.7 * (1.0 - item.height);
      const currentRadius = item.radius * shadowScaleFactor;
      itemObj.shadow.scale.set(currentRadius, currentRadius, 1);
    }

    // Remove expired items
    for (const [id, itemObj] of this.itemMeshes.entries()) {
      if (!activeItemIds.has(id)) {
        this.scene.remove(itemObj.mesh);
        this.scene.remove(itemObj.shadow);
        this.itemMeshes.delete(id);
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private createPoopMeshes(poop: Poop) {
    const size = poop.radius * 2.2;
    const poopGeo = new THREE.PlaneGeometry(size, size);
    const poopMat = new THREE.MeshBasicMaterial({
      map: this.poopTexture,
      transparent: true,
      alphaTest: 0.08, // Cutout transparent background cleanly!
      side: THREE.DoubleSide,
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(poopGeo, poopMat);

    const shadowGeo = new THREE.CircleGeometry(1, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1a120b,
      transparent: true,
      opacity: poop.type === 'giant' ? 0.65 : 0.5,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;

    let ring: THREE.LineLoop | undefined;
    if (this.showShadowBorder) {
      const ringGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
      }
      ringGeo.setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({ color: 0xff3b30, linewidth: 2 });
      ring = new THREE.LineLoop(ringGeo, ringMat);
    }

    return { mesh, shadow, ring };
  }

  private createItemMeshes(item: CollectibleItem) {
    const size = item.radius * 2.5;
    const itemGeo = new THREE.PlaneGeometry(size, size);
    const itemMat = new THREE.MeshBasicMaterial({
      map: this.toiletPaperTexture,
      transparent: true,
      alphaTest: 0.08, // Cutout transparent background cleanly!
      side: THREE.DoubleSide,
      color: 0xffffff,
    });
    const mesh = new THREE.Mesh(itemGeo, itemMat);

    const shadowGeo = new THREE.CircleGeometry(1, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;

    return { mesh, shadow };
  }

  public destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
