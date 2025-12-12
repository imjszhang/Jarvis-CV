"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { useCombatStore } from "@/store/useCombatStore";
import { FloatingParticles } from "@/components/game/ParticleEffects";

// --- Game Logic Component ---
function GameLoop() {
  const updateEnemyAI = useCombatStore((state) => state.updateEnemyAI);
  const resolveCombat = useCombatStore((state) => state.resolveCombat);
  
  // Main Frame Loop
  useFrame((state, delta) => {
     updateEnemyAI(delta * 1000);
     resolveCombat();
     
     // Dynamic camera movement
     const { player, handPosition } = useCombatStore.getState();
     
     // Smooth camera sway based on player movement (Dodge)
     const targetX = handPosition.x * 1.5;
     state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
     
     // Camera shake on hit
     if (player.action === "HIT") {
         const shakeIntensity = 0.2;
         state.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
         state.camera.position.y = 2 + (Math.random() - 0.5) * shakeIntensity;
     } else {
         state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 2, 0.05);
     }
     
     // Always look slightly above 0,0,0
     state.camera.lookAt(0, 1.2, -5);
  });

  return null;
}

// --- Minimalist Robot Enemy ---
function EnemyModel() {
  const enemy = useCombatStore((state) => state.enemy);
  const group = useRef<THREE.Group>(null);
  
  // Materials - cleaner look
  const armorMat = useMemo(() => new THREE.MeshStandardMaterial({ 
      color: "#e11d48", // Rose-600
      roughness: 0.4, 
      metalness: 0.6 
  }), []);
  
  const jointMat = useMemo(() => new THREE.MeshStandardMaterial({ 
      color: "#1f2937", // Gray-800
      roughness: 0.7 
  }), []);
  
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ 
      color: "#fbbf24" // Amber-400
  }), []);

  useFrame((state) => {
      if (!group.current) return;

      const t = state.clock.elapsedTime;
      
      // Base idle animation - subtle breathing
      group.current.position.y = Math.sin(t * 1.5) * 0.05;

      // Action animations
      if (enemy.action === "ATTACK") {
          // Sharp lunge
          const progress = (Date.now() - enemy.lastActionTime) / 500;
          if (progress < 1) {
              const lunge = Math.sin(progress * Math.PI) * 4;
              group.current.position.z = -5 + lunge;
          } else {
              group.current.position.z = -5;
          }
      } else if (enemy.action === "HIT") {
          // Knockback/Shake
          group.current.position.z = -5.5;
          group.current.rotation.x = -0.2;
      } else if (enemy.action === "BLOCK") {
          // Brace
          group.current.position.z = -5;
          group.current.rotation.x = 0.1;
      } else {
          // Reset
          group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, -5, 0.1);
          group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
      }
  });

  return (
    <group ref={group} position={[0, 0, -5]}>
      {/* Torso */}
      <mesh position={[0, 1.4, 0]} material={armorMat}>
          <boxGeometry args={[0.8, 1.2, 0.5]} />
      </mesh>
      
      {/* Head */}
      <group position={[0, 2.3, 0]}>
          <mesh material={armorMat}>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
          </mesh>
          {/* Eye Visor */}
          <mesh position={[0, 0, 0.26]} material={glowMat}>
              <planeGeometry args={[0.4, 0.1]} />
          </mesh>
      </group>
      
      {/* Shoulders */}
      <mesh position={[-0.6, 1.9, 0]} material={jointMat}>
          <sphereGeometry args={[0.25]} />
      </mesh>
      <mesh position={[0.6, 1.9, 0]} material={jointMat}>
          <sphereGeometry args={[0.25]} />
      </mesh>
      
      {/* Arms */}
      <group position={[-0.6, 1.9, 0]} rotation={[0, 0, 0.1]}>
           <mesh position={[0, -0.6, 0]} material={armorMat}>
               <boxGeometry args={[0.2, 1.0, 0.2]} />
           </mesh>
           {/* Shield Effect */}
           {enemy.action === "BLOCK" && (
                <mesh position={[0.4, -0.8, 0.4]} rotation={[0, 0.5, 0]}>
                     <ringGeometry args={[0.8, 1, 32]} />
                     <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} transparent opacity={0.6} />
                </mesh>
           )}
      </group>
      <group position={[0.6, 1.9, 0]} rotation={[0, 0, -0.1]}>
           <mesh position={[0, -0.6, 0]} material={armorMat}>
               <boxGeometry args={[0.2, 1.0, 0.2]} />
           </mesh>
      </group>

      {/* Legs */}
      <mesh position={[-0.25, 0.6, 0]} material={armorMat}>
          <boxGeometry args={[0.25, 1.2, 0.3]} />
      </mesh>
      <mesh position={[0.25, 0.6, 0]} material={armorMat}>
          <boxGeometry args={[0.25, 1.2, 0.3]} />
      </mesh>
      
      {/* Shadow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial color="black" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// --- Player Visuals (Hands/Effects) ---
function PlayerHands() {
    const player = useCombatStore((state) => state.player);
    const handPosition = useCombatStore((state) => state.handPosition);
    
    return (
        <group>
            {/* Visual Guide for Hands */}
            {/* Right Hand (Attack) */}
            <mesh position={[handPosition.x * 3 + 0.8, 1, -2]} rotation={[0, 0, 0]}>
                 <sphereGeometry args={[0.1]} />
                 <meshBasicMaterial color={player.action === "ATTACK" ? "#ef4444" : "#06b6d4"} transparent opacity={0.6} />
            </mesh>
            
             {/* Left Hand (Secondary/Block) */}
            <mesh position={[handPosition.x * 3 - 0.8, 1, -2]} rotation={[0, 0, 0]}>
                 <sphereGeometry args={[0.1]} />
                 <meshBasicMaterial color={player.action === "BLOCK" ? "#3b82f6" : "#06b6d4"} transparent opacity={0.6} />
            </mesh>
            
            {/* Impact Effect */}
            {player.action === "ATTACK" && (
                <mesh position={[handPosition.x * 3, 1.2, -3]}>
                    <sphereGeometry args={[0.3]} />
                    <meshBasicMaterial color="#f97316" transparent opacity={0.8} />
                </mesh>
            )}
            
            {/* Shield Effect */}
            {player.action === "BLOCK" && (
                <mesh position={[0, 1.2, -1.5]}>
                    <sphereGeometry args={[1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                    <meshStandardMaterial color="#06b6d4" transparent opacity={0.15} side={THREE.DoubleSide} wireframe />
                </mesh>
            )}
        </group>
    );
}

// --- Clean Arena Environment ---
function Arena() {
  return (
    <group>
      {/* Floor - Minimal Grid */}
      <gridHelper args={[100, 40, "#334155", "#0f172a"]} position={[0, 0, 0]} />
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial color="#020617" />
      </mesh>
      
      {/* Subtle Particles */}
      <FloatingParticles count={50} color="#38bdf8" speed={0.1} />
      
      {/* Lighting - Dramatic */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#f43f5e" />
      
      {/* Background - Deep Void */}
      <fog attach="fog" args={["#020617", 8, 30]} />
    </group>
  );
}

export default function CombatScene() {
  return (
    <div className="absolute inset-0 z-10 bg-slate-950">
      <Canvas
        camera={{ position: [0, 2, 4], fov: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <GameLoop />
        <Arena />
        <EnemyModel />
        <PlayerHands />
        
        <EffectComposer>
            <Bloom luminanceThreshold={0.2} intensity={0.8} radius={0.5} />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
