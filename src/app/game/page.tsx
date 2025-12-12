"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import GameScene from "@/components/game/GameScene";
import GameHUD from "@/components/game/GameHUD";
import GameMenu from "@/components/game/GameMenu";
import CalibrationOverlay from "@/components/game/CalibrationOverlay";
import GameWebcamProcessor from "@/components/game/GameWebcamProcessor";
import { SocialLinks } from "@/components/SocialLinks";

export default function GamePage() {
  const status = useGameStore((state) => state.status);
  const resetGame = useGameStore((state) => state.resetGame);

  // Reset game on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background: Webcam Feed (Picture-in-Picture) */}
      <GameWebcamProcessor className="fixed bottom-6 left-6 w-64 h-48 rounded-xl overflow-hidden border-2 border-cyan-500/50 z-50 shadow-[0_0_30px_rgba(0,255,255,0.2)] bg-black/80 backdrop-blur-sm" />

      {/* 3D Game Scene */}
      <GameScene />

      {/* Calibration Overlay */}
      {status === "calibration" && <CalibrationOverlay />}

      {/* Game HUD (Score, Combo, Lives) */}
      {status === "playing" && <GameHUD />}

      {/* Game Menu (Start, Pause, Game Over) */}
      {status !== "playing" && <GameMenu />}

      {/* Navigation Back */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-full text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-200 transition-all group">
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-xs font-mono tracking-widest">
              RETURN TO HUD
            </span>
          </button>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-6 right-6 z-50 text-right pointer-events-none">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest font-mono">
          GESTURE_RHYTHM
        </h1>
        <p className="text-cyan-400 text-xs mt-1 tracking-[0.3em] opacity-70">
          MASTER YOUR MOVES
        </p>
      </div>

      <SocialLinks className="bottom-6 right-6" />
    </main>
  );
}
