"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { GestureType } from "@/store/useStore";
import type { Results as HandsResults } from "@mediapipe/hands";

const GESTURE_ICONS: Record<string, string> = {
  PALM_OPEN: "🖐️",
  GRAB: "✊",
  VICTORY: "✌️",
  POINT: "☝️",
  PINCH: "🤏",
  IDLE: "",
};

interface GameWebcamProcessorProps {
  className?: string;
}

export default React.memo(function GameWebcamProcessor({
  className,
}: GameWebcamProcessorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMounted = useRef(true);

  const gestureHistory = useRef<GestureType[]>([]);

  useEffect(() => {
    isMounted.current = true;
    let camera: any = null;
    let hands: any = null;

    const initMediaPipe = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      if (!canvasCtx) return;

      // Dynamic imports
      const { Camera } = await import("@mediapipe/camera_utils");
      const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
      const { drawConnectors, drawLandmarks } = await import(
        "@mediapipe/drawing_utils"
      );

      // Initialize Hands
      hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults(onHandsResults);

      // Camera setup
      camera = new Camera(videoElement, {
        onFrame: async () => {
          if (!isMounted.current) return;
          if (hands) await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });

      camera.start();

      function onHandsResults(results: HandsResults) {
        if (!isMounted.current || !canvasCtx) return;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw video feed
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const { setDetectedGesture, status, tutorialStep } = useGameStore.getState();

        let detectedGesture: GestureType = "IDLE";

        if (results.multiHandLandmarks) {
          for (const [
            index,
            landmarks,
          ] of results.multiHandLandmarks.entries()) {
            
            // Detect gesture first to determine color
            let currentGesture: GestureType = "IDLE";
            const label = results.multiHandedness[index]?.label;
            
            // We'll use the detection logic for every hand to color it correctly
            const rawGesture = detectGesture(landmarks);
            currentGesture = rawGesture;

            // Update global detection (prefer Right hand)
            if (label === "Right" || detectedGesture === "IDLE") {
              // Smooth buffer (Debouncing)
              gestureHistory.current.push(rawGesture);
              if (gestureHistory.current.length > 5) {
                gestureHistory.current.shift();
              }

              // Get mode (most frequent gesture in history)
              const counts: Record<string, number> = {};
              let maxCount = 0;
              let modeGesture = rawGesture;

              for (const g of gestureHistory.current) {
                counts[g] = (counts[g] || 0) + 1;
                if (counts[g] > maxCount) {
                  maxCount = counts[g];
                  modeGesture = g;
                }
              }

              if (maxCount >= 3) {
                detectedGesture = modeGesture as GestureType;
                // Use smoothed gesture for visual if it's the primary hand
                currentGesture = detectedGesture;
              }
            }

            // Determine Color based on Game Status
            let skeletonColor = "rgba(0, 243, 255, 0.6)";
            let fillColor = "rgba(0, 243, 255, 0.8)";

            if (status === "calibration" && tutorialStep !== "COMPLETE") {
                if (currentGesture === tutorialStep) {
                    skeletonColor = "#22c55e"; // Green
                    fillColor = "#22c55e";
                } else if (currentGesture !== "IDLE") {
                    skeletonColor = "#ef4444"; // Red
                    fillColor = "#ef4444";
                }
            } else if (currentGesture !== "IDLE") {
                skeletonColor = getGestureColor(currentGesture);
                fillColor = skeletonColor;
            }

            // Draw hand skeleton
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
              color: skeletonColor,
              lineWidth: 2,
            });
            drawLandmarks(canvasCtx, landmarks, {
              color: "rgba(255, 255, 255, 0.8)",
              fillColor: fillColor,
              radius: 3,
              lineWidth: 1,
            });

            // Draw Icon
            const icon = GESTURE_ICONS[currentGesture];
            if (icon && currentGesture !== "IDLE") {
                const wrist = landmarks[0];
                const x = wrist.x * canvasElement.width;
                const y = wrist.y * canvasElement.height;
                
                canvasCtx.font = "40px sans-serif";
                canvasCtx.fillStyle = "white";
                canvasCtx.strokeStyle = "black";
                canvasCtx.lineWidth = 4;
                canvasCtx.textAlign = "center";
                canvasCtx.textBaseline = "middle";
                canvasCtx.strokeText(icon, x, y);
                canvasCtx.fillText(icon, x, y);
            }
          }
        }

        // Always update gesture to store (even during calibration/menus for feedback)
        setDetectedGesture(detectedGesture);

        // Draw gesture label (backup)
        if (detectedGesture !== "IDLE") {
          canvasCtx.font = "bold 16px 'Share Tech Mono'";
          canvasCtx.fillStyle = getGestureColor(detectedGesture);
          canvasCtx.fillText(detectedGesture, 10, 30);
        }

        canvasCtx.restore();
      }

      function detectGesture(landmarks: any[]): GestureType {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        // Helper to check if finger is extended
        const isExtended = (tipIdx: number, pipIdx: number) => {
          const tip = landmarks[tipIdx];
          const pip = landmarks[pipIdx];
          // Check if tip is further from wrist than PIP is from wrist
          // Added 10% tolerance multiplier to be more robust
          return (
            Math.hypot(tip.x - wrist.x, tip.y - wrist.y) >
            Math.hypot(pip.x - wrist.x, pip.y - wrist.y) * 1.05
          );
        };

        const indexExt = isExtended(8, 6);
        const middleExt = isExtended(12, 10);
        const ringExt = isExtended(16, 14);
        const pinkyExt = isExtended(20, 18);

        // Distance between thumb and index for pinch
        const pinchDist = Math.hypot(
          thumbTip.x - indexTip.x,
          thumbTip.y - indexTip.y
        );
        
        // Count extended fingers (excluding thumb for simplicity in some checks)
        let extCount = 0;
        if (indexExt) extCount++;
        if (middleExt) extCount++;
        if (ringExt) extCount++;
        if (pinkyExt) extCount++;

        // Pinch has high priority
        if (pinchDist < 0.06) return "PINCH";

        // Palm Open: At least 4 fingers extended
        if (extCount >= 4) return "PALM_OPEN";

        // Grab: 0 or 1 finger extended (allows for imperfect fist)
        // STRICTER: For grab, ensure index is NOT extended
        if (extCount <= 1 && !indexExt) return "GRAB";

        // Victory: Index and Middle extended, Ring and Pinky curled
        if (indexExt && middleExt && !ringExt && !pinkyExt) return "VICTORY";

        // Point: Index extended, others curled
        if (indexExt && !middleExt && !ringExt && !pinkyExt) return "POINT";

        return "IDLE";
      }

      function getGestureColor(gesture: GestureType): string {
        switch (gesture) {
          case "PALM_OPEN":
            return "#00ffff"; // Cyan
          case "GRAB":
            return "#ef4444"; // Red
          case "VICTORY":
            return "#22c55e"; // Green
          case "POINT":
            return "#eab308"; // Yellow
          case "PINCH":
            return "#a855f7"; // Purple
          default:
            return "#ffffff";
        }
      }
    };

    initMediaPipe();

    return () => {
      isMounted.current = false;
      if (camera) (camera as any).stop();
      if (hands) (hands as any).close();
    };
  }, []);

  return (
    <div className={className}>
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover -scale-x-100"
        width={640}
        height={480}
      />
      
      {/* Gesture Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/20 rounded-xl m-4">
        <div className="absolute top-2 left-2 text-[10px] text-cyan-500/50 font-mono tracking-widest">
            CAMERA FEED
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="text-center text-[10px] text-gray-400 font-mono mb-1 tracking-widest">
            ANY POSITION OK • JUST MATCH GESTURES
        </div>
        <div className="flex justify-center gap-2 text-[10px] font-mono">
          <span className="text-cyan-400">🖐️ PALM</span>
          <span className="text-red-400">✊ GRAB</span>
          <span className="text-green-400">✌️ VICTORY</span>
        </div>
      </div>
    </div>
  );
});

