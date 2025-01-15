import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { FogExp2 } from 'https://cdn.skypack.dev/three@0.132.2';
import { gsap } from 'https://cdn.skypack.dev/gsap';

let scene, camera, renderer, controls;
const objects = [];
let cutsceneInProgress = true;
let clock = new THREE.Clock();

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
  
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x050505,
    roughness: 1,
    metalness: 0
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add creepy trees
  for(let i = 0; i < 100; i++) { // More trees
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
  
  startCutscene();
  animate();
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
    if(obj instanceof THREE.PointLight) {
      // Flicker the lights
      obj.intensity = 0.3 + Math.sin(time * 4 + index) * 0.1;
    } else if(obj instanceof THREE.Group) {
      // Animate trees and skulls
      obj.rotation.y += Math.sin(time + index) * 0.001;
      if(obj.children[0] instanceof THREE.Mesh && obj.children[0].geometry instanceof THREE.SphereGeometry) {
        // It's a skull, make it float
        obj.position.y += Math.sin(time * 2 + index) * 0.005;
      }
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