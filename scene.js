import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { FogExp2 } from 'https://cdn.skypack.dev/three@0.132.2';
import { gsap } from 'https://cdn.skypack.dev/gsap';

let scene, camera, renderer, controls;
const objects = [];
let cutsceneInProgress = true;
let clock = new THREE.Clock();
let windSound = new Audio();
windSound.volume = 0.1;

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let focusPoint = null;
let focusStartTime = 0;
const FOCUS_REQUIRED_TIME = 5000; // 5 seconds in milliseconds
let focusIndicator = null;
let isMoving = false;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.015); // Reduced fog density for better visibility

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 30, 50);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const container = document.getElementById('scene-container');
  container.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enabled = false;

  // Enhanced Lighting
  const ambientLight = new THREE.AmbientLight(0x333333); // Brighter ambient light
  scene.add(ambientLight);

  // Add brighter red moonlight
  const moonLight = new THREE.DirectionalLight(0x550000, 0.5); // Increased intensity
  moonLight.position.set(5, 15, 5);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 2048;
  moonLight.shadow.mapSize.height = 2048;
  scene.add(moonLight);

  // Add more flickering lights with higher intensity
  for(let i = 0; i < 12; i++) { // Increased number of lights
    const light = new THREE.PointLight(0x330000, 0.8, 20); // Increased intensity and range
    light.position.set(
      Math.random() * 60 - 30,
      Math.random() * 5 + 2, // Raised height for better illumination
      Math.random() * 60 - 30
    );
    light.castShadow = true;
    objects.push(light);
    scene.add(light);
  }

  // Add additional ambient fills
  const fillLight1 = new THREE.DirectionalLight(0x221111, 0.3);
  fillLight1.position.set(-10, 10, -10);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0x112211, 0.2);
  fillLight2.position.set(10, 10, 10);
  scene.add(fillLight2);

  // Enhanced ground with displacement
  const groundGeometry = new THREE.PlaneGeometry(200, 200, 100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x050505,
    roughness: 1,
    metalness: 0,
    displacementScale: 2,
  });

  // Add displacement to ground
  const positions = groundGeometry.attributes.position;
  for(let i = 0; i < positions.count; i++) {
    const y = (Math.random() - 0.5) * 0.5;
    positions.setY(i, y);
  }
  groundGeometry.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Add fog particles
  addFogParticles();

  // Add gravestones
  for(let i = 0; i < 30; i++) {
    const gravestone = createGravestone();
    gravestone.position.set(
      Math.random() * 140 - 70,
      0,
      Math.random() * 140 - 70
    );
    gravestone.rotation.y = Math.random() * Math.PI * 2;
    scene.add(gravestone);
    objects.push(gravestone);
  }

  // Add creepy trees
  for(let i = 0; i < 100; i++) { 
    const tree = createTree();
    tree.position.set(
      Math.random() * 160 - 80,
      0,
      Math.random() * 160 - 80
    );
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    objects.push(tree);
  }

  // Add floating skull-like shapes
  for(let i = 0; i < 20; i++) {
    const skull = createFloatingSkull();
    skull.position.set(
      Math.random() * 100 - 50,
      Math.random() * 5 + 2,
      Math.random() * 100 - 50
    );
    scene.add(skull);
    objects.push(skull);
  }

  // Add mysterious floating orbs
  for(let i = 0; i < 15; i++) {
    const orb = createMysteriousOrb();
    orb.position.set(
      Math.random() * 80 - 40,
      Math.random() * 8 + 4,
      Math.random() * 80 - 40
    );
    scene.add(orb);
    objects.push(orb);
  }

  // Add ground fog
  const fogGeometry = new THREE.PlaneGeometry(200, 200, 1, 1);
  const fogMaterial = new THREE.MeshBasicMaterial({
    color: 0x110000,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const groundFog = new THREE.Mesh(fogGeometry, fogMaterial);
  groundFog.rotation.x = -Math.PI / 2;
  groundFog.position.y = 0.1;
  scene.add(groundFog);

  // Add focus indicator
  const indicatorGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
  const indicatorMaterial = new THREE.MeshBasicMaterial({
    color: 0x330000,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  focusIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  focusIndicator.rotation.x = -Math.PI / 2;
  scene.add(focusIndicator);

  // Add mouse move event listener
  document.addEventListener('mousemove', onMouseMove);

  startCutscene();
  animate();
}

function createMysteriousOrb() {
  const group = new THREE.Group();

  // Core orb
  const orbGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const orbMaterial = new THREE.MeshBasicMaterial({
    color: 0x330000,
    transparent: true,
    opacity: 0.6
  });
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);

  // Glowing halo
  const haloGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x330000,
    transparent: true,
    opacity: 0.2
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);

  group.add(orb);
  group.add(halo);

  return group;
}

function createGravestone() {
  const group = new THREE.Group();

  // Base
  const baseGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.8);
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333, // Lighter color for gravestones
    roughness: 0.9,
    metalness: 0.1
  });
  const base = new THREE.Mesh(baseGeometry, stoneMaterial);
  base.position.y = 0.15;
  base.castShadow = true;
  group.add(base);

  // Main stone
  const stoneGeometry = new THREE.BoxGeometry(0.8, 2, 0.3);
  const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
  stone.position.y = 1.15;
  stone.castShadow = true;

  // Distress the gravestone
  const positions = stoneGeometry.attributes.position;
  for(let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) + (Math.random() - 0.5) * 0.05);
    positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 0.05);
    positions.setZ(i, positions.getZ(i) + (Math.random() - 0.5) * 0.05);
  }
  stoneGeometry.computeVertexNormals();

  group.add(stone);

  return group;
}

function addFogParticles() {
  const particleCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for(let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = Math.random() * 200 - 100;
    positions[i + 1] = Math.random() * 5;
    positions[i + 2] = Math.random() * 200 - 100;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x220000,
    size: 0.2,
    transparent: true,
    opacity: 0.2
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  objects.push(particles);
}

function createFloatingSkull() {
  const group = new THREE.Group();

  // Create basic skull shape
  const skullGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const skullMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0x110000,
    emissiveIntensity: 0.2
  });

  const skull = new THREE.Mesh(skullGeometry, skullMaterial);
  skull.castShadow = true;
  group.add(skull);

  return group;
}

function createTree() {
  const group = new THREE.Group();

  // Twisted trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, 6, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x221111, // Lighter color for trees
    roughness: 1,
    metalness: 0.1
  });

  // Distort trunk vertices for twisted look
  const positions = trunkGeometry.attributes.position;
  for(let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    positions.setX(i, x + Math.sin(y * 0.5) * 0.2);
    positions.setZ(i, z + Math.cos(y * 0.5) * 0.2);
  }

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.castShadow = true;
  group.add(trunk);

  // Add more twisted branches
  for(let i = 0; i < 8; i++) {
    const branchGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2 + Math.random() * 3, 5);
    const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
    branch.position.y = Math.random() * 3;
    branch.rotation.set(
      Math.random() * 1 - 0.5,
      Math.random() * Math.PI * 2,
      Math.random() * 1 - 0.5
    );
    branch.castShadow = true;
    group.add(branch);
  }

  return group;
}

function startCutscene() {
  gsap.timeline()
    .to(camera.position, {
      y: 15,
      duration: 4,
      ease: "power1.inOut"
    })
    .to(camera.position, {
      x: -20,
      z: 20,
      duration: 3,
      ease: "power1.inOut"
    })
    .to(camera.position, {
      x: 0,
      y: 2,
      z: 10,
      duration: 3,
      ease: "power1.inOut",
      onComplete: () => {
        cutsceneInProgress = false;
        controls.enabled = true;
      }
    });
}

function onMouseMove(event) {
  if (cutsceneInProgress) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function handleFocus() {
  if (cutsceneInProgress) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Find ground intersection
  const groundIntersect = intersects.find(intersect => 
    intersect.object.geometry instanceof THREE.PlaneGeometry);

  if (groundIntersect) {
    const point = groundIntersect.point;

    // Update focus indicator position
    focusIndicator.position.set(point.x, 0.1, point.z);

    if (!focusPoint) {
      // Start new focus
      focusPoint = point.clone();
      focusStartTime = Date.now();
      gsap.to(focusIndicator.material, {
        opacity: 0.8,
        duration: 0.3
      });
    } else if (!focusPoint.equals(point)) {
      // Reset focus if point changed
      focusPoint = point.clone();
      focusStartTime = Date.now();
    } else if (!isMoving && Date.now() - focusStartTime >= FOCUS_REQUIRED_TIME) {
      // Focus complete, start movement
      moveToPoint(point);
    }
  } else {
    resetFocus();
  }
}

function resetFocus() {
  focusPoint = null;
  focusStartTime = 0;
  gsap.to(focusIndicator.material, {
    opacity: 0,
    duration: 0.3
  });
}

function moveToPoint(point) {
  isMoving = true;

  // Calculate shortest path avoiding obstacles
  const startPos = new THREE.Vector3().copy(camera.position);
  const targetPos = point.clone();
  
  // Create a smoother path with curve
  const controlPoint1 = new THREE.Vector3(
    startPos.x + (targetPos.x - startPos.x) * 0.5,
    startPos.y + 2, // Slight arc upward
    startPos.z + (targetPos.z - startPos.z) * 0.5
  );
  
  const curve = new THREE.CubicBezierCurve3(
    startPos,
    controlPoint1,
    controlPoint1,
    targetPos
  );

  // Get points along curve for smooth movement
  const points = curve.getPoints(50);
  
  // Create a timeline for smooth camera movement along path
  const timeline = gsap.timeline({
    onComplete: () => {
      isMoving = false;
      resetFocus();
    }
  });

  // Animate camera along path points
  points.forEach((point, index) => {
    timeline.to(camera.position, {
      x: point.x,
      y: Math.max(2, point.y), // Keep minimum height
      z: point.z,
      duration: 0.1,
      ease: "none"
    }, index * 0.1);
  });

  // Camera look-ahead system
  let lookAheadPoint = new THREE.Vector3();
  gsap.to(controls.target, {
    x: point.x,
    y: 0,
    z: point.z,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => {
      // Look ahead on the path
      const timeProgress = timeline.progress();
      const lookAheadIndex = Math.min(
        Math.floor((timeProgress + 0.1) * points.length),
        points.length - 1
      );
      lookAheadPoint.copy(points[lookAheadIndex]);
      controls.target.copy(lookAheadPoint);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // Enhance atmospheric effects
  scene.fog.density = 0.015 + Math.sin(time * 0.5) * 0.002;

  // Handle focus checking with smoother transitions
  if (!cutsceneInProgress && !isMoving) {
    handleFocus();
  }

  // Enhanced focus indicator animation
  if (focusPoint && focusIndicator) {
    const progress = Math.min(
      (Date.now() - focusStartTime) / FOCUS_REQUIRED_TIME,
      1
    );
    const pulseScale = 1 + Math.sin(time * 5) * 0.1;
    focusIndicator.scale.setScalar(pulseScale * (1 + progress * 0.5));
    focusIndicator.material.color.setHSL(0, 1, 0.2 + progress * 0.4);
    focusIndicator.rotation.y += 0.01;
  }

  // Enhanced object animations
  objects.forEach((obj) => {
    if (!obj) return;

    if (obj instanceof THREE.Points && obj.geometry && obj.geometry.attributes.position) {
      // Enhanced fog particle movement
      const positions = obj.geometry.attributes.position.array;
      for(let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + i) * 0.02;
        positions[i + 1] += (Math.cos(time + i) * 0.01) + Math.sin(time * 0.5) * 0.005;
        positions[i + 2] += Math.sin(time * 1.5 + i) * 0.02;

        // Improved particle wrapping
        positions[i] = ((positions[i] + 100) % 200) - 100;
        positions[i + 2] = ((positions[i + 2] + 100) % 200) - 100;
        positions[i + 1] = Math.max(0, Math.min(5, positions[i + 1]));
      }
      obj.geometry.attributes.position.needsUpdate = true;
    } else if (obj instanceof THREE.Group) {
      // Enhanced group object animations
      obj.rotation.y += Math.sin(time + obj.position.x) * 0.002;

      if (obj.children[0] && obj.children[0].geometry instanceof THREE.SphereGeometry) {
        // Enhanced floating skull movement
        obj.position.y += Math.sin(time * 2 + obj.position.x) * 0.008;
        obj.rotation.x += Math.sin(time) * 0.001;
        obj.rotation.z += Math.cos(time) * 0.001;
      }

      // Enhanced orb animations
      if (obj.children[0] && obj.children[1] && 
          obj.children[0].material && obj.children[1].material) {
        const child0 = obj.children[0];
        const child1 = obj.children[1];

        if (child0.material.opacity !== undefined && child1.material.opacity !== undefined) {
          child0.material.opacity = 0.6 + Math.sin(time * 2 + obj.position.x) * 0.3;
          child1.material.opacity = 0.2 + Math.sin(time * 3 + obj.position.z) * 0.15;
          obj.rotation.y += 0.008;
          obj.position.y += Math.sin(time + obj.position.x * 0.5) * 0.015;
          
          // Add slight horizontal drift
          obj.position.x += Math.sin(time * 0.5 + obj.position.z) * 0.005;
          obj.position.z += Math.cos(time * 0.5 + obj.position.x) * 0.005;
        }
      }
    } else if (obj instanceof THREE.PointLight) {
      // Enhanced light flickering
      const flickerSpeed = 3 + Math.random() * 2;
      const flickerIntensity = 0.2 + Math.random() * 0.1;
      obj.intensity = 0.8 + Math.sin(time * flickerSpeed) * flickerIntensity;
      
      // Subtle light movement
      obj.position.x += Math.sin(time + obj.position.z) * 0.02;
      obj.position.z += Math.cos(time + obj.position.x) * 0.02;
    }
  });

  // Update controls and render
  if (!cutsceneInProgress && controls) {
    controls.update();
  } else {
    camera.lookAt(0, 0, 0);
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('start-btn').addEventListener('click', () => {
  const audio = document.getElementById('ambient-audio');
  const container = document.getElementById('scene-container');
  const button = document.getElementById('start-btn');

  audio.play();
  container.classList.add('visible');
  button.style.display = 'none';

  init();
});