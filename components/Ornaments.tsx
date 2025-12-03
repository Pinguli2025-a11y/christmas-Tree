import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, DECORATIONS } from '../constants';

interface OrnamentsProps {
  progress: number;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  return (
    <group>
      {DECORATIONS.map((deco, i) => (
        <OrnamentLayer key={i} config={deco} progress={progress} />
      ))}
    </group>
  );
};

interface OrnamentLayerProps {
  config: typeof DECORATIONS[0];
  progress: number;
}

const OrnamentLayer: React.FC<OrnamentLayerProps> = ({ config, progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute data
  const { chaos, targets, speeds } = useMemo(() => {
    const chaos = new Float32Array(config.count * 3);
    const targets = new Float32Array(config.count * 3);
    const speeds = new Float32Array(config.count);

    for (let i = 0; i < config.count; i++) {
      // Chaos
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * (CONFIG.CHAOS_RADIUS + 5); // Wider spread for items
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // Target
      // Ornaments sit on the SURFACE of the cone
      const h = Math.random() * CONFIG.TREE_HEIGHT;
      const coneRadiusAtHeight = CONFIG.TREE_BASE_RADIUS * (1 - h / CONFIG.TREE_HEIGHT);
      const angle = Math.random() * Math.PI * 2;
      // Push slightly out to sit on leaves
      const radius = coneRadiusAtHeight + 0.2; 
      
      targets[i * 3] = radius * Math.cos(angle);
      targets[i * 3 + 1] = h - CONFIG.TREE_HEIGHT / 2 + 2;
      targets[i * 3 + 2] = radius * Math.sin(angle);
      
      speeds[i] = 0.5 + Math.random() * 0.5;
    }
    return { chaos, targets, speeds };
  }, [config.count]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    // Set initial colors
    const color = new THREE.Color(config.color);
    if(config.type === 'light') color.multiplyScalar(2.0); // Emissive boost

    for(let i=0; i<config.count; i++) {
        meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [config]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Physics-ish easing
    // Heavier items (weight ~1) move slower/lag behind
    // Lighter items (weight ~0) move faster or float more
    
    // We adjust the effective progress for this layer based on weight
    // If progress is going 0->1 (Forming):
    // Heavy items form fast (gravity pulls them in?), Light items float in slowly?
    // Let's reverse: Chaos->Form. 
    // Heavy items should reach target solidly. Light items float.
    
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < config.count; i++) {
      const speed = speeds[i];
      
      // Personalized progress based on weight and random speed
      // Weight 1 = Strict adherence. Weight 0 = Floaty.
      
      let effectiveT = progress;
      
      // Add some noise to T
      // If chaos (p=0), everything is scattered.
      // If formed (p=1), everything is set.
      
      // Interpolate position
      const cx = chaos[i * 3];
      const cy = chaos[i * 3 + 1];
      const cz = chaos[i * 3 + 2];

      const tx = targets[i * 3];
      const ty = targets[i * 3 + 1];
      const tz = targets[i * 3 + 2];
      
      const vStart = new THREE.Vector3(cx, cy, cz);
      const vEnd = new THREE.Vector3(tx, ty, tz);
      
      // Cubic ease
      const t = effectiveT < 0.5 ? 4 * effectiveT * effectiveT * effectiveT : 1 - Math.pow(-2 * effectiveT + 2, 3) / 2;
      
      // Add floating motion when in chaos
      const floatY = Math.sin(time * speed + i) * (1 - t) * 2.0; 
      
      dummy.position.lerpVectors(vStart, vEnd, t);
      dummy.position.y += floatY;
      
      // Rotation
      dummy.rotation.x = time * speed * (1 - t);
      dummy.rotation.y = time * speed * 0.5 * (1 - t);
      dummy.rotation.z = time * speed * 0.2 * (1 - t);
      
      // Scale pop-in
      const scale = config.size * (0.5 + 0.5 * t);
      dummy.scale.setScalar(scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const Geometry = config.type === 'box' 
    ? <boxGeometry args={[1, 1, 1]} /> 
    : <sphereGeometry args={[1, 16, 16]} />;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, config.count]}
    >
      {Geometry}
      <meshStandardMaterial 
        color={config.color} 
        roughness={config.type === 'light' ? 0.1 : 0.3}
        metalness={config.type === 'light' ? 0.1 : 0.8}
        emissive={config.type === 'light' ? config.color : '#000000'}
        emissiveIntensity={config.type === 'light' ? 2 : 0}
      />
    </instancedMesh>
  );
};