import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { FogExp2 } from 'https://cdn.skypack.dev/three@0.132.2';

let scene, camera, renderer, controls;
const objects = [];

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 10);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.shadowMap.enabled = true;
  
  const container = document.getElementById('scene-container');
  container.appendChild(renderer.domElement);
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);
  
  const moonLight = new THREE.DirectionalLight(0x223344, 0.5);
  moonLight.position.set(5, 15, 5);
  moonLight.castShadow = true;
  scene.add(moonLight);
  
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add random creepy trees
  for(let i = 0; i < 50; i++) {
    const tree = createTree();
    tree.position.set(
      Math.random() * 80 - 40,
      0,
      Math.random() * 80 - 40
    );
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
    objects.push(tree);
  }
  
  // Start animation
  animate();
}

function createTree() {
  const group = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, 4, 6);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x221111,
    roughness: 1
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.castShadow = true;
  group.add(trunk);
  
  // Branches
  for(let i = 0; i < 5; i++) {
    const branchGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2 + Math.random() * 2, 4);
    const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
    branch.position.y = Math.random() * 2;
    branch.rotation.set(
      Math.random() * 0.5,
      Math.random() * Math.PI * 2,
      Math.random() * 0.5
    );
    branch.castShadow = true;
    group.add(branch);
  }
  
  return group;
}

function animate() {
  requestAnimationFrame(animate);
  
  // Subtle movement of trees
  objects.forEach(obj => {
    obj.rotation.y += Math.sin(Date.now() * 0.001) * 0.001;
  });
  
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start experience button
document.getElementById('start-btn').addEventListener('click', () => {
  const audio = document.getElementById('ambient-audio');
  const container = document.getElementById('scene-container');
  const button = document.getElementById('start-btn');
  
  audio.play();
  container.classList.add('visible');
  button.style.display = 'none';
  
  init();
});