import * as THREE from "three";
import { isWebGLSupported, markWebGLUnavailable } from "./webglSupport.js";

// Nebula shader - vertex shader
const nebulaVertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Nebula shader - fragment shader with FBM noise
const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  
  // Simple 2D noise function
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // Optimized Fractal Brownian Motion (3 octaves instead of 5)
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 3; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Scroll the nebula slowly
    vec2 p = uv * 3.0 + vec2(uTime * 0.02, uTime * 0.01);
    
    // Generate nebula pattern (single FBM call)
    float n = fbm(p);
    
    // Much darker deep space colors
    vec3 deepVoid = vec3(0.003, 0.005, 0.012);      // Almost black with hint of blue
    vec3 darkBlue = vec3(0.015, 0.025, 0.045);      // Very dark blue
    vec3 subtleCyan = vec3(0.08, 0.12, 0.18);       // Muted cyan/blue
    vec3 faintPurple = vec3(0.06, 0.04, 0.08);     // Very subtle purple
    
    // Simplified color mixing
    vec3 color = deepVoid;
    color = mix(color, darkBlue, smoothstep(0.4, 0.7, n));
    color = mix(color, subtleCyan, smoothstep(0.75, 0.95, n) * 0.15);
    color = mix(color, faintPurple, n * 0.1);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Star Shader - Vertex
const starVertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDepth;
  uniform vec2 uMouse;
  
  attribute float size;
  attribute vec3 color;
  attribute float velocity;
  
  varying vec3 vColor;
  
  void main() {
    vColor = color;
    vec3 pos = position;
    
    // Animate Z position based on velocity
    pos.z += uTime * velocity * 100.0 * uSpeed;
    
    // Wrap around depth
    pos.z = mod(pos.z, uDepth * 2.0) - uDepth;
    
    // Parallax effect
    pos.x += (uMouse.x * 50.0);
    pos.y += (uMouse.y * 50.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Star Shader - Fragment
const starFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Round particles
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const STAR_FIELD_CONFIG = {
  count: window.innerWidth < 768 ? 600 : 1600, // Dynamic star count
  spread: 1800,
  depth: 1400,
  speed: 0.0, // Static stars (Deep Void)
};

let renderer;
let scene;
let camera;
let starField;
let nebulaMesh;
let animationFrameId;
// No CPU velocity array needed anymore

const mousePosition = new THREE.Vector2(0, 0);

const handleMouseMove = (event) => {
  // Normalized coordinates -1 to 1
  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

const createNebula = () => {
  const geometry = new THREE.PlaneGeometry(1, 1);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uMouse: { value: new THREE.Vector2(0, 0) }, // Add mouse uniform
    },
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Position nebula far behind everything
  mesh.position.z = -2000;

  return mesh;
};

const createStarField = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_FIELD_CONFIG.count * 3);
  const colors = new Float32Array(STAR_FIELD_CONFIG.count * 3);
  const sizes = new Float32Array(STAR_FIELD_CONFIG.count);
  const velocities = new Float32Array(STAR_FIELD_CONFIG.count);

  const color = new THREE.Color();

  for (let i = 0; i < STAR_FIELD_CONFIG.count; i += 1) {
    const i3 = i * 3;
    const radius = STAR_FIELD_CONFIG.spread * Math.random();
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = THREE.MathUtils.randFloatSpread(
      STAR_FIELD_CONFIG.depth * 2
    );

    const hue = 0.52 + Math.random() * 0.05;
    color.setHSL(hue, 0.7, 0.8 - Math.random() * 0.2);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = 1.0 + Math.random() * 1.5;

    // Use attribute instead of separate array
    velocities[i] = THREE.MathUtils.randFloat(0.5, 2.0); // Base velocity factor
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));

  geometry.computeBoundingSphere();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uSpeed: { value: STAR_FIELD_CONFIG.speed },
      uDepth: { value: STAR_FIELD_CONFIG.depth },
      uMouse: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);

  // Animate nebula shader
  if (nebulaMesh) {
    nebulaMesh.material.uniforms.uTime.value += 0.016;

    // Target mouse position with smoothing
    const targetX = mousePosition.x * 0.05; // Less movement for background
    const targetY = mousePosition.y * 0.05;

    nebulaMesh.material.uniforms.uMouse.value.x +=
      (targetX - nebulaMesh.material.uniforms.uMouse.value.x) * 0.05;
    nebulaMesh.material.uniforms.uMouse.value.y +=
      (targetY - nebulaMesh.material.uniforms.uMouse.value.y) * 0.05;
  }

  // Animate star shader
  if (starField) {
    starField.rotation.y += 0.0002;
    starField.material.uniforms.uTime.value += 0.01;

    // Parallax smoothing for stars
    starField.material.uniforms.uMouse.value.x +=
      (mousePosition.x - starField.material.uniforms.uMouse.value.x) * 0.05;
    starField.material.uniforms.uMouse.value.y +=
      (mousePosition.y - starField.material.uniforms.uMouse.value.y) * 0.05;
  }

  renderer.render(scene, camera);
};

const handleResize = () => {
  if (!renderer || !camera) return;
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);

  // Rescale nebula to cover viewport at new aspect ratio
  if (nebulaMesh) {
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(nebulaMesh.position.z - camera.position.z);
    const vHeight = 2 * Math.tan(fov / 2) * distance;
    const vWidth = vHeight * camera.aspect;

    nebulaMesh.scale.set(vWidth, vHeight, 1);
    nebulaMesh.material.uniforms.uResolution.value.set(innerWidth, innerHeight);
  }
};

const buildFallbackBackground = (container) => {
  container.classList.add("fallback");
  const layer = document.createElement("div");
  layer.className = "space-bg-fallback-layer";
  container.appendChild(layer);
};

export const initSpaceBackground = () => {
  if (document.getElementById("space-bg")) return;

  const container = document.createElement("div");
  container.id = "space-bg";
  document.body.prepend(container);

  const hasThree = typeof THREE !== "undefined";
  const supportsWebGL = isWebGLSupported() && hasThree;

  if (!supportsWebGL) {
    markWebGLUnavailable();
    buildFallbackBackground(container);
    return;
  }

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060d, 0.0008);

  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  );
  camera.position.z = 600;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  // Create nebula background - DISABLED for Deep Void mode
  // nebulaMesh = createNebula();

  // Scale nebula to cover entire viewport at its distance
  // const fov = camera.fov * (Math.PI / 180); // Convert to radians
  // const distance = Math.abs(nebulaMesh.position.z - camera.position.z); // 2600
  // const vHeight = 2 * Math.tan(fov / 2) * distance;
  // const vWidth = vHeight * camera.aspect;

  // nebulaMesh.scale.set(vWidth, vHeight, 1);
  // scene.add(nebulaMesh);

  starField = createStarField();
  scene.add(starField);

  const glow = new THREE.PointLight(0x78f4ff, 0.5, 0, 2);
  glow.position.set(0, 0, 400);
  scene.add(glow);

  const ambient = new THREE.AmbientLight(0x112233, 0.6);
  scene.add(ambient);

  animate();

  window.addEventListener("resize", handleResize);
  document.addEventListener("mousemove", handleMouseMove); // Add interaction
};

export const destroySpaceBackground = () => {
  const container = document.getElementById("space-bg");

  if (renderer) {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("mousemove", handleMouseMove); // Clean up interaction

    if (starField) {
      starField.geometry.dispose();
      starField.material.dispose();
    }

    if (nebulaMesh) {
      nebulaMesh.geometry.dispose();
      nebulaMesh.material.dispose();
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
  nebulaMesh = null;
};
