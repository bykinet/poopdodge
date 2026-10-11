import * as THREE from 'three';
import { Poop, CollectibleItem } from '../sim/types';

export interface ThreeSceneConfig {
  container: HTMLElement;
  showShadowBorder?: boolean;
  characterTextureUrl?: string;
  characterColor?: number;
}

export class ThreeScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // 3D Figurine Elements
  private playerGroup: THREE.Group;
  private playerPedestal: THREE.Group;
  private playerHeadVolume: THREE.Mesh;
  private playerTorsoVolume: THREE.Mesh;
  private playerLeftArm: THREE.Group;
  private playerRightArm: THREE.Group;
  private playerLeftFoot: THREE.Mesh;
  private playerRightFoot: THREE.Mesh;
  private playerFrontMesh: THREE.Mesh;
  private playerBackMesh: THREE.Mesh;
  private playerMaterial: THREE.MeshStandardMaterial;
  private playerShadowMesh: THREE.Mesh;

  private figurinePlasticMat: THREE.MeshStandardMaterial;
  private figurineAccentMat: THREE.MeshStandardMaterial;

  private ground: THREE.Mesh;
  private skyColor: THREE.Color;
  private climaxSkyColor: THREE.Color;

  // King Butt (3D Flattened Model with Anus)
  private buttGroup: THREE.Group;
  private buttAnusRing: THREE.Mesh;
  private buttAnusHole: THREE.Mesh;
  private buttLeftCheek: THREE.Mesh;
  private buttRightCheek: THREE.Mesh;

  // Dynamic 3D animation states
  private lastPlayerX: number = 50;
  private currentTilt: number = 0;
  private currentYaw: number = 0;
  private catchHopTimer: number = 0;
  private dodgeSpinTimer: number = 0;

  // Textures
  private poopTexture: THREE.Texture | null = null;
  private toiletPaperTexture: THREE.Texture | null = null;

  // Meshes
  private poopMeshes: Map<
    number,
    { group: THREE.Group; shadow: THREE.Mesh; ring?: THREE.LineLoop }
  > = new Map();
  private itemMeshes: Map<number, { group: THREE.Group; shadow: THREE.Mesh; ribbon?: THREE.Mesh }> =
    new Map();

  private showShadowBorder: boolean;
  private isDestroyed = false;

  constructor(config: ThreeSceneConfig) {
    this.showShadowBorder = config.showShadowBorder ?? true;

    // Load zero-margin transparent textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/game-assets/items/poop.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.poopTexture = tex;
    });
    textureLoader.load('/game-assets/items/toilet_paper.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.toiletPaperTexture = tex;
    });

    // Scene setup
    this.scene = new THREE.Scene();
    this.skyColor = new THREE.Color(0x84c2f4);
    this.climaxSkyColor = new THREE.Color(0x282348);
    this.scene.background = this.skyColor.clone();

    // Camera: fixed front elevated view with depth perspective
    const aspect = config.container.clientWidth / config.container.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(50, 32, 70);
    this.camera.lookAt(50, 14, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(config.container.clientWidth, config.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    config.container.appendChild(this.renderer.domElement);

    // Lighting for rich 3D shading & figurine specular reflections
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 1.15);
    dirLight.position.set(45, 65, 45);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    fillLight.position.set(-20, 30, 20);
    this.scene.add(fillLight);

    // Alley Environment
    this.ground = this.createAlleyEnvironment();
    this.scene.add(this.ground);

    // King Butt (3D Flattened Design with Anus)
    const { group, anusRing, anusHole, leftCheek, rightCheek } = this.createKingButt3D();
    this.buttGroup = group;
    this.buttAnusRing = anusRing;
    this.buttAnusHole = anusHole;
    this.buttLeftCheek = leftCheek;
    this.buttRightCheek = rightCheek;
    this.buttGroup.position.set(50, 52, -5);
    this.scene.add(this.buttGroup);

    // ==========================================
    // 3D Collectible Figurine Player Character
    // ==========================================
    const playerWidth = 8 * (2 / 3); // ~5.33
    const playerHeight = 12 * (2 / 3); // ~8.0
    const playerDepth = 1.8;

    // Figurine Materials
    this.figurinePlasticMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5, // Porcelain vinyl skin
      roughness: 0.28,
      metalness: 0.08,
    });

    this.figurineAccentMat = new THREE.MeshStandardMaterial({
      color: config.characterColor !== undefined ? config.characterColor : 0x3b82f6, // Character costume accent
      roughness: 0.28,
      metalness: 0.1,
    });

    this.playerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.28,
      metalness: 0.05,
    });

    this.playerGroup = new THREE.Group();

    // 1. Collectible Acrylic/Resin Pedestal Plinth Base
    const pedestalGroup = new THREE.Group();
    const plinthGeo = new THREE.CylinderGeometry(playerWidth * 0.48, playerWidth * 0.54, 0.35, 32);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x18182b,
      roughness: 0.18,
      metalness: 0.4,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    pedestalGroup.add(plinth);

    // Metallic gold rim around base
    const goldRingGeo = new THREE.TorusGeometry(playerWidth * 0.51, 0.08, 16, 32);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.85,
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.12;
    pedestalGroup.add(goldRing);

    pedestalGroup.position.set(0, -playerHeight * 0.46, 0);
    this.playerGroup.add(pedestalGroup);
    this.playerPedestal = pedestalGroup;

    // 2. 3D Figurine Feet / Shoes
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05,
    });
    const shoeGeo = new THREE.SphereGeometry(0.72, 16, 14);

    this.playerLeftFoot = new THREE.Mesh(shoeGeo, shoeMat);
    this.playerLeftFoot.scale.set(0.9, 0.65, 1.35);
    this.playerLeftFoot.position.set(-playerWidth * 0.22, -playerHeight * 0.4, 0);
    this.playerGroup.add(this.playerLeftFoot);

    this.playerRightFoot = new THREE.Mesh(shoeGeo, shoeMat);
    this.playerRightFoot.scale.set(0.9, 0.65, 1.35);
    this.playerRightFoot.position.set(playerWidth * 0.22, -playerHeight * 0.4, 0);
    this.playerGroup.add(this.playerRightFoot);

    // 3. 3D Figurine Torso (Chubby vinyl body)
    const torsoGeo = new THREE.CylinderGeometry(playerWidth * 0.26, playerWidth * 0.32, playerHeight * 0.36, 24);
    this.playerTorsoVolume = new THREE.Mesh(torsoGeo, this.figurineAccentMat);
    this.playerTorsoVolume.position.set(0, -playerHeight * 0.16, 0);
    this.playerGroup.add(this.playerTorsoVolume);

    // 4. 3D Figurine Arms & Hands
    const armGeo = new THREE.CylinderGeometry(0.3, 0.34, 1.5, 16);
    const handGeo = new THREE.SphereGeometry(0.38, 16, 16);

    // Left Arm
    this.playerLeftArm = new THREE.Group();
    this.playerLeftArm.position.set(-playerWidth * 0.36, -playerHeight * 0.06, 0);
    const armMeshL = new THREE.Mesh(armGeo, this.figurineAccentMat);
    armMeshL.position.set(0, -0.65, 0);
    this.playerLeftArm.add(armMeshL);
    const handMeshL = new THREE.Mesh(handGeo, this.figurinePlasticMat);
    handMeshL.position.set(0, -1.4, 0);
    this.playerLeftArm.add(handMeshL);
    this.playerGroup.add(this.playerLeftArm);

    // Right Arm
    this.playerRightArm = new THREE.Group();
    this.playerRightArm.position.set(playerWidth * 0.36, -playerHeight * 0.06, 0);
    const armMeshR = new THREE.Mesh(armGeo, this.figurineAccentMat);
    armMeshR.position.set(0, -0.65, 0);
    this.playerRightArm.add(armMeshR);
    const handMeshR = new THREE.Mesh(handGeo, this.figurinePlasticMat);
    handMeshR.position.set(0, -1.4, 0);
    this.playerRightArm.add(handMeshR);
    this.playerGroup.add(this.playerRightArm);

    // 5. 3D Figurine Head (Chibi round vinyl head)
    const headGeo = new THREE.SphereGeometry(playerWidth * 0.38, 24, 24);
    this.playerHeadVolume = new THREE.Mesh(headGeo, this.figurinePlasticMat);
    this.playerHeadVolume.scale.set(1.05, 1.0, 0.88);
    this.playerHeadVolume.position.set(0, playerHeight * 0.22, 0);
    this.playerGroup.add(this.playerHeadVolume);

    // Cute rounded ears on sides
    const earGeo = new THREE.SphereGeometry(0.44, 16, 16);
    const earL = new THREE.Mesh(earGeo, this.figurinePlasticMat);
    earL.position.set(-playerWidth * 0.4, playerHeight * 0.22, 0);
    this.playerGroup.add(earL);
    const earR = new THREE.Mesh(earGeo, this.figurinePlasticMat);
    earR.position.set(playerWidth * 0.4, playerHeight * 0.22, 0);
    this.playerGroup.add(earR);

    // 6. Character Standee Facades (Front & Back Decals)
    const playerGeo = new THREE.PlaneGeometry(playerWidth, playerHeight);
    this.playerFrontMesh = new THREE.Mesh(playerGeo, this.playerMaterial);
    this.playerFrontMesh.position.set(0, 0, playerDepth * 0.52);
    this.playerGroup.add(this.playerFrontMesh);

    this.playerBackMesh = new THREE.Mesh(playerGeo, this.playerMaterial);
    this.playerBackMesh.position.set(0, 0, -playerDepth * 0.52);
    this.playerBackMesh.rotation.y = Math.PI;
    this.playerGroup.add(this.playerBackMesh);

    this.playerGroup.position.set(50, playerHeight / 2, 0);
    this.scene.add(this.playerGroup);

    // Player Ground Shadow
    const shadowGeo = new THREE.CircleGeometry(1, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1f2937,
      transparent: true,
      opacity: 0.45,
    });
    this.playerShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.playerShadowMesh.rotation.x = -Math.PI / 2;
    this.playerShadowMesh.scale.set(playerWidth * 0.55, playerWidth * 0.4, 1);
    this.playerShadowMesh.position.set(50, 0.03, 0);
    this.scene.add(this.playerShadowMesh);

    if (config.characterTextureUrl) {
      this.setCharacterTexture(config.characterTextureUrl, config.characterColor);
    }

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

  /**
   * King Butt 3D: Flattened, plump peach design with shaded central crease and 3D anus opening
   */
  private createKingButt3D(): {
    group: THREE.Group;
    anusRing: THREE.Mesh;
    anusHole: THREE.Mesh;
    leftCheek: THREE.Mesh;
    rightCheek: THREE.Mesh;
  } {
    const group = new THREE.Group();

    // Peach-skin 3D standard material
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffaf96,
      roughness: 0.42,
      metalness: 0.05,
    });

    // Left Cheek (flattened along Z for flattened design)
    const leftGeo = new THREE.SphereGeometry(8.5, 32, 32);
    const leftCheek = new THREE.Mesh(leftGeo, skinMat);
    leftCheek.position.set(-5.6, 0, 0);
    leftCheek.scale.set(1.4, 1.1, 0.45); // Slightly flat in depth!
    group.add(leftCheek);

    // Right Cheek (flattened along Z)
    const rightGeo = new THREE.SphereGeometry(8.5, 32, 32);
    const rightCheek = new THREE.Mesh(rightGeo, skinMat);
    rightCheek.position.set(5.6, 0, 0);
    rightCheek.scale.set(1.4, 1.1, 0.45);
    group.add(rightCheek);

    // Upper waistline bridge connecting both cheeks
    const waistGeo = new THREE.CylinderGeometry(4.2, 5.0, 13, 24);
    const waist = new THREE.Mesh(waistGeo, skinMat);
    waist.rotation.z = Math.PI / 2;
    waist.position.set(0, 4.5, -0.2);
    waist.scale.set(1, 0.45, 1);
    group.add(waist);

    // Central Crease Line
    const creaseGeo = new THREE.CylinderGeometry(0.45, 0.45, 12, 16);
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xd97558 });
    const crease = new THREE.Mesh(creaseGeo, creaseMat);
    crease.position.set(0, -0.5, 0.6);
    group.add(crease);

    // 3D Anus Opening (Lower center where big poops emerge!)
    const anusRingGeo = new THREE.TorusGeometry(1.5, 0.45, 16, 24);
    const anusRingMat = new THREE.MeshStandardMaterial({
      color: 0xc86450,
      roughness: 0.5,
      metalness: 0.05,
    });
    const anusRing = new THREE.Mesh(anusRingGeo, anusRingMat);
    anusRing.position.set(0, -3.2, 0.7);
    group.add(anusRing);

    const anusHoleGeo = new THREE.CircleGeometry(1.3, 24);
    const anusHoleMat = new THREE.MeshBasicMaterial({ color: 0x33130d });
    const anusHole = new THREE.Mesh(anusHoleGeo, anusHoleMat);
    anusHole.position.set(0, -3.2, 0.72);
    group.add(anusHole);

    return { group, anusRing, anusHole, leftCheek, rightCheek };
  }

  public setCharacterTexture(textureUrl: string, characterColor?: number) {
    if (characterColor !== undefined && this.figurineAccentMat) {
      this.figurineAccentMat.color.setHex(characterColor);
      this.figurineAccentMat.needsUpdate = true;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;

        if (this.playerMaterial) {
          this.playerMaterial.dispose();
        }

        const newMat = new THREE.MeshStandardMaterial({
          map: tex,
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.28,
          metalness: 0.05,
        });
        newMat.needsUpdate = true;

        this.playerMaterial = newMat;
        this.playerFrontMesh.material = newMat;
        this.playerBackMesh.material = newMat;
      },
      undefined,
      (err) => {
        console.warn('Failed to load character texture:', textureUrl, err);
        if (characterColor !== undefined) {
          this.setPlayerColor(characterColor);
        }
      }
    );
  }

  public setPlayerColor(hex: number) {
    this.playerMaterial.map = null;
    this.playerMaterial.color.setHex(hex);
    this.playerMaterial.needsUpdate = true;
    if (this.figurineAccentMat) {
      this.figurineAccentMat.color.setHex(hex);
      this.figurineAccentMat.needsUpdate = true;
    }
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
    dt: number,
    climaxButtX?: number
  ) {
    // 1. Player Velocity & Directional 3D Figurine Body Turn
    const dx = playerX - this.lastPlayerX;
    this.lastPlayerX = playerX;
    const vx = dx / Math.max(dt, 0.001);

    // 45 degrees body yaw rotation:
    // 오른쪽으로 갈 때는 전면에서 오른쪽 45도 (+Math.PI / 4), 왼쪽으로 갈 때는 전면에서 왼쪽 45도 (-Math.PI / 4)
    const ANGLE_45_DEG = Math.PI / 4; // Exactly 45 degrees
    let targetYaw = 0;
    if (vx > 1.5) {
      targetYaw = ANGLE_45_DEG; // Turn right 45 degrees from front (+45°)
    } else if (vx < -1.5) {
      targetYaw = -ANGLE_45_DEG; // Turn left 45 degrees from front (-45°)
    }

    // Smooth yaw turn interpolation
    this.currentYaw += (targetYaw - this.currentYaw) * Math.min(1, dt * 14);

    // Target dynamic 3D sprint bank roll
    let targetTilt = 0;
    if (vx < -3) {
      targetTilt = -0.32;
    } else if (vx > 3) {
      targetTilt = 0.32;
    }
    this.currentTilt += (targetTilt - this.currentTilt) * Math.min(1, dt * 12);

    // Running stride bounce & idle breathing
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

    const playerHeight = 12 * (2 / 3);
    const basePlayerY = 4.0;
    this.playerGroup.position.x = playerX;
    this.playerGroup.position.y = basePlayerY + runBounce + idleBreathe + specialHop;
    this.playerGroup.position.z = isRunning ? Math.sin(performance.now() * 0.016) * 0.5 : 0;

    // 3D Figurine Limb Animations (Arms & Stepping Shoes)
    const runCycle = performance.now() * 0.022;
    if (isRunning) {
      // Arms swing back and forth like a running toy figurine
      this.playerLeftArm.rotation.x = Math.sin(runCycle) * 0.75;
      this.playerRightArm.rotation.x = -Math.sin(runCycle) * 0.75;
      this.playerLeftArm.rotation.z = 0.2;
      this.playerRightArm.rotation.z = -0.2;

      // Shoes alternate cute steps
      this.playerLeftFoot.position.z = Math.sin(runCycle) * 0.55;
      this.playerLeftFoot.position.y = -playerHeight * 0.4 + Math.max(0, Math.sin(runCycle) * 0.35);
      this.playerRightFoot.position.z = -Math.sin(runCycle) * 0.55;
      this.playerRightFoot.position.y = -playerHeight * 0.4 + Math.max(0, -Math.sin(runCycle) * 0.35);

      // Subtle head bob
      this.playerHeadVolume.position.y = playerHeight * 0.22 + Math.abs(Math.sin(runCycle)) * 0.15;
    } else {
      // Idle resting pose with gentle figurine breathing
      const idle = Math.sin(performance.now() * 0.005) * 0.08;
      this.playerLeftArm.rotation.x = idle;
      this.playerRightArm.rotation.x = -idle;
      this.playerLeftArm.rotation.z = 0.15;
      this.playerRightArm.rotation.z = -0.15;

      this.playerLeftFoot.position.z = 0;
      this.playerLeftFoot.position.y = -playerHeight * 0.4;
      this.playerRightFoot.position.z = 0;
      this.playerRightFoot.position.y = -playerHeight * 0.4;

      this.playerHeadVolume.position.y = playerHeight * 0.22;
    }

    // Special catch hop celebration pose: raise arms high!
    if (this.catchHopTimer > 0) {
      this.playerLeftArm.rotation.z = -1.35;
      this.playerRightArm.rotation.z = 1.35;
      this.playerLeftArm.rotation.x = -0.3;
      this.playerRightArm.rotation.x = -0.3;
    }

    // Ground shadow follows player
    this.playerShadowMesh.position.x = playerX;
    this.playerShadowMesh.scale.x = 2.67 * (1.0 - (specialHop + runBounce) * 0.12);

    if (invincibleTimer > 0) {
      // Comedic 3D wobble on hit
      this.playerGroup.rotation.z = Math.sin(invincibleTimer * 38) * 0.4;
      this.playerGroup.rotation.y = Math.sin(invincibleTimer * 20) * 0.4;
      this.playerGroup.rotation.x = 0.25;
      const blink = Math.sin(invincibleTimer * 30) > 0;
      this.playerMaterial.opacity = blink ? 0.35 : 0.9;
    } else {
      // Smooth body yaw turn, bank roll, and sprint lean forward
      this.playerGroup.rotation.y = this.currentYaw;
      this.playerGroup.rotation.z = this.currentTilt + spinRotation;
      this.playerGroup.rotation.x = isRunning ? 0.2 : 0.0;
      this.playerMaterial.opacity = 1.0;
    }

    // Dynamic squash-and-stretch
    if (isRunning) {
      this.playerGroup.scale.set(0.92, 1.1, 1.0);
    } else if (specialHop > 0) {
      this.playerGroup.scale.set(1.1, 0.9, 1.0);
    } else {
      this.playerGroup.scale.set(1.0, 1.0, 1.0);
    }

    // 2. King Butt: Horizontal movement & Climax Sky
    const targetSky = isClimax ? this.climaxSkyColor : this.skyColor;
    (this.scene.background as THREE.Color).lerp(targetSky, dt * 4.0);

    const targetButtY = isClimax ? 34 : 52;
    this.buttGroup.position.y += (targetButtY - this.buttGroup.position.y) * Math.min(1, dt * 5);

    // Slowly move King Butt horizontally across the arena
    const targetButtX = isClimax ? climaxButtX ?? 50 : 50;
    this.buttGroup.position.x += (targetButtX - this.buttGroup.position.x) * Math.min(1, dt * 6);

    if (isClimax) {
      const pulse = 1.0 + Math.sin(performance.now() * 0.008) * 0.08;
      this.buttGroup.scale.set(pulse, pulse * 1.04, pulse);
      this.buttGroup.rotation.z = Math.sin(performance.now() * 0.005) * 0.05;
    } else {
      this.buttGroup.scale.set(1, 1, 1);
      this.buttGroup.rotation.z = 0;
    }

    // Check if any giant poop is currently emerging to dilate anus
    let isEmergingNow = false;

    // 3. Poops (3D Volume & Swelling Emergence for Big Poop)
    const activePoopIds = new Set<number>();
    for (const poop of poops) {
      activePoopIds.add(poop.id);
      let meshObj = this.poopMeshes.get(poop.id);

      if (!meshObj) {
        meshObj = this.createPoopMeshes(poop);
        this.poopMeshes.set(poop.id, meshObj);
        this.scene.add(meshObj.group);
        this.scene.add(meshObj.shadow);
        if (meshObj.ring) this.scene.add(meshObj.ring);
      }

      if (poop.type === 'giant') {
        const emergenceDuration = 0.5; // Big poop gradually swells out from anus over 0.5s!
        if (poop.elapsedTime < emergenceDuration) {
          isEmergingNow = true;
          const t = poop.elapsedTime / emergenceDuration;
          const easeT = Math.pow(t, 0.85);

          // Emerge directly from King Butt's anus!
          const anusX = this.buttGroup.position.x;
          const anusY = this.buttGroup.position.y - 3.2;
          const anusZ = this.buttGroup.position.z + 0.9;

          // Inflate scale from 0.12 up to full 1.0
          const scale = 0.15 + 0.85 * easeT;
          meshObj.group.scale.set(scale, scale * 1.05, scale);

          // Protrude downwards out from the hole
          meshObj.group.position.set(anusX, anusY - easeT * 3.2, anusZ);
          meshObj.group.rotation.x = t * 1.5;
          meshObj.group.rotation.y = t * 2.0;
          meshObj.group.rotation.z = Math.sin(t * 8) * 0.2;

          // Shadow starts forming beneath
          meshObj.shadow.position.set(anusX, 0.05, 0);
          const shadowR = poop.radius * 0.3 * easeT;
          meshObj.shadow.scale.set(shadowR, shadowR, 1);
          if (meshObj.ring) {
            meshObj.ring.position.set(anusX, 0.06, 0);
            meshObj.ring.scale.set(shadowR, shadowR, 1);
          }
          continue;
        } else {
          // Detached & falling
          const dropElapsed = poop.elapsedTime - emergenceDuration;
          const dropDuration = Math.max(0.1, poop.fallDuration - emergenceDuration);
          const dropT = Math.min(1, dropElapsed / dropDuration);
          const startY = this.buttGroup.position.y - 6.4;
          const poopY = startY * (1.0 - dropT) + 1.0;

          meshObj.group.position.set(poop.x, poopY, 0);
          meshObj.group.scale.set(1.0, 1.0, 1.0);

          // 3D tumbling rotation around multiple axes
          meshObj.group.rotation.x = poop.elapsedTime * 3.8;
          meshObj.group.rotation.y = poop.elapsedTime * 3.2;
          meshObj.group.rotation.z = Math.sin(poop.elapsedTime * 7) * 0.5;

          // Ground shadow
          meshObj.shadow.position.set(poop.x, 0.05, 0);
          const shadowScaleFactor = 0.4 + 0.6 * dropT;
          const currentRadius = poop.radius * shadowScaleFactor;
          meshObj.shadow.scale.set(currentRadius, currentRadius, 1);
          if (meshObj.ring) {
            meshObj.ring.position.set(poop.x, 0.06, 0);
            meshObj.ring.scale.set(currentRadius, currentRadius, 1);
          }
          continue;
        }
      }

      // Normal and Large poops
      const poopY = 1 + poop.height * 31;
      meshObj.group.position.set(poop.x, poopY, 0);

      // True 3D tumbling rotation
      meshObj.group.rotation.x = poop.elapsedTime * 3.6;
      meshObj.group.rotation.y = poop.elapsedTime * 2.8;
      meshObj.group.rotation.z = Math.sin(poop.elapsedTime * 7) * 0.45;

      // 3D squash-and-stretch wobble
      const jiggle = Math.sin(poop.elapsedTime * 14 + poop.id) * 0.12;
      meshObj.group.scale.set(1.0 + jiggle, 1.0 - jiggle, 1.0);

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

    // Anus reacts to big poop emergence
    if (isEmergingNow) {
      this.buttAnusRing.scale.set(1.5, 1.5, 1.5);
      this.buttAnusHole.scale.set(1.5, 1.5, 1.5);
    } else {
      this.buttAnusRing.scale.set(1.0, 1.0, 1.0);
      this.buttAnusHole.scale.set(1.0, 1.0, 1.0);
    }

    // Remove expired poops
    for (const [id, meshObj] of this.poopMeshes.entries()) {
      if (!activePoopIds.has(id)) {
        this.scene.remove(meshObj.group);
        this.scene.remove(meshObj.shadow);
        if (meshObj.ring) this.scene.remove(meshObj.ring);
        this.poopMeshes.delete(id);
      }
    }

    // 4. Collectible Items (3D Volume & Multi-axis Fluttering Roll)
    const activeItemIds = new Set<number>();
    for (const item of items) {
      activeItemIds.add(item.id);
      let itemObj = this.itemMeshes.get(item.id);

      if (!itemObj) {
        itemObj = this.createItemMeshes(item);
        this.itemMeshes.set(item.id, itemObj);
        this.scene.add(itemObj.group);
        this.scene.add(itemObj.shadow);
      }

      const itemY = 1 + item.height * 31;
      itemObj.group.position.set(item.x, itemY, 0);

      // 3D spinning, rolling, and depth fluttering
      itemObj.group.rotation.x = item.elapsedTime * 3.2;
      itemObj.group.rotation.y += dt * 4.5;
      itemObj.group.rotation.z = Math.sin(item.elapsedTime * 6) * 0.55;
      itemObj.group.position.z = Math.sin(item.elapsedTime * 4) * 0.8;

      if (itemObj.ribbon) {
        itemObj.ribbon.rotation.z = Math.sin(item.elapsedTime * 12) * 0.35;
      }

      itemObj.shadow.position.set(item.x, 0.05, 0);
      const shadowScaleFactor = 0.3 + 0.7 * (1.0 - item.height);
      const currentRadius = item.radius * shadowScaleFactor;
      itemObj.shadow.scale.set(currentRadius, currentRadius, 1);
    }

    // Remove expired items
    for (const [id, itemObj] of this.itemMeshes.entries()) {
      if (!activeItemIds.has(id)) {
        this.scene.remove(itemObj.group);
        this.scene.remove(itemObj.shadow);
        this.itemMeshes.delete(id);
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Builds a full 3D Volumetric Poop Model with 3 glossy swirled tiers,
   * cute cartoon eyes, and specular highlight!
   */
  private createPoopMeshes(poop: Poop) {
    const group = new THREE.Group();
    const r = poop.radius;

    // Glossy chocolate brown standard material
    const poopMat = new THREE.MeshStandardMaterial({
      color: 0x6e3b18,
      roughness: 0.32,
      metalness: 0.08,
    });

    // Tier 1 (Base wide coil)
    const baseGeo = new THREE.SphereGeometry(r * 0.95, 18, 14);
    const baseMesh = new THREE.Mesh(baseGeo, poopMat);
    baseMesh.scale.set(1.0, 0.55, 1.0);
    baseMesh.position.set(0, -r * 0.25, 0);
    group.add(baseMesh);

    // Tier 2 (Middle coil)
    const midGeo = new THREE.SphereGeometry(r * 0.72, 18, 14);
    const midMesh = new THREE.Mesh(midGeo, poopMat);
    midMesh.scale.set(1.0, 0.58, 1.0);
    midMesh.position.set(0, r * 0.32, 0);
    group.add(midMesh);

    // Tier 3 (Top spiral tip)
    const topGeo = new THREE.ConeGeometry(r * 0.45, r * 0.75, 16);
    const topMesh = new THREE.Mesh(topGeo, poopMat);
    topMesh.position.set(0, r * 0.9, 0);
    topMesh.rotation.z = -0.18; // cute spiral swirl
    group.add(topMesh);

    // Cute Cartoon Eyes on front
    const eyeWhiteGeo = new THREE.SphereGeometry(r * 0.2, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const eyePupilGeo = new THREE.SphereGeometry(r * 0.1, 10, 10);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-r * 0.32, r * 0.25, r * 0.72);
    group.add(leftEye);
    const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.set(-r * 0.3, r * 0.25, r * 0.88);
    group.add(leftPupil);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(r * 0.32, r * 0.25, r * 0.72);
    group.add(rightEye);
    const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.set(r * 0.3, r * 0.25, r * 0.88);
    group.add(rightPupil);

    // Ground Shadow
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

    return { group, shadow, ring };
  }

  /**
   * Builds a full 3D Volumetric Toilet Paper Model:
   * White cylinder roll with cardboard kraft core hole and fluttering tail ribbon!
   */
  private createItemMeshes(item: CollectibleItem) {
    const group = new THREE.Group();
    const r = item.radius * 1.1;

    // Outer white roll cylinder
    const rollGeo = new THREE.CylinderGeometry(r, r, r * 1.35, 24);
    const rollMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.05,
    });
    const rollMesh = new THREE.Mesh(rollGeo, rollMat);
    group.add(rollMesh);

    // Inner hollow cardboard kraft tube
    const coreGeo = new THREE.CylinderGeometry(r * 0.34, r * 0.34, r * 1.38, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xb58955,
      roughness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Fluttering trailing paper ribbon
    const ribbonGeo = new THREE.PlaneGeometry(r * 0.9, r * 1.6);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      roughness: 0.5,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, -r * 1.1, r * 0.65);
    ribbon.rotation.x = 0.35;
    group.add(ribbon);

    // Ground Shadow
    const shadowGeo = new THREE.CircleGeometry(1, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;

    return { group, shadow, ribbon };
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
