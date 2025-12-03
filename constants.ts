import * as THREE from 'three';

// Palette: Trump Luxury
export const PALETTE = {
  EMERALD_DEEP: new THREE.Color('#013220'),
  EMERALD_LIGHT: new THREE.Color('#0B6623'),
  GOLD_HIGH: new THREE.Color('#FFD700'),
  GOLD_ROSE: new THREE.Color('#B76E79'),
  RED_VELVET: new THREE.Color('#800020'),
  WARM_WHITE: new THREE.Color('#FFFDD0'),
};

export const CONFIG = {
  FOLIAGE_COUNT: 15000,
  TREE_HEIGHT: 14,
  TREE_BASE_RADIUS: 5,
  CHAOS_RADIUS: 25,
  CAMERA_POS: [0, 4, 20] as [number, number, number],
};

export const DECORATIONS = [
  { count: 40, color: '#D4AF37', size: 0.6, weight: 0.8, type: 'box' }, // Gold Gifts
  { count: 40, color: '#800020', size: 0.7, weight: 0.9, type: 'box' }, // Red Gifts
  { count: 150, color: '#FFD700', size: 0.25, weight: 0.4, type: 'sphere' }, // Gold Balls
  { count: 150, color: '#C0C0C0', size: 0.2, weight: 0.3, type: 'sphere' }, // Silver Balls
  { count: 500, color: '#FFFDD0', size: 0.08, weight: 0.05, type: 'light' }, // Lights
];

// Shaders
export const FOLIAGE_VERTEX_SHADER = `
  uniform float uProgress;
  uniform float uTime;
  
  attribute vec3 aTargetPos;
  attribute vec3 aChaosPos;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  // Cubic Bezier Ease In Out
  float ease(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = ease(uProgress);
    
    // Add some noise based on time to chaos position
    vec3 chaos = aChaosPos + vec3(sin(uTime + aRandom * 10.0), cos(uTime * 0.5 + aRandom), sin(uTime * 0.8)) * 0.5;
    
    // Lerp position
    vec3 pos = mix(chaos, aTargetPos, t);
    
    // Subtle wind effect when formed
    if (t > 0.8) {
      float wind = sin(uTime * 2.0 + pos.y * 0.5) * 0.1 * (pos.y / 10.0);
      pos.x += wind;
      pos.z += wind;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (100.0 * (0.5 + aRandom * 0.5)) / -mvPosition.z;
    
    // Fade out based on chaos
    vAlpha = 1.0; 
    
    // Color gradient
    vColor = mix(vec3(0.0, 0.2, 0.1), vec3(0.05, 0.4, 0.15), aRandom);
  }
`;

export const FOLIAGE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Glow edge
    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
    vec3 finalColor = vColor + vec3(0.8, 0.7, 0.2) * glow * 0.5; // Add gold tint
    
    gl_FragColor = vec4(finalColor, vAlpha);
  }
`;
