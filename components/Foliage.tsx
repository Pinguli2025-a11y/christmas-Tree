import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, FOLIAGE_FRAGMENT_SHADER, FOLIAGE_VERTEX_SHADER } from '../constants';

interface FoliageProps {
  progress: number;
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, targetPositions, chaosPositions, randoms } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const positions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const chaosPositions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Chaos: Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * CONFIG.CHAOS_RADIUS;
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta);
      const cz = r * Math.cos(phi);

      chaosPositions[i * 3] = cx;
      chaosPositions[i * 3 + 1] = cy;
      chaosPositions[i * 3 + 2] = cz;

      // Target: Cone distribution
      const h = Math.random() * CONFIG.TREE_HEIGHT; // Height from bottom (0) to top
      const coneRadiusAtHeight = CONFIG.TREE_BASE_RADIUS * (1 - h / CONFIG.TREE_HEIGHT);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * coneRadiusAtHeight; // Uniform point in circle

      const tx = radius * Math.cos(angle);
      const ty = h - CONFIG.TREE_HEIGHT / 2 + 2; // Center vertically slightly up
      const tz = radius * Math.sin(angle);

      targetPositions[i * 3] = tx;
      targetPositions[i * 3 + 1] = ty;
      targetPositions[i * 3 + 2] = tz;

      // Initial Pos
      positions[i * 3] = cx;
      positions[i * 3 + 1] = cy;
      positions[i * 3 + 2] = cz;

      randoms[i] = Math.random();
    }

    return { positions, targetPositions, chaosPositions, randoms };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress;
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={targetPositions.length / 3}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={chaosPositions.length / 3}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={FOLIAGE_VERTEX_SHADER}
        fragmentShader={FOLIAGE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        uniforms={{
          uProgress: { value: 0 },
          uTime: { value: 0 },
        }}
      />
    </points>
  );
};
