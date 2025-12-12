"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCombatStore } from "@/store/useCombatStore";
import CombatScene from "@/components/combat/CombatScene";
import CombatHUD from "@/components/combat/CombatHUD";
import CombatWebcamProcessor from "@/components/combat/CombatWebcamProcessor";
import { SocialLinks } from "@/components/SocialLinks";

export default function CombatPage() {
  const startGame = useCombatStore((state) => state.startGame);
  const resetGame = useCombatStore((state) => state.resetGame);

  useEffect(() => {
    resetGame();
    // Auto-start for prototype
    startGame("NORMAL");
    
    return () => resetGame();
  }, [startGame, resetGame]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Webcam Feed (PiP) */}
      <CombatWebcamProcessor className="fixed bottom-6 left-6 w-64 h-48 rounded-xl overflow-hidden border-2 border-red-500/50 z-50 shadow-[0_0_30px_rgba(255,0,0,0.2)] bg-black/80 backdrop-blur-sm" />

      {/* 3D Scene */}
      <CombatScene />

      {/* HUD */}
      <CombatHUD />

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md border border-red-500/30 rounded-full text-red-400 hover:bg-red-900/30 hover:text-red-200 transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-mono tracking-widest">ABORT MISSION</span>
          </button>
        </Link>
      </div>
      
      {/* Title */}
      <div className="absolute top-6 right-6 z-50 text-right pointer-events-none">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-widest font-mono">
          HAND_COMBAT
        </h1>
        <p className="text-red-400 text-xs mt-1 tracking-[0.3em] opacity-70">
          FIGHT SIMULATION
        </p>
      </div>

      <SocialLinks className="bottom-6 right-6" />
    </main>
  );
}

