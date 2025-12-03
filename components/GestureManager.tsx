import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TreeState, HandData } from '../types';

interface GestureManagerProps {
  onStateChange: (state: TreeState) => void;
  onHandMove: (pos: { x: number; y: number } | null) => void;
}

declare global {
  interface Window {
    handTrack: any;
  }
}

export const GestureManager: React.FC<GestureManagerProps> = ({ onStateChange, onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [status, setStatus] = useState("Initializing AI...");
  const modelRef = useRef<any>(null);
  const requestRef = useRef<number>();

  // Load Model
  useEffect(() => {
    if (!window.handTrack) {
      setStatus("Library failed to load.");
      return;
    }
    
    const modelParams = {
      flipHorizontal: true,
      maxNumBoxes: 1,
      iouThreshold: 0.5,
      scoreThreshold: 0.6,
    };

    window.handTrack.load(modelParams).then((lmodel: any) => {
      modelRef.current = lmodel;
      setIsModelLoaded(true);
      setStatus("AI Ready. Enable Camera.");
    });

    return () => {
        if (modelRef.current) {
            modelRef.current.dispose();
        }
    };
  }, []);

  const startVideo = useCallback(() => {
    if (!modelRef.current || !videoRef.current) return;
    
    window.handTrack.startVideo(videoRef.current).then((status: boolean) => {
      if (status) {
        setCameraActive(true);
        setStatus("Tracking Active. Open Hand = Unleash.");
        runDetection();
      } else {
        setStatus("Camera denied.");
      }
    });
  }, [isModelLoaded]);

  const toggleVideo = () => {
    if (!cameraActive) {
      startVideo();
    } else {
      window.handTrack.stopVideo(videoRef.current);
      setCameraActive(false);
      setStatus("AI Paused.");
      cancelAnimationFrame(requestRef.current!);
    }
  };

  const runDetection = () => {
    if (!modelRef.current || !videoRef.current) return;

    modelRef.current.detect(videoRef.current).then((predictions: HandData[]) => {
      if (predictions.length > 0) {
        const hand = predictions[0];
        
        // Normalize coordinates for camera control (-1 to 1)
        // bbox: [x, y, width, height]
        const centerX = hand.bbox[0] + hand.bbox[2] / 2;
        const centerY = hand.bbox[1] + hand.bbox[3] / 2;
        
        const normX = (centerX / videoRef.current!.width) * 2 - 1;
        const normY = (centerY / videoRef.current!.height) * 2 - 1;
        
        onHandMove({ x: normX, y: normY });

        // State Logic:
        // Handtrack.js usually returns 'open', 'closed', 'face', 'point', etc.
        // It's sometimes just 'hand'. 
        // We will assume: If "open" is detected explicitly -> CHAOS.
        // If "closed" or "pinch" -> FORMED.
        // If just generic "hand", we might toggle based on previous or default.
        
        const label = hand.label.toLowerCase();
        
        if (label === 'open') {
          onStateChange(TreeState.CHAOS);
        } else if (label === 'closed' || label === 'pinch') {
          onStateChange(TreeState.FORMED);
        }
        // If detection is generic, we do nothing to state, just move camera
      } else {
        onHandMove(null);
        // If no hand, revert to Formed usually? Or stay put. 
        // Let's default to Formed if no interaction for a while (handled in App maybe)
      }
      
      if (cameraActive) {
        requestRef.current = requestAnimationFrame(runDetection);
      }
    });
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="bg-black/80 border border-yellow-600/50 p-2 rounded text-yellow-500 text-xs font-mono mb-2">
        {status}
      </div>
      
      <div className="relative border-2 border-yellow-600 rounded overflow-hidden shadow-[0_0_15px_rgba(255,215,0,0.3)]">
        <video 
          ref={videoRef} 
          className={`w-32 h-24 object-cover ${cameraActive ? 'block' : 'hidden'}`} 
        />
        {!cameraActive && (
           <div className="w-32 h-24 bg-gray-900 flex items-center justify-center text-gray-500 text-xs">
             Camera Off
           </div>
        )}
      </div>

      <button 
        onClick={toggleVideo}
        disabled={!isModelLoaded}
        className={`px-4 py-2 rounded font-bold uppercase tracking-widest text-xs transition-all duration-300
          ${isModelLoaded 
            ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_10px_#FFD700]' 
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
        `}
      >
        {cameraActive ? 'Stop AI' : 'Start Camera AI'}
      </button>
      
      <div className="text-[10px] text-yellow-500/50 max-w-[150px] text-right">
        Make a fist to Form.<br/>Open hand to Unleash Chaos.
      </div>
    </div>
  );
};