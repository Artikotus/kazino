import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const STORAGE_KEY = "artikotus-drone-record";
const FORWARD_SPEED = 24;
const SIDE_SPEED = 18;
const VERTICAL_SPEED = 16;
const MAX_SIDE = 23;
const MIN_ALTITUDE = 2.4;
const MAX_ALTITUDE = 24;
const LOW_ALTITUDE_LIMIT = 6.4;
const TREE_SPAWN_AHEAD = 420;
const CAT_SPAWN_AHEAD = 400;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (start, end, alpha) => start + (end - start) * alpha;
const randRange = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(randRange(min, max + 1));

class DroneCatsGame {
  constructor() {
    this.sceneRoot = document.getElementById("sceneRoot");
    this.messageBox = document.getElementById("messageBox");
    this.startOverlay = document.getElementById("startOverlay");
    this.pauseOverlay = document.getElementById("pauseOverlay");
    this.gameOverOverlay = document.getElementById("gameOverOverlay");
    this.ui = {
      catsCount: document.getElementById("catsCount"),
      distanceCount: document.getElementById("distanceCount"),
      healthCount: document.getElementById("healthCount"),
      bestCount: document.getElementById("bestCount"),
      fishCooldown: document.getElementById("fishCooldown"),
      shieldCooldown: document.getElementById("shieldCooldown"),
      shieldTimer: document.getElementById("shieldTimer"),
      altitudeState: document.getElementById("altitudeState"),
      finalDistance: document.getElementById("finalDistance"),
      recordDistance: document.getElementById("recordDistance"),
      finalCats: document.getElementById("finalCats")
    };

    this.bestDistance = Number(window.localStorage.getItem(STORAGE_KEY) || "0");
    this.keys = {};
    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.messageTimer = 0;
    this.fishDrops = [];
    this.explosions = [];
    this.bullets = [];
    this.pendingShots = [];
    this.trees = [];
    this.catGroups = [];
    this.droneVelocity = new THREE.Vector3();

    this.setupThree();
    this.setupScene();
    this.bindEvents();
    this.resetGame();
    this.animate();
  }

  setupThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.sceneRoot.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x08111f, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

    this.worldGroup = new THREE.Group();
    this.hazardGroup = new THREE.Group();
    this.actorGroup = new THREE.Group();
    this.effectGroup = new THREE.Group();

    this.scene.add(this.worldGroup);
    this.scene.add(this.hazardGroup);
    this.scene.add(this.actorGroup);
    this.scene.add(this.effectGroup);
  }

  setupScene() {
    const ambient = new THREE.AmbientLight(0x9fb6ff, 0.7);
    const hemi = new THREE.HemisphereLight(0x9ad4ff, 0x102334, 1.1);
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(20, 28, -10);
    this.scene.add(ambient, hemi, sun);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x143622,
      roughness: 0.9,
      metalness: 0.05
    });
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 1600), groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.worldGroup.add(this.ground);

    const canyonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c2436,
      roughness: 0.96
    });
    this.leftWall = new THREE.Mesh(new THREE.BoxGeometry(16, 28, 1600), canyonMaterial);
    this.rightWall = this.leftWall.clone();
    this.leftWall.position.set(-40, 10, 0);
    this.rightWall.position.set(40, 10, 0);
    this.worldGroup.add(this.leftWall, this.rightWall);

    this.trackMarkers = [];
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0x99d7ff,
      emissive: 0x1c5c8c,
      emissiveIntensity: 1.8
    });
    for (let index = 0; index < 24; index += 1) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 10), markerMaterial);
      marker.position.set(0, 0.03, index * 32);
      this.worldGroup.add(marker);
      this.trackMarkers.push(marker);
    }

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let index = 0; index < 350; index += 1) {
      starPositions.push(randRange(-320, 320), randRange(70, 220), randRange(-400, 900));
    }
    starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xd5ebff, size: 1.5, sizeAttenuation: true }));
    this.scene.add(stars);
  }

  bindEvents() {
    document.getElementById("startGameBtn").addEventListener("click", () => this.startGame());
    document.getElementById("resumeGameBtn").addEventListener("click", () => this.togglePause(false));
    document.getElementById("restartGameBtn").addEventListener("click", () => this.restartGame());
    document.getElementById("retryGameBtn").addEventListener("click", () => this.restartGame());

    window.addEventListener("resize", () => this.handleResize());

    window.addEventListener("keydown", (event) => {
      if (["Space", "ControlLeft", "ControlRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }

      if (event.code === "Escape") {
        event.preventDefault();
        if (!this.state.started || this.state.gameOver) {
          return;
        }
        this.togglePause();
        return;
      }

      this.keys[event.code] = true;
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
        this.state.clickTarget = null;
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false;
    });

    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      if (!this.state.started || this.state.paused || this.state.gameOver) {
        return;
      }
      this.setClickTarget(event);
    });
  }

  resetGame() {
    this.state = {
      started: false,
      paused: false,
      gameOver: false,
      health: 100,
      distance: 0,
      catsExploded: 0,
      fishCooldown: 0,
      shieldCooldown: 0,
      shieldTime: 0,
      invulnerability: 0,
      clickTarget: null,
      pvoBurstTimer: 2.2
    };
    this.elapsedTime = 0;
    this.messageTimer = 0;
    this.keys = {};
    this.droneVelocity.set(0, 0, 0);

    this.clearGroup(this.hazardGroup);
    this.clearGroup(this.actorGroup);
    this.clearGroup(this.effectGroup);
    this.fishDrops = [];
    this.explosions = [];
    this.bullets = [];
    this.pendingShots = [];
    this.trees = [];
    this.catGroups = [];

    this.createDrone();
    this.createPvo();

    this.drone.position.set(0, 10, 0);
    this.nextTreeSpawnZ = 40;
    this.nextCatSpawnZ = 55;
    this.spawnInitialWorld();
    this.hideOverlay(this.pauseOverlay);
    this.hideOverlay(this.gameOverOverlay);
    this.showOverlay(this.startOverlay);
    this.updateUI();
    this.showMessage("Подготовься к полету и нажми кнопку старта.", 2.6);
  }

  restartGame() {
    this.resetGame();
    this.startGame();
  }

  startGame() {
    this.hideOverlay(this.startOverlay);
    this.hideOverlay(this.pauseOverlay);
    this.hideOverlay(this.gameOverOverlay);
    this.state.started = true;
    this.state.paused = false;
    this.state.gameOver = false;
    this.clock.start();
    this.showMessage("Полет начался. ПВО уже ищет тебя.", 2.2);
  }

  togglePause(forceValue) {
    if (!this.state.started || this.state.gameOver) {
      return;
    }
    const nextValue = typeof forceValue === "boolean" ? forceValue : !this.state.paused;
    this.state.paused = nextValue;
    if (this.state.paused) {
      this.showOverlay(this.pauseOverlay);
      this.showMessage("Пауза.", 1.2);
    } else {
      this.hideOverlay(this.pauseOverlay);
      this.clock.getDelta();
      this.showMessage("Полет продолжается.", 1.2);
    }
  }

  createDrone() {
    this.drone = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x5fd7ff, emissive: 0x0a4d6c, emissiveIntensity: 1.1 })
    );
    body.castShadow = true;
    this.drone.add(body);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 1.6, 5),
      new THREE.MeshStandardMaterial({ color: 0xb8f0ff, emissive: 0x1b5a72, emissiveIntensity: 0.8 })
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 2.2);
    this.drone.add(nose);

    const wingGeometry = new THREE.BoxGeometry(6.2, 0.2, 0.6);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2e48, metalness: 0.55, roughness: 0.3 });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = 0.2;
    this.drone.add(wings);

    this.rotors = [];
    const rotorPositions = [
      [-2.4, 0.45, 1.2],
      [2.4, 0.45, 1.2],
      [-2.4, 0.45, -1.2],
      [2.4, 0.45, -1.2]
    ];
    rotorPositions.forEach((position) => {
      const rotor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: 0xdce8f4, emissive: 0x5ea9d6, emissiveIntensity: 0.5 })
      );
      rotor.rotation.z = Math.PI / 2;
      rotor.position.set(position[0], position[1], position[2]);

      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.04, 0.18),
        new THREE.MeshBasicMaterial({ color: 0xe7f4ff, transparent: true, opacity: 0.75 })
      );
      rotor.add(blade);
      this.rotors.push(rotor);
      this.drone.add(rotor);
    });

    this.droneShield = new THREE.Mesh(
      new THREE.SphereGeometry(2.65, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0x55d8ff,
        transparent: true,
        opacity: 0.15,
        wireframe: true
      })
    );
    this.droneShield.visible = false;
    this.drone.add(this.droneShield);

    this.actorGroup.add(this.drone);
  }

  createPvo() {
    this.pvo = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 5.2, 3.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x646c78, roughness: 0.85 })
    );
    base.position.y = 1.7;
    this.pvo.add(base);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 2.1, 4.8),
      new THREE.MeshStandardMaterial({ color: 0x4b5969, metalness: 0.25, roughness: 0.48 })
    );
    head.position.y = 4.2;
    this.pvoHead = head;
    this.pvo.add(head);

    this.muzzles = [];
    [-1.7, -0.6, 0.6, 1.7].forEach((xOffset) => {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 5.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x2f3945, metalness: 0.55, roughness: 0.3 })
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(xOffset, 0.2, 2.9);
      head.add(barrel);
      this.muzzles.push(barrel);
    });

    this.pvo.position.set(0, 0, 180);
    this.actorGroup.add(this.pvo);
  }

  spawnInitialWorld() {
    while (this.nextTreeSpawnZ < TREE_SPAWN_AHEAD) {
      this.maybeSpawnTree();
    }
    while (this.nextCatSpawnZ < CAT_SPAWN_AHEAD) {
      this.spawnCatGroup();
    }
  }

  maybeSpawnTree() {
    const z = this.nextTreeSpawnZ;
    this.nextTreeSpawnZ += randRange(18, 34);
    if (Math.random() < 0.15) {
      return;
    }

    const x = randRange(-22, 22);
    const height = randRange(8, 16);
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.8, height * 0.38, 8),
      new THREE.MeshStandardMaterial({ color: 0x7b4d27, roughness: 0.98 })
    );
    trunk.position.y = height * 0.19;
    tree.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(height * 0.22, height * 0.72, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d8f41, roughness: 0.95 })
    );
    leaves.position.y = height * 0.65;
    tree.add(leaves);

    tree.position.set(x, 0, z);
    this.hazardGroup.add(tree);
    this.trees.push({
      mesh: tree,
      x,
      z,
      radius: height * 0.18 + 0.8,
      height,
      hitCooldown: 0
    });
  }

  spawnCatGroup() {
    const z = this.nextCatSpawnZ;
    this.nextCatSpawnZ += randRange(28, 44);

    const baseX = randRange(-18, 18);
    const catCount = randInt(1, 3);
    const group = new THREE.Group();
    group.position.set(0, 0, z);
    this.hazardGroup.add(group);

    const cats = [];
    for (let index = 0; index < catCount; index += 1) {
      const xOffset = baseX + (index - (catCount - 1) / 2) * 3.1;
      const catRoot = new THREE.Group();
      catRoot.position.set(xOffset, 0, 0);

      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe2a65c, roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.8), bodyMaterial);
      body.position.y = 1;
      catRoot.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.95), bodyMaterial.clone());
      head.position.set(0, 1.65, 0.65);
      catRoot.add(head);

      const paw = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 1.6, 0.34),
        new THREE.MeshStandardMaterial({ color: 0xffd1a5, roughness: 0.7 })
      );
      paw.position.set(0.62, 0.95, 0.82);
      paw.rotation.z = -0.18;
      catRoot.add(paw);

      const ears = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.35, 4),
        new THREE.MeshStandardMaterial({ color: 0xc97e3f, roughness: 0.9 })
      );
      ears.position.set(-0.18, 2.18, 0.65);
      ears.rotation.z = 0.5;
      catRoot.add(ears);

      const ears2 = ears.clone();
      ears2.position.x = 0.18;
      ears2.rotation.z = -0.5;
      catRoot.add(ears2);

      group.add(catRoot);
      cats.push({
        root: catRoot,
        paw,
        body,
        head,
        x: xOffset,
        attackCooldown: randRange(0.25, 1.1),
        attackAnim: 0,
        stunTime: 0
      });
    }

    this.catGroups.push({ mesh: group, z, cats });
  }

  clearGroup(group) {
    while (group.children.length) {
      group.remove(group.children[0]);
    }
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setClickTarget(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = 1 - ((event.clientY - rect.top) / rect.height);
    this.state.clickTarget = {
      x: clamp(-normalizedX * (MAX_SIDE * 0.9), -MAX_SIDE, MAX_SIDE),
      y: clamp(MIN_ALTITUDE + normalizedY * (MAX_ALTITUDE - MIN_ALTITUDE), MIN_ALTITUDE, MAX_ALTITUDE)
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta() || 0.016, 0.05);

    if (this.state.started && !this.state.paused && !this.state.gameOver) {
      this.updateGameplay(delta);
    }

    this.updateMessage(delta);
    this.updateAmbientAnimation(delta);
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  updateGameplay(delta) {
    this.elapsedTime += delta;
    this.state.distance += FORWARD_SPEED * delta;
    this.state.fishCooldown = Math.max(0, this.state.fishCooldown - delta);
    this.state.shieldCooldown = Math.max(0, this.state.shieldCooldown - delta);
    this.state.shieldTime = Math.max(0, this.state.shieldTime - delta);
    this.state.invulnerability = Math.max(0, this.state.invulnerability - delta);
    this.state.pvoBurstTimer -= delta;

    this.handleAbilities();
    this.updateDroneMovement(delta);
    this.updateWorld();
    this.updatePvo(delta);
    this.updateBullets(delta);
    this.updateFish(delta);
    this.updateCats(delta);
    this.updateTrees(delta);
    this.updateExplosions(delta);
    this.spawnAhead();
    this.updateUI();
  }

  updateDroneMovement(delta) {
    this.drone.position.z += FORWARD_SPEED * delta;

    const left = this.keys.KeyA ? 1 : 0;
    const right = this.keys.KeyD ? -1 : 0;
    const down = this.keys.KeyS ? -1 : 0;
    const up = this.keys.KeyW ? 1 : 0;
    const horizontalInput = left + right;
    const verticalInput = up + down;

    const hasDirectInput = horizontalInput !== 0 || verticalInput !== 0;

    let targetHorizontalVelocity = 0;
    let targetVerticalVelocity = 0;

    if (hasDirectInput) {
      targetHorizontalVelocity = horizontalInput * SIDE_SPEED;
      targetVerticalVelocity = verticalInput * VERTICAL_SPEED;
    } else if (this.state.clickTarget) {
      const dx = this.state.clickTarget.x - this.drone.position.x;
      const dy = this.state.clickTarget.y - this.drone.position.y;
      targetHorizontalVelocity = clamp(dx * 2.2, -SIDE_SPEED, SIDE_SPEED);
      targetVerticalVelocity = clamp(dy * 2.2, -VERTICAL_SPEED, VERTICAL_SPEED);
      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) {
        this.state.clickTarget = null;
      }
    }

    const smoothing = clamp(delta * 6, 0, 1);
    this.droneVelocity.x = lerp(this.droneVelocity.x, targetHorizontalVelocity, smoothing);
    this.droneVelocity.y = lerp(this.droneVelocity.y, targetVerticalVelocity, smoothing);

    this.drone.position.x = clamp(this.drone.position.x + this.droneVelocity.x * delta, -MAX_SIDE, MAX_SIDE);
    this.drone.position.y = clamp(this.drone.position.y + this.droneVelocity.y * delta, MIN_ALTITUDE, MAX_ALTITUDE);

    this.drone.rotation.z = THREE.MathUtils.lerp(this.drone.rotation.z, -this.droneVelocity.x * 0.018, 0.12);
    this.drone.rotation.x = THREE.MathUtils.lerp(this.drone.rotation.x, this.droneVelocity.y * 0.012, 0.12);
  }

  updateWorld() {
    this.ground.position.z = this.drone.position.z + 470;
    this.leftWall.position.z = this.ground.position.z;
    this.rightWall.position.z = this.ground.position.z;

    const baseMarkerZ = Math.floor((this.drone.position.z - 40) / 32) * 32;
    this.trackMarkers.forEach((marker, index) => {
      marker.position.z = baseMarkerZ + index * 32;
    });
  }

  handleAbilities() {
    if (this.keys.Space && this.state.fishCooldown <= 0) {
      this.dropFish();
      this.keys.Space = false;
    }

    if ((this.keys.ControlLeft || this.keys.ControlRight) && this.state.shieldCooldown <= 0) {
      this.activateShield();
      this.keys.ControlLeft = false;
      this.keys.ControlRight = false;
    }

    this.droneShield.visible = this.state.shieldTime > 0;
    this.droneShield.rotation.y += 0.08;
  }

  dropFish() {
    const fish = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffa95b, emissive: 0xff6517, emissiveIntensity: 0.9 })
    );
    fish.scale.set(1.2, 0.65, 2.2);
    fish.position.copy(this.drone.position);
    fish.position.y -= 0.8;
    this.effectGroup.add(fish);

    this.fishDrops.push({
      mesh: fish,
      velocity: new THREE.Vector3(0, -4.5, 4.5)
    });

    this.state.fishCooldown = 25;
    this.showMessage("Рыбка-обманка сброшена.", 1.5);
  }

  activateShield() {
    this.state.shieldTime = 3;
    this.state.shieldCooldown = 20;
    this.showMessage("Щит ПВО активирован на 3 секунды.", 1.6);
  }

  updatePvo(delta) {
    const aheadDistance = 170;
    this.pvo.position.z = this.drone.position.z + aheadDistance;
    this.pvo.position.x = Math.sin(this.elapsedTime * 0.35) * 8;
    this.pvoHead.lookAt(this.drone.position.x, this.drone.position.y, this.drone.position.z);

    const canShoot = this.drone.position.y > LOW_ALTITUDE_LIMIT;
    if (canShoot && this.state.pvoBurstTimer <= 0) {
      this.startPvoBurst();
      this.state.pvoBurstTimer = 5;
    }

    for (let index = this.pendingShots.length - 1; index >= 0; index -= 1) {
      const shot = this.pendingShots[index];
      shot.delay -= delta;
      if (shot.delay <= 0) {
        this.spawnBullet(shot.muzzleIndex);
        this.pendingShots.splice(index, 1);
      }
    }
  }

  startPvoBurst() {
    const bulletCount = randInt(4, 7);
    for (let index = 0; index < bulletCount; index += 1) {
      this.pendingShots.push({
        delay: index * 0.22,
        muzzleIndex: index % this.muzzles.length
      });
    }
    this.showMessage(`ПВО выпускает очередь из ${bulletCount} пуль.`, 1.7);
  }

  spawnBullet(muzzleIndex) {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffde59, emissive: 0xff8a00, emissiveIntensity: 1.2 })
    );

    const muzzle = this.muzzles[muzzleIndex];
    const worldPosition = new THREE.Vector3();
    muzzle.getWorldPosition(worldPosition);
    bullet.position.copy(worldPosition);
    this.effectGroup.add(bullet);

    const target = this.drone.position.clone();
    target.x += randRange(-2.6, 2.6);
    target.y += randRange(-1.8, 1.8);
    target.z += randRange(2, 12);

    const velocity = target.sub(worldPosition).normalize().multiplyScalar(11);
    this.bullets.push({
      mesh: bullet,
      velocity,
      life: 20
    });
  }

  updateBullets(delta) {
    for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
      const bullet = this.bullets[index];
      bullet.mesh.position.addScaledVector(bullet.velocity, delta);
      bullet.life -= delta;

      if (bullet.life <= 0 || bullet.mesh.position.z < this.drone.position.z - 30) {
        this.removeBullet(index);
        continue;
      }

      if (bullet.mesh.position.distanceTo(this.drone.position) < 2.2) {
        if (this.state.shieldTime > 0) {
          this.makeExplosion(bullet.mesh.position.clone(), 0x72e9ff, 0.45);
          this.showMessage("Щит поглотил попадание ПВО.", 0.9);
        } else {
          this.applyDamage(14, "ПВО попало по дрону.");
          this.makeExplosion(bullet.mesh.position.clone(), 0xffc14d, 0.35);
        }
        this.removeBullet(index);
      }
    }
  }

  removeBullet(index) {
    const bullet = this.bullets[index];
    this.effectGroup.remove(bullet.mesh);
    this.bullets.splice(index, 1);
  }

  updateFish(delta) {
    for (let index = this.fishDrops.length - 1; index >= 0; index -= 1) {
      const fish = this.fishDrops[index];
      fish.velocity.y -= 14 * delta;
      fish.mesh.position.addScaledVector(fish.velocity, delta);
      fish.mesh.rotation.z += 7 * delta;
      fish.mesh.rotation.x += 3 * delta;

      if (fish.mesh.position.y <= 0.7) {
        const explodeAt = fish.mesh.position.clone();
        explodeAt.y = 1;
        this.effectGroup.remove(fish.mesh);
        this.fishDrops.splice(index, 1);
        this.explodeFish(explodeAt);
      }
    }
  }

  explodeFish(position) {
    let stunnedCats = 0;
    const radius = 10;

    this.catGroups.forEach((group) => {
      if (Math.abs(group.z - position.z) > radius) {
        return;
      }
      group.cats.forEach((cat) => {
        const dx = cat.x - position.x;
        const dz = group.z - position.z;
        if ((dx * dx) + (dz * dz) <= radius * radius) {
          cat.stunTime = Math.max(cat.stunTime, 6);
          stunnedCats += 1;
        }
      });
    });

    this.state.catsExploded += stunnedCats;
    this.makeExplosion(position, 0xff8c45, 0.8);
    this.showMessage(
      stunnedCats > 0 ? `Рыбка взорвалась и оглушила котов: ${stunnedCats}.` : "Рыбка взорвалась, но котов рядом не было.",
      1.8
    );
  }

  makeExplosion(position, color, scale) {
    const explosion = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 18),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    );
    explosion.position.copy(position);
    explosion.scale.setScalar(scale);
    this.effectGroup.add(explosion);
    this.explosions.push({ mesh: explosion, life: 0.55, grow: scale * 14 });
  }

  updateExplosions(delta) {
    for (let index = this.explosions.length - 1; index >= 0; index -= 1) {
      const explosion = this.explosions[index];
      explosion.life -= delta;
      explosion.mesh.scale.addScalar(delta * explosion.grow);
      explosion.mesh.material.opacity = Math.max(0, explosion.life);
      if (explosion.life <= 0) {
        this.effectGroup.remove(explosion.mesh);
        this.explosions.splice(index, 1);
      }
    }
  }

  updateCats(delta) {
    const isLow = this.drone.position.y <= LOW_ALTITUDE_LIMIT;
    for (let groupIndex = this.catGroups.length - 1; groupIndex >= 0; groupIndex -= 1) {
      const group = this.catGroups[groupIndex];
      group.mesh.position.z = group.z;

      if (group.z < this.drone.position.z - 40) {
        this.hazardGroup.remove(group.mesh);
        this.catGroups.splice(groupIndex, 1);
        continue;
      }

      group.cats.forEach((cat, catIndex) => {
        cat.attackCooldown -= delta;
        cat.attackAnim = Math.max(0, cat.attackAnim - delta * 4);
        cat.stunTime = Math.max(0, cat.stunTime - delta);

        cat.root.position.y = Math.sin(this.elapsedTime * 3.5 + catIndex) * 0.08;
        cat.body.material.color.setHex(cat.stunTime > 0 ? 0x5fa7ff : 0xe2a65c);
        cat.head.material.color.setHex(cat.stunTime > 0 ? 0x8cc1ff : 0xe2a65c);
        cat.paw.rotation.z = cat.attackAnim > 0 ? 0.85 - cat.attackAnim * 1.2 : -0.18;

        if (!isLow || cat.stunTime > 0) {
          return;
        }

        const nearZ = Math.abs(group.z - this.drone.position.z) < 5.5;
        const nearX = Math.abs(cat.x - this.drone.position.x) < 3.6;
        if (nearZ && nearX && cat.attackCooldown <= 0) {
          cat.attackCooldown = 1.3;
          cat.attackAnim = 1;
          this.applyDamage(18, "Кот задел дрон лапой.");
        }
      });
    }
  }

  updateTrees(delta) {
    for (let index = this.trees.length - 1; index >= 0; index -= 1) {
      const tree = this.trees[index];
      tree.hitCooldown = Math.max(0, tree.hitCooldown - delta);
      if (tree.z < this.drone.position.z - 60) {
        this.hazardGroup.remove(tree.mesh);
        this.trees.splice(index, 1);
        continue;
      }

      const nearZ = Math.abs(tree.z - this.drone.position.z) < 3.2;
      const nearX = Math.abs(tree.x - this.drone.position.x) < tree.radius + 0.8;
      const lowEnough = this.drone.position.y < tree.height;

      if (nearZ && nearX && lowEnough && tree.hitCooldown <= 0) {
        tree.hitCooldown = 1.2;
        this.applyDamage(24, "Дрон врезался в дерево.");
      }
    }
  }

  spawnAhead() {
    while (this.nextTreeSpawnZ < this.drone.position.z + TREE_SPAWN_AHEAD) {
      this.maybeSpawnTree();
    }
    while (this.nextCatSpawnZ < this.drone.position.z + CAT_SPAWN_AHEAD) {
      this.spawnCatGroup();
    }
  }

  applyDamage(amount, text) {
    if (this.state.gameOver) {
      return;
    }
    if (this.state.invulnerability > 0) {
      return;
    }

    this.state.health = Math.max(0, this.state.health - amount);
    this.state.invulnerability = 0.75;
    this.showMessage(text, 1.3);

    const flashColor = 0xff4d6d;
    this.makeExplosion(this.drone.position.clone(), flashColor, 0.18);

    if (this.state.health <= 0) {
      this.finishGame();
    }
  }

  finishGame() {
    this.state.gameOver = true;
    this.state.started = false;

    const traveled = Math.floor(this.state.distance);
    if (traveled > this.bestDistance) {
      this.bestDistance = traveled;
      window.localStorage.setItem(STORAGE_KEY, String(this.bestDistance));
    }

    this.ui.finalDistance.textContent = String(traveled);
    this.ui.recordDistance.textContent = String(this.bestDistance);
    this.ui.finalCats.textContent = String(this.state.catsExploded);
    this.updateUI();
    this.showOverlay(this.gameOverOverlay);
    this.showMessage("Дрон потерян. Можно начать заново.", 2.5);
  }

  updateAmbientAnimation(delta) {
    this.rotors?.forEach((rotor) => {
      rotor.rotation.x += delta * 24;
    });

    if (!this.drone) {
      return;
    }

    if (!this.state.started || this.state.paused || this.state.gameOver) {
      this.drone.position.y += Math.sin(this.elapsedTime * 2.2) * 0.002;
    }
  }

  updateCamera() {
    if (!this.drone) {
      return;
    }
    const targetPosition = new THREE.Vector3(
      this.drone.position.x * 0.65,
      this.drone.position.y + 6.5,
      this.drone.position.z - 17
    );
    this.camera.position.lerp(targetPosition, 0.08);

    const lookTarget = new THREE.Vector3(
      this.drone.position.x * 0.45,
      this.drone.position.y + 1.6,
      this.drone.position.z + 42
    );
    this.camera.lookAt(lookTarget);
  }

  updateMessage(delta) {
    if (this.messageTimer <= 0) {
      return;
    }
    this.messageTimer -= delta;
    if (this.messageTimer <= 0) {
      this.messageBox.classList.remove("visible");
    }
  }

  showMessage(text, duration = 1.6) {
    this.messageBox.textContent = text;
    this.messageTimer = duration;
    this.messageBox.classList.add("visible");
  }

  showOverlay(element) {
    element.classList.remove("hidden");
  }

  hideOverlay(element) {
    element.classList.add("hidden");
  }

  updateUI() {
    const distanceValue = Math.floor(this.state.distance);
    this.ui.catsCount.textContent = String(this.state.catsExploded);
    this.ui.distanceCount.textContent = String(distanceValue);
    this.ui.healthCount.textContent = String(Math.floor(this.state.health));
    this.ui.bestCount.textContent = String(this.bestDistance);
    this.ui.fishCooldown.textContent = this.state.fishCooldown > 0 ? `${this.state.fishCooldown.toFixed(1)} c` : "Готова";
    this.ui.shieldCooldown.textContent = this.state.shieldCooldown > 0 ? `${this.state.shieldCooldown.toFixed(1)} c` : "Готов";
    this.ui.shieldTimer.textContent = `${this.state.shieldTime.toFixed(1)} c`;
    this.ui.altitudeState.textContent = this.drone.position.y <= LOW_ALTITUDE_LIMIT ? "Низко: зона котов" : "Высоко: зона ПВО";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new DroneCatsGame();
});
