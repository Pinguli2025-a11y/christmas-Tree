import React, { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { GestureManager } from './components/GestureManager';
import { TreeState } from './types';
import * as THREE from 'three';

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [treeProgress, setTreeProgress] = useState(1); // 1 = Formed, 0 = Chaos
  const [handPos, setHandPos] = useState<{x: number, y: number} | null>(null);
  
  // Smoothly interpolate the progress based on state
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setTreeProgress((prev) => {
        const target = treeState === TreeState.FORMED ? 1 : 0;
        const delta = target - prev;
        // Move towards target
        if (Math.abs(delta) < 0.001) return target;
        return prev + delta * 0.05;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [treeState]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 3D Scene */}
      <Scene treeProgress={treeProgress} handPosition={handPos} />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start">
        <div className="text-left">
          <h1 className="text-4xl md:text-6xl text-yellow-500 font-bold tracking-tighter luxury-text drop-shadow-lg">
            THE GRAND TREE
          </h1>
          <p className="text-yellow-100/60 mt-2 font-serif italic tracking-wide">
            A Monument to Holiday Luxury
          </p>
        </div>
        
        <div className="pointer-events-auto">
          {/* Manual Toggle Fallback */}
          <button 
             onClick={() => setTreeState(s => s === TreeState.FORMED ? TreeState.CHAOS : TreeState.FORMED)}
             className="border border-yellow-500/30 hover:bg-yellow-900/20 text-yellow-400 px-6 py-2 rounded-full uppercase text-xs tracking-[0.2em] transition-all backdrop-blur-sm"
          >
            {treeState === TreeState.FORMED ? 'Unleash Chaos' : 'Form Order'}
          </button>
        </div>
      </div>

      {/* Decorative Borders */}
      <div className="absolute top-4 left-4 w-32 h-32 border-l-2 border-t-2 border-yellow-600/30 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-32 h-32 border-r-2 border-b-2 border-yellow-600/30 pointer-events-none" />

      {/* Gesture Controls */}
      <GestureManager 
        onStateChange={setTreeState}
        onHandMove={setHandPos}
      />
      
      {/* Footer / Instructions */}
      <div className="absolute bottom-8 left-8 text-yellow-500/40 text-xs font-mono pointer-events-none">
        POS: {handPos ? `X:${handPos.x.toFixed(2)} Y:${handPos.y.toFixed(2)}` : 'MOUSE/IDLE'} <br/>
        STATUS: {treeState} <br/>
        INTEGRITY: {(treeProgress * 100).toFixed(1)}%
      </div>
    </div>
  );
}