import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../constants';

const IMAGES = [
  "https://picsum.photos/300/300?random=1",
  "https://picsum.photos/300/300?random=2",
  "https://picsum.photos/300/300?random=3",
  "https://picsum.photos/300/300?random=4",
  "https://picsum.photos/300/300?random=5",
];

interface PolaroidsProps {
  progress: number;
}

export const Polaroids: React.FC<PolaroidsProps> = ({ progress }) => {
  return (
    <group>
      {IMAGES.map((url, i) => (
        <PolaroidItem key={i} url={url} index={i} total={IMAGES.length} progress={progress} />
      ))}
    </group>
  );
};

interface PolaroidItemProps {
  url: string;
  index: number;
  total: number;
  progress: number;
}

const PolaroidItem: React.FC<PolaroidItemProps> = ({ url, index, total, progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const { chaosPos, treePos, rotationSpeed } = useMemo(() => {
    // Chaos: Far out
    const r = CONFIG.CHAOS_RADIUS * 0.8;
    const theta = (index / total) * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const cx = r * Math.sin(phi) * Math.cos(theta);
    const cy = r * Math.sin(phi) * Math.sin(theta);
    const cz = r * Math.cos(phi);
    
    // Tree: Spiraling down the tree
    const h = (index / total) * CONFIG.TREE_HEIGHT * 0.8 - (CONFIG.TREE_HEIGHT/2) + 2;
    const tr = CONFIG.TREE_BASE_RADIUS * (1 - (h + CONFIG.TREE_HEIGHT/2)/CONFIG.TREE_HEIGHT) + 1.5;
    const ta = (index / total) * Math.PI * 4; // 2 spirals
    
    const tx = tr * Math.cos(ta);
    const ty = h;
    const tz = tr * Math.sin(ta);

    return {
      chaosPos: new THREE.Vector3(cx, cy, cz),
      treePos: new THREE.Vector3(tx, ty, tz),
      rotationSpeed: (Math.random() - 0.5) * 0.5
    };
  }, [index, total]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = progress;
    
    // Position Lerp
    groupRef.current.position.lerpVectors(chaosPos, treePos, t);
    
    // Rotation: Chaos spins, Tree faces roughly outward
    const time = state.clock.getElapsedTime();
    
    if (t < 0.5) {
       groupRef.current.rotation.x = time * rotationSpeed;
       groupRef.current.rotation.y = time * rotationSpeed * 0.7;
       groupRef.current.rotation.z = time * rotationSpeed * 0.3;
    } else {
       // Look at center (0, y, 0) then flip 180 to face out
       groupRef.current.lookAt(0, groupRef.current.position.y, 0);
       groupRef.current.rotateY(Math.PI);
       // Add subtle sway
       groupRef.current.rotation.z += Math.sin(time + index) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Frame */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.2, 2.6]} />
        <meshStandardMaterial color="#fffff0" roughness={0.8} />
      </mesh>
      {/* Photo */}
      <Image url={url} position={[0, 0.2, 0]} scale={[1.8, 1.8]} />
      {/* Text */}
      <Text 
        position={[0, -0.9, 0.01]} 
        fontSize={0.2} 
        color="#222"
        font="https://fonts.gstatic.com/s/shadowsintolight/v19/UZYxE8nEiSKu-4U-WfThBdNsKpOWswT7.woff"
        anchorX="center" 
        anchorY="middle"
      >
        Memories {2024 - index}
      </Text>
    </group>
  );
};