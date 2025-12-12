"use client";

import { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useGameStore, GestureTarget as GestureTargetType, JudgeResult } from "@/store/useGameStore";
import { generateBeatMap, TIMING_WINDOWS } from "@/utils/beatMaps";
import {
  playPerfectSound,
  playGreatSound,
  playGoodSound,
  playMissSound,
  playComboSound,
  startBGM,
  stopBGM,
} from "@/utils/gameAudio";
import GestureTarget from "./GestureTarget";
import { FloatingParticles, SpeedLines } from "./ParticleEffects";

// Travel time for targets from spawn to judge line (in ms)
// SLOWER: Increased from 2000 to 4000ms to give more reaction time
const TRAVEL_TIME = 4000;

function GameLogic() {
  const status = useGameStore((state) => state.status);
  const difficulty = useGameStore((state) => state.difficulty);
  const gameStartTime = useGameStore((state) => state.gameStartTime);
  const activeTargets = useGameStore((state) => state.activeTargets);
  const detectedGesture = useGameStore((state) => state.detectedGesture);
  const bpm = useGameStore((state) => state.bpm);
  const combo = useGameStore((state) => state.combo);
  
  const updateTime = useGameStore((state) => state.updateTime);
  const spawnTarget = useGameStore((state) => state.spawnTarget);
  const removeTarget = useGameStore((state) => state.removeTarget);
  const judgeHit = useGameStore((state) => state.judgeHit);
  const registerMiss = useGameStore((state) => state.registerMiss);
  
  const beatMapRef = useRef<ReturnType<typeof generateBeatMap> | null>(null);
  const nextBeatIndexRef = useRef(0);
  const lastGestureRef = useRef(detectedGesture);
  const lastComboMilestone = useRef(0);
  const targetIdCounter = useRef(0);

  // Generate beat map on game start
  useEffect(() => {
    if (status === "playing") {
      beatMapRef.current = generateBeatMap(difficulty, 90000); // 90 seconds
      nextBeatIndexRef.current = 0;
      lastComboMilestone.current = 0;
      targetIdCounter.current = 0;
      startBGM(bpm);
    } else {
      stopBGM();
    }
    
    return () => stopBGM();
  }, [status, difficulty, bpm]);

  // Game loop
  useFrame(() => {
    if (status !== "playing" || !beatMapRef.current) return;
    
    const currentTime = Date.now() - gameStartTime;
    updateTime(currentTime);
    
    // Spawn upcoming targets
    const beatMap = beatMapRef.current;
    while (nextBeatIndexRef.current < beatMap.beats.length) {
      const beat = beatMap.beats[nextBeatIndexRef.current];
      const spawnTime = beat.time - TRAVEL_TIME;
      
      if (currentTime >= spawnTime) {
        targetIdCounter.current++;
        const target: GestureTargetType = {
          id: `target-${targetIdCounter.current}-${Date.now()}`,
          gesture: beat.gesture,
          lane: beat.lane,
          spawnTime: currentTime,
          targetTime: beat.time,
          hit: false,
        };
        spawnTarget(target);
        nextBeatIndexRef.current++;
      } else {
        break;
      }
    }
    
    // Check for gesture matches
    // Only trigger when gesture CHANGES or is HOLDING correctly for a new target
    const isGestureMatching = detectedGesture !== "IDLE";
    const hasChanged = detectedGesture !== lastGestureRef.current;
    
    // Allow hitting consecutive same gestures if enough time passed since last hit
    // OR if it's a new gesture
    if (isGestureMatching) {
      // Find the closest unhit target with matching gesture
      let closestTarget: GestureTargetType | null = null;
      let closestDiff = Infinity;
      
      for (const target of activeTargets) {
        if (target.hit || target.gesture !== detectedGesture) continue;
        
        const timeDiff = Math.abs(currentTime - target.targetTime);
        if (timeDiff < closestDiff && timeDiff <= TIMING_WINDOWS.good) {
          closestTarget = target;
          closestDiff = timeDiff;
        }
      }
      
      if (closestTarget) {
        // Logic: 
        // 1. If gesture just changed to the correct one -> HIT
        // 2. If holding same gesture, but it's a new target (different ID) -> HIT
        //    (We prevent spamming by checking if target is already hit, which is done above)
        
        // Determine hit quality
        let result: JudgeResult;
        if (closestDiff <= TIMING_WINDOWS.perfect) {
          result = "perfect";
          playPerfectSound();
        } else if (closestDiff <= TIMING_WINDOWS.great) {
          result = "great";
          playGreatSound();
        } else {
          result = "good";
          playGoodSound();
        }
        
        judgeHit(closestTarget.id, result);
      }
    }
    
    lastGestureRef.current = detectedGesture;
    
    // Check for missed targets
    for (const target of activeTargets) {
      if (target.hit) continue;
      
      const timePastTarget = currentTime - target.targetTime;
      if (timePastTarget > TIMING_WINDOWS.good) {
        registerMiss(target.id);
        playMissSound();
      }
    }
    
    // Combo milestone sounds
    const comboMilestone = Math.floor(combo / 10) * 10;
    if (comboMilestone > lastComboMilestone.current && comboMilestone > 0) {
      playComboSound(comboMilestone);
      lastComboMilestone.current = comboMilestone;
    }
  });

  return null;
}

function Track() {
  const trackRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={trackRef}>
      {/* Left track */}
      <mesh position={[-3, 0, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 30]} />
        <meshBasicMaterial color="#001a33" transparent opacity={0.3} />
      </mesh>
      
      {/* Center track */}
      <mesh position={[0, 0, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 30]} />
        <meshBasicMaterial color="#002244" transparent opacity={0.3} />
      </mesh>
      
      {/* Right track */}
      <mesh position={[3, 0, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 30]} />
        <meshBasicMaterial color="#001a33" transparent opacity={0.3} />
      </mesh>
      
      {/* Track lines */}
      {[-4, -2, 2, 4].map((x, i) => (
        <mesh key={i} position={[x, 0.01, -15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.05, 30]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function JudgeLine() {
  const lineRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      // Pulsing effect
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      (lineRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });
  
  return (
    <group position={[0, 0, 0]}>
      {/* Main judge line */}
      <mesh ref={lineRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 0.2]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>
      
      {/* Lane markers */}
      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0]}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Glow */}
      <pointLight color="#00ffff" intensity={0.5} position={[0, 1, 0]} distance={5} />
    </group>
  );
}

function GridBackground() {
  return (
    <group>
      {/* Floor grid */}
      <gridHelper
        args={[100, 50, "#003366", "#001133"]}
        position={[0, -0.5, -20]}
        rotation={[0, 0, 0]}
      />
      
      {/* Side walls (subtle) */}
      <mesh position={[-8, 5, -20]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[50, 15]} />
        <meshBasicMaterial color="#000a1a" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[8, 5, -20]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[50, 15]} />
        <meshBasicMaterial color="#000a1a" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Targets() {
  const activeTargets = useGameStore((state) => state.activeTargets);
  const currentTime = useGameStore((state) => state.currentTime);
  const removeTarget = useGameStore((state) => state.removeTarget);
  
  const handleRemove = useCallback((id: string) => {
    removeTarget(id);
  }, [removeTarget]);
  
  return (
    <>
      {activeTargets.map((target) => {
        // Calculate progress (0 = just spawned, 1 = at judge line)
        const elapsed = currentTime - target.spawnTime;
        const progress = elapsed / TRAVEL_TIME;
        
        return (
          <GestureTarget
            key={target.id}
            id={target.id}
            gesture={target.gesture}
            lane={target.lane}
            progress={progress}
            hit={target.hit}
            result={target.result}
            onRemove={handleRemove}
          />
        );
      })}
    </>
  );
}

export default function GameScene() {
  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 60, rotation: [-0.3, 0, 0] }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />
        
        {/* Game Logic (runs in useFrame) */}
        <GameLogic />
        
        {/* Background */}
        <GridBackground />
        
        {/* Particle Effects */}
        <FloatingParticles count={80} color="#00ffff" size={0.04} speed={0.3} />
        <FloatingParticles count={40} color="#a855f7" size={0.03} speed={0.2} />
        <SpeedLines intensity={0.5} />
        
        {/* Track lanes */}
        <Track />
        
      {/* Judge line */}
      <JudgeLine />
      
      {/* HIT ZONE VISUALIZER - Tells user WHERE to hit */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 1.5]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.1} />
      </mesh>
        
        {/* Active targets */}
        <Targets />
        
        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            mipmapBlur
            intensity={1.2}
            radius={0.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

