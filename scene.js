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

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.025); // Increased fog density
  
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
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x020202); // Even darker ambient
  scene.add(ambientLight);
  
  // Add eerie red moonlight
  const moonLight = new THREE.DirectionalLight(0x330000, 0.2);
  moonLight.position.set(5, 15, 5);
  moonLight.castShadow = true;
  scene.add(moonLight);
  
  // Add flickering lights
  for(let i = 0; i < 8; i++) {
    const light = new THREE.PointLight(0x330000, 0.3, 15);
    light.position.set(
      Math.random() * 60 - 30,
      Math.random() * 3 + 0.5,
      Math.random() * 60 - 30
    );
    objects.push(light); // Add to objects for animation
    scene.add(light);
  }
  
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
    color: 0x222222,
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
    color: 0x110000,
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

function animate() {
  requestAnimationFrame(animate);
  
  const time = clock.getElapsedTime();
  
  objects.forEach((obj, index) => {
    if(obj instanceof THREE.Points) {
      // Animate fog particles
      const positions = obj.geometry.attributes.position.array;
      for(let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + index) * 0.01;
        positions[i + 1] += Math.cos(time + index) * 0.005;
        positions[i + 2] += Math.sin(time + index) * 0.01;
        
        // Reset particles that drift too far
        if(positions[i] > 100) positions[i] = -100;
        if(positions[i] < -100) positions[i] = 100;
        if(positions[i + 2] > 100) positions[i + 2] = -100;
        if(positions[i + 2] < -100) positions[i + 2] = 100;
      }
      obj.geometry.attributes.position.needsUpdate = true;
    } else if(obj instanceof THREE.Group) {
      // Animate trees and skulls
      obj.rotation.y += Math.sin(time + index) * 0.001;
      if(obj.children[0] instanceof THREE.Mesh && obj.children[0].geometry instanceof THREE.SphereGeometry) {
        // It's a skull, make it float
        obj.position.y += Math.sin(time * 2 + index) * 0.005;
      }
      
      // Additional animations for orbs
      if(obj.children[0]?.material?.opacity !== undefined) {
        obj.children[0].material.opacity = 0.6 + Math.sin(time * 2 + index) * 0.2;
        obj.children[1].material.opacity = 0.2 + Math.sin(time * 2 + index) * 0.1;
        obj.rotation.y += 0.005;
        obj.position.y += Math.sin(time + index) * 0.01;
      }
    } else if(obj instanceof THREE.PointLight) {
      // Flicker the lights
      obj.intensity = 0.3 + Math.sin(time * 4 + index) * 0.1;
    }
  });
  
  if (!cutsceneInProgress) {
    controls.update();
  } else {
    camera.lookAt(0, 0, 0);
  }
  
  renderer.render(scene, camera);
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