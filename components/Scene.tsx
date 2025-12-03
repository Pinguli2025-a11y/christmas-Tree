import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { CONFIG } from '../constants';

interface SceneProps {
  treeProgress: number; // 0 (chaos) to 1 (formed)
  handPosition: { x: number; y: number } | null; // Normalized -1 to 1
}

const CameraRig = ({ handPosition }: { handPosition: { x: number; y: number } | null }) => {
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  useFrame((state) => {
    // Base position
    const baseX = CONFIG.CAMERA_POS[0];
    const baseY = CONFIG.CAMERA_POS[1];
    const baseZ = CONFIG.CAMERA_POS[2];

    // Hand influence
    const targetX = baseX + (handPosition ? handPosition.x * 10 : (state.mouse.x * 5));
    const targetY = baseY + (handPosition ? -handPosition.y * 5 : (state.mouse.y * 2));
    
    // Smooth damp
    camera.position.lerp(vec.set(targetX, targetY, baseZ), 0.05);
    camera.lookAt(0, 4, 0);
  });
  return null;
};

export const Scene: React.FC<SceneProps> = ({ treeProgress, handPosition }) => {
  return (
    <Canvas gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}>
      <PerspectiveCamera makeDefault position={CONFIG.CAMERA_POS} fov={50} />
      <CameraRig handPosition={handPosition} />
      
      {/* Lighting - Luxury Lobby Feel */}
      <Environment preset="lobby" background={false} />
      <ambientLight intensity={0.2} color="#013220" />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} color="#FFD700" castShadow />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#B76E79" />

      {/* Content */}
      <group position={[0, -2, 0]}>
         <Foliage progress={treeProgress} />
         <Ornaments progress={treeProgress} />
         <Polaroids progress={treeProgress} />
      </group>

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};