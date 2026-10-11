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
      this.poopTexture = tex;
    });
    textureLoader.load('/game-assets/items/toilet_paper.png', (tex) => {
      this.toiletPaperTexture = tex;
    });

    // Scene
    this.scene = new THREE.Scene();
    this.skyColor = new THREE.Color(0x84c2f4);
    this.climaxSkyColor = new THREE.Color(0x282348);
    this.scene.background = this.skyColor.clone();

    // Camera: slightly elevated Front fixed camera
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

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    dirLight.position.set(50, 60, 40);
    this.scene.add(dirLight);

    // Anime Alley Background & Ground
    this.ground = this.createAlleyEnvironment();
    this.scene.add(this.ground);

    // Giant Butt (Apricot silhouette width ~27 [40 * 2/3] at top center)
    this.buttGroup = this.createGiantButt();
    this.buttGroup.position.set(50, 52, -5); // Hidden above top initially
    this.scene.add(this.buttGroup);

    // Player Billboard (scaled to 2/3: width ~5.33, height 8.0)
    const playerWidth = 8 * (2 / 3);
    const playerHeight = 12 * (2 / 3);
    const playerGeo = new THREE.PlaneGeometry(playerWidth, playerHeight);
    this.playerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
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
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd6cbb8 }); // Warm brick stone
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

    // Back wall / alley buildings
    const backGeo = new THREE.BoxGeometry(110, 40, 2);
    const backMat = new THREE.MeshLambertMaterial({ color: 0xa99f92 });
    const backWall = new THREE.Mesh(backGeo, backMat);
    backWall.position.set(50, 20, -10);
    groundGroup.add(backWall);

    // Warm street lamp on alley
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
    // 2/3 scale apricot silhouette
    const buttMat = new THREE.MeshLambertMaterial({ color: 0xffbfa3 });

    // Left cheek
    const leftCheekGeo = new THREE.SphereGeometry(8, 24, 24);
    const leftCheek = new THREE.Mesh(leftCheekGeo, buttMat);
    leftCheek.position.set(-5.5, 0, 0);
    leftCheek.scale.set(1.1, 1.2, 0.8);
    group.add(leftCheek);

    // Right cheek
    const rightCheekGeo = new THREE.SphereGeometry(8, 24, 24);
    const rightCheek = new THREE.Mesh(rightCheekGeo, buttMat);
    rightCheek.position.set(5.5, 0, 0);
    rightCheek.scale.set(1.1, 1.2, 0.8);
    group.add(rightCheek);

    // Comic outline
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
        this.playerMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback color if not loadable
        this.playerMaterial.color.setHex(0x3b82f6);
      }
    );
  }

  public setPlayerColor(hex: number) {
    this.playerMaterial.map = null;
    this.playerMaterial.color.setHex(hex);
    this.playerMaterial.needsUpdate = true;
  }

  public update(
    playerX: number,
    invincibleTimer: number,
    poops: Poop[],
    items: CollectibleItem[],
    isClimax: boolean,
    dt: number
  ) {
    // 1. Update Player
    this.playerMesh.position.x = playerX;
    if (invincibleTimer > 0) {
      // Blinking invincibility effect
      const blink = Math.sin(invincibleTimer * 30) > 0;
      this.playerMaterial.opacity = blink ? 0.35 : 0.9;
    } else {
      this.playerMaterial.opacity = 1.0;
    }

    // 2. Climax sky & giant butt
    const targetSky = isClimax ? this.climaxSkyColor : this.skyColor;
    (this.scene.background as THREE.Color).lerp(targetSky, dt * 4.0);

    const targetButtY = isClimax ? 34 : 52;
    this.buttGroup.position.y += (targetButtY - this.buttGroup.position.y) * Math.min(1, dt * 5);

    // 3. Poops & Shadows
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

      // Height decreases from 1 (sky, y ~ 32) down to 0 (ground, y ~ 1)
      const poopY = 1 + poop.height * 31;
      meshObj.mesh.position.set(poop.x, poopY, 0);

      // Shadow center is poop x on ground
      meshObj.shadow.position.set(poop.x, 0.05, 0);

      // Shadow radius: 30% at height 1, 100% at height 0
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

    // 4. Collectible Items (Toilet paper)
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
      itemObj.mesh.rotation.z = Math.sin(item.elapsedTime * 6) * 0.15; // gentle playful sway

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
      side: THREE.DoubleSide,
      color: this.poopTexture ? 0xffffff : poop.type === 'giant' ? 0x5a2d0c : 0x7a431d,
    });
    const mesh = new THREE.Mesh(poopGeo, poopMat);

    // Ground Shadow disk
    const shadowGeo = new THREE.CircleGeometry(1, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1a120b,
      transparent: true,
      opacity: poop.type === 'giant' ? 0.65 : 0.5,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;

    // Thin outline border
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
      side: THREE.DoubleSide,
      color: this.toiletPaperTexture ? 0xffffff : 0xffffff,
    });
    const mesh = new THREE.Mesh(itemGeo, itemMat);

    // Soft cyan/gold ground shadow for items
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
