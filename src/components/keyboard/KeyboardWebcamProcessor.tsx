"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";
import { useKeyboardStore } from "@/store/useKeyboardStore";
import type { Results as HandsResults } from "@mediapipe/hands";

export default React.memo(function KeyboardWebcamProcessor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMounted = useRef(true);

  // Pinch state tracking for edge detection
  const wasPinching = useRef(false);

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
        maxNumHands: 1, // Only need one hand for keyboard input
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults(onHandsResults);

      // Camera setup
      camera = new Camera(videoElement, {
        onFrame: async () => {
          if (!isMounted.current) return;
          if (hands) await hands.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
      });

      camera.start();

      function onHandsResults(results: HandsResults) {
        if (!isMounted.current || !canvasCtx) return;
        
        const { setCursor, setHandDetected } = useKeyboardStore.getState();

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw video feed (mirrored)
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          setHandDetected(true);

          // Draw sci-fi hand skeleton
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "rgba(0, 255, 136, 0.6)",
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "rgba(255, 255, 255, 0.8)",
            fillColor: "rgba(0, 255, 136, 0.8)",
            radius: 3,
            lineWidth: 1,
          });

          // Get index finger tip (Landmark 8) and thumb tip (Landmark 4)
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];

          // Calculate cursor position (mirror x coordinate)
          const cursorX = 1 - indexTip.x;
          const cursorY = indexTip.y;

          // Detect pinch gesture (distance between thumb and index finger)
          const pinchDist = Math.hypot(
            indexTip.x - thumbTip.x,
            indexTip.y - thumbTip.y
          );
          const isPinching = pinchDist < 0.06;

          // Detect pinch edge (transition from not pinching to pinching)
          const isClickingNow = isPinching && !wasPinching.current;
          wasPinching.current = isPinching;

          // Update store
          setCursor({
            x: cursorX,
            y: cursorY,
            isClicking: isClickingNow,
            active: true,
          });

          // Draw targeting reticle on index finger
          drawTargetingReticle(
            canvasCtx,
            (1 - indexTip.x) * canvasElement.width,
            indexTip.y * canvasElement.height,
            isPinching
          );
        } else {
          setHandDetected(false);
          setCursor({ active: false, isClicking: false });
        }

        canvasCtx.restore();
      }

      function drawTargetingReticle(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        isActive: boolean
      ) {
        const color = isActive ? "#00ff88" : "#00ffaa";
        const size = isActive ? 20 : 15;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = isActive ? 15 : 8;

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x - size / 3, y);
        ctx.moveTo(x + size / 3, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y - size / 3);
        ctx.moveTo(x, y + size / 3);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Outer ring
        ctx.beginPath();
        ctx.arc(x, y, size + 5, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? "rgba(0, 255, 136, 0.8)" : "rgba(0, 255, 170, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;
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
    <div className="fixed inset-0 z-0">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        width={1280}
        height={720}
      />
    </div>
  );
});

