import { isWebGLSupported, markWebGLUnavailable } from './webglSupport.js';

const STAR_FIELD_CONFIG = {
  count: 1600,
  spread: 1800,
  depth: 1400,
  minVelocity: 0.02,
  maxVelocity: 0.08
};

let renderer;
let scene;
let camera;
let starField;
let animationFrameId;
const starVelocities = [];

const createStarField = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_FIELD_CONFIG.count * 3);
  const colors = new Float32Array(STAR_FIELD_CONFIG.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < STAR_FIELD_CONFIG.count; i += 1) {
    const i3 = i * 3;
    const radius = STAR_FIELD_CONFIG.spread * Math.random();
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = THREE.MathUtils.randFloatSpread(STAR_FIELD_CONFIG.depth * 2);

    const hue = 0.52 + Math.random() * 0.05;
    color.setHSL(hue, 0.7, 0.8 - Math.random() * 0.2);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    starVelocities[i] = THREE.MathUtils.randFloat(STAR_FIELD_CONFIG.minVelocity, STAR_FIELD_CONFIG.maxVelocity);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    size: 1.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  if (!starField) return;

  const positions = starField.geometry.attributes.position.array;

  for (let i = 0; i < STAR_FIELD_CONFIG.count; i += 1) {
    const zIndex = i * 3 + 2;
    positions[zIndex] += starVelocities[i];

    if (positions[zIndex] > STAR_FIELD_CONFIG.depth) {
      positions[zIndex] = -STAR_FIELD_CONFIG.depth;
    }
  }

  starField.geometry.attributes.position.needsUpdate = true;
  starField.rotation.y += 0.0002;
  starField.rotation.x += 0.00005;

  renderer.render(scene, camera);
};

const handleResize = () => {
  if (!renderer || !camera) return;
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};

const buildFallbackBackground = (container) => {
  container.classList.add('fallback');
  const layer = document.createElement('div');
  layer.className = 'space-bg-fallback-layer';
  container.appendChild(layer);
};

export const initSpaceBackground = () => {
  if (document.getElementById('space-bg')) return;

  const container = document.createElement('div');
  container.id = 'space-bg';
  document.body.prepend(container);

  const hasThree = typeof THREE !== 'undefined';
  const supportsWebGL = isWebGLSupported() && hasThree;

  if (!supportsWebGL) {
    markWebGLUnavailable();
    buildFallbackBackground(container);
    return;
  }

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060d, 0.0008);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.z = 600;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  starField = createStarField();
  scene.add(starField);

  const glow = new THREE.PointLight(0x78f4ff, 0.5, 0, 2);
  glow.position.set(0, 0, 400);
  scene.add(glow);

  const ambient = new THREE.AmbientLight(0x112233, 0.6);
  scene.add(ambient);

  animate();

  window.addEventListener('resize', handleResize);
};

export const destroySpaceBackground = () => {
  const container = document.getElementById('space-bg');

  if (renderer) {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);

    if (starField) {
      starField.geometry.dispose();
      starField.material.dispose();
    }
    renderer.dispose();
  }

  if (container) {
    container.remove();
  }

  renderer = null;
  scene = null;
  camera = null;
  starField = null;
};
