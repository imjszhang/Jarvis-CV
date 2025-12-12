"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleSystemProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
}

// Background floating particles
export function FloatingParticles({
  count = 100,
  color = "#00ffff",
  size = 0.05,
  speed = 0.2,
}: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null);
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = -Math.random() * 30;
      
      velocities[i3] = (Math.random() - 0.5) * speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i3 + 2] = Math.random() * speed + 0.1;
    }
    
    return { positions, velocities };
  }, [count, speed]);
  
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    const positionAttr = particlesRef.current.geometry.attributes.position;
    const positions = positionAttr.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] += velocities[i3] * delta;
      positions[i3 + 1] += velocities[i3 + 1] * delta;
      positions[i3 + 2] += velocities[i3 + 2] * delta;
      
      // Reset if past camera
      if (positions[i3 + 2] > 10) {
        positions[i3] = (Math.random() - 0.5) * 20;
        positions[i3 + 1] = (Math.random() - 0.5) * 10;
        positions[i3 + 2] = -30;
      }
    }
    
    positionAttr.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Trail effect behind targets
export function TrailParticles({ 
  position = [0, 0, 0],
  color = "#00ffff",
  active = true 
}: { 
  position?: [number, number, number];
  color?: string;
  active?: boolean;
}) {
  const trailRef = useRef<THREE.Points>(null);
  const trailCount = 20;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(trailCount * 3);
    for (let i = 0; i < trailCount; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2] - i * 0.5;
    }
    return pos;
  }, [position, trailCount]);
  
  useFrame(() => {
    if (!trailRef.current || !active) return;
    
    const positionAttr = trailRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    
    // Shift positions back
    for (let i = trailCount - 1; i > 0; i--) {
      const i3 = i * 3;
      const prev3 = (i - 1) * 3;
      posArray[i3] = posArray[prev3];
      posArray[i3 + 1] = posArray[prev3 + 1];
      posArray[i3 + 2] = posArray[prev3 + 2];
    }
    
    // Update first position
    posArray[0] = position[0];
    posArray[1] = position[1];
    posArray[2] = position[2];
    
    positionAttr.needsUpdate = true;
  });
  
  if (!active) return null;
  
  return (
    <points ref={trailRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Burst effect on hit
export function BurstEffect({
  position = [0, 0, 0],
  color = "#00ffff",
  active = false,
  onComplete,
}: {
  position?: [number, number, number];
  color?: string;
  active?: boolean;
  onComplete?: () => void;
}) {
  const burstRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const burstCount = 30;
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(burstCount * 3);
    const velocities = new Float32Array(burstCount * 3);
    
    for (let i = 0; i < burstCount; i++) {
      const i3 = i * 3;
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      positions[i3] = position[0];
      positions[i3 + 1] = position[1];
      positions[i3 + 2] = position[2];
      
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = Math.sin(angle) * speed;
      velocities[i3 + 2] = (Math.random() - 0.5) * 2;
    }
    
    return { positions, velocities };
  }, [position, burstCount]);
  
  useFrame((state, delta) => {
    if (!burstRef.current || !active) return;
    
    timeRef.current += delta;
    
    const positionAttr = burstRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    
    for (let i = 0; i < burstCount; i++) {
      const i3 = i * 3;
      posArray[i3] += velocities[i3] * delta;
      posArray[i3 + 1] += velocities[i3 + 1] * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta;
    }
    
    positionAttr.needsUpdate = true;
    
    // Fade out
    const material = burstRef.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - timeRef.current * 2);
    
    // Cleanup
    if (timeRef.current > 0.5) {
      onComplete?.();
    }
  });
  
  if (!active) return null;
  
  return (
    <points ref={burstRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Speed lines effect
export function SpeedLines({ intensity = 1 }: { intensity?: number }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const lineCount = 50;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(lineCount * 6); // 2 points per line * 3 coords
    
    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 8;
      const z = -Math.random() * 20;
      
      // Start point
      pos[i6] = x;
      pos[i6 + 1] = y;
      pos[i6 + 2] = z;
      
      // End point (stretched back)
      pos[i6 + 3] = x;
      pos[i6 + 4] = y;
      pos[i6 + 5] = z - 2;
    }
    
    return pos;
  }, [lineCount]);
  
  useFrame((state, delta) => {
    if (!linesRef.current) return;
    
    const positionAttr = linesRef.current.geometry.attributes.position;
    const posArray = positionAttr.array as Float32Array;
    
    for (let i = 0; i < lineCount; i++) {
      const i6 = i * 6;
      
      // Move forward
      posArray[i6 + 2] += intensity * delta * 10;
      posArray[i6 + 5] += intensity * delta * 10;
      
      // Reset if past camera
      if (posArray[i6 + 2] > 5) {
        const x = (Math.random() - 0.5) * 15;
        const y = (Math.random() - 0.5) * 8;
        const z = -20;
        
        posArray[i6] = x;
        posArray[i6 + 1] = y;
        posArray[i6 + 2] = z;
        posArray[i6 + 3] = x;
        posArray[i6 + 4] = y;
        posArray[i6 + 5] = z - 2;
      }
    }
    
    positionAttr.needsUpdate = true;
  });
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.3 * intensity}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

