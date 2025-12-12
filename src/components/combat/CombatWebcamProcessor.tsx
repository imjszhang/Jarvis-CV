"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";
import { useCombatStore } from "@/store/useCombatStore";
import { GestureType } from "@/store/useStore";
import type { Results as HandsResults } from "@mediapipe/hands";

interface CombatWebcamProcessorProps {
  className?: string;
}

export default React.memo(function CombatWebcamProcessor({
  className,
}: CombatWebcamProcessorProps) {
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

        const { updateInput, status } = useCombatStore.getState();

        let detectedGesture: GestureType = "IDLE";
        let handX = 0; // -1 (left) to 1 (right)
        let handY = 0; 

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Prefer Right hand or first hand
          let targetHandIndex = 0;
          
          for (const [index, classification] of results.multiHandedness.entries()) {
              if (classification.label === "Right") {
                  targetHandIndex = index;
                  break;
              }
          }

          const landmarks = results.multiHandLandmarks[targetHandIndex];
          if (landmarks) {
              // 1. Detect Gesture
              const rawGesture = detectGesture(landmarks);
              
              // Smooth buffer (Debouncing)
              gestureHistory.current.push(rawGesture);
              if (gestureHistory.current.length > 5) {
                gestureHistory.current.shift();
              }

              // Get mode
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
              } else {
                  detectedGesture = gestureHistory.current[gestureHistory.current.length - 1];
              }

              // 2. Detect Position (Wrist)
              // Normalizing: 0..1 -> -1..1
              // Note: MediaPipe x is 0 left, 1 right. Canvas is mirrored?
              // The component has -scale-x-100, so visual is mirrored.
              // Logic should likely use raw coordinates (0=left of image sent to MP).
              const wrist = landmarks[0];
              handX = (wrist.x - 0.5) * 2; // -1 to 1
              handY = (wrist.y - 0.5) * 2;

              // Draw
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                  color: "#00ffff",
                  lineWidth: 2,
              });
              drawLandmarks(canvasCtx, landmarks, {
                  color: "#ffffff",
                  fillColor: "#00ffff",
                  radius: 3,
                  lineWidth: 1,
              });
          }
        }

        // Update Store
        updateInput(detectedGesture, handX, handY);

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
          return (
            Math.hypot(tip.x - wrist.x, tip.y - wrist.y) >
            Math.hypot(pip.x - wrist.x, pip.y - wrist.y) * 1.05
          );
        };

        const indexExt = isExtended(8, 6);
        const middleExt = isExtended(12, 10);
        const ringExt = isExtended(16, 14);
        const pinkyExt = isExtended(20, 18);

        const pinchDist = Math.hypot(
          thumbTip.x - indexTip.x,
          thumbTip.y - indexTip.y
        );
        
        let extCount = 0;
        if (indexExt) extCount++;
        if (middleExt) extCount++;
        if (ringExt) extCount++;
        if (pinkyExt) extCount++;

        if (pinchDist < 0.06) return "PINCH";
        if (extCount >= 4) return "PALM_OPEN";
        if (extCount <= 1 && !indexExt) return "GRAB";
        if (indexExt && middleExt && !ringExt && !pinkyExt) return "VICTORY";
        if (indexExt && !middleExt && !ringExt && !pinkyExt) return "POINT";

        return "IDLE";
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
    </div>
  );
});

