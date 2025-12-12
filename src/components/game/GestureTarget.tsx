"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { GestureType } from "@/store/useStore";
import { useGameStore, Lane, JudgeResult } from "@/store/useGameStore";

interface GestureTargetProps {
  id: string;
  gesture: GestureType;
  lane: Lane;
  progress: number; // 0 = spawn, 1 = at judge line
  hit: boolean;
  result?: JudgeResult;
  onRemove: (id: string) => void;
}

// Lane X positions
const LANE_POSITIONS: Record<Lane, number> = {
  left: -3,
  center: 0,
  right: 3,
};

// Gesture colors
const GESTURE_COLORS: Record<GestureType, string> = {
  PALM_OPEN: "#00ffff",
  GRAB: "#ef4444",
  VICTORY: "#22c55e",
  POINT: "#eab308",
  PINCH: "#a855f7",
  IDLE: "#666666",
};

// Gesture symbols
const GESTURE_SYMBOLS: Record<GestureType, string> = {
  PALM_OPEN: "🖐️",
  GRAB: "✊",
  VICTORY: "✌️",
  POINT: "👆",
  PINCH: "🤏",
  IDLE: "?",
};

export default function GestureTarget({
  id,
  gesture,
  lane,
  progress,
  hit,
  result,
  onRemove,
}: GestureTargetProps) {
  const detectedGesture = useGameStore((state) => state.detectedGesture);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const hitEffectRef = useRef<THREE.Mesh>(null);
  
  const color = GESTURE_COLORS[gesture];
  const symbol = GESTURE_SYMBOLS[gesture];
  const xPos = LANE_POSITIONS[lane];
  
  // Z position: from -30 (spawn) to 0 (judge line)
  const zPos = -30 + progress * 30;
  
  // Scale based on progress (closer = larger)
  const scale = 0.5 + progress * 0.5;
  
  // Hit effect animation
  const hitTime = useRef(0);
  const isHit = hit;
  const isMatching = !hit && detectedGesture === gesture;

  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Rotate rings
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 3;
    }

    // Pulse effect if matching gesture (anticipation)
    if (isMatching) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.1;
      groupRef.current.scale.setScalar(scale * pulse);
      if (ringRef.current) {
        (ringRef.current.material as THREE.MeshBasicMaterial).color.set(color).multiplyScalar(1.5);
      }
    } else {
       groupRef.current.scale.setScalar(scale);
       if (ringRef.current) {
         (ringRef.current.material as THREE.MeshBasicMaterial).color.set(isHit ? resultColor : color);
       }
    }
    
    // Hit effect animation
    if (isHit && hitEffectRef.current) {
      hitTime.current += delta;
      const effectScale = 1 + hitTime.current * 5;
      hitEffectRef.current.scale.set(effectScale, effectScale, 1);
      
      // Fade out
      const material = hitEffectRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - hitTime.current * 2);
      
      // Remove after animation
      if (hitTime.current > 0.5) {
        onRemove(id);
      }
    }
    
    // Remove if past judge line without hit
    if (progress > 1.2 && !isHit) {
      onRemove(id);
    }
  });

  // Result color
  const resultColor = useMemo(() => {
    if (!result) return color;
    switch (result) {
      case "perfect":
        return "#00ff88";
      case "great":
        return "#00aaff";
      case "good":
        return "#ffaa00";
      case "miss":
        return "#ff0000";
      default:
        return color;
    }
  }, [result, color]);

  return (
    <group ref={groupRef} position={[xPos, 0, zPos]} scale={scale}>
      {/* Outer rotating ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={isHit ? resultColor : color}
          transparent
          opacity={isHit ? 0.3 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner rotating ring (opposite direction) */}
      <mesh ref={innerRingRef}>
        <ringGeometry args={[0.5, 0.6, 16]} />
        <meshBasicMaterial
          color={isHit ? resultColor : color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center core */}
      <mesh>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial
          color={isHit ? resultColor : color}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Gesture symbol */}
      <Text
        position={[0, 0, 0.1]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="black"
      >
        {symbol}
      </Text>

      {/* Hit effect */}
      {isHit && (
        <mesh ref={hitEffectRef}>
          <ringGeometry args={[1, 1.2, 32]} />
          <meshBasicMaterial
            color={resultColor}
            transparent
            opacity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Glow effect (point light) */}
      <pointLight
        color={isHit ? resultColor : color}
        intensity={isHit ? 2 : 0.5}
        distance={3}
      />
    </group>
  );
}

