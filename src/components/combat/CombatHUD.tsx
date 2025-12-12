"use client";

import { useCombatStore } from "@/store/useCombatStore";
import { Heart, Zap, Shield, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

export default function CombatHUD() {
  const player = useCombatStore((state) => state.player);
  const enemy = useCombatStore((state) => state.enemy);
  const message = useCombatStore((state) => state.message);
  const detectedGesture = useCombatStore((state) => state.detectedGesture);
  const handPosition = useCombatStore((state) => state.handPosition);
  
  // Visual feedback for low health
  const [damageFlash, setDamageFlash] = useState(false);
  
  useEffect(() => {
    if (player.action === "HIT") {
        setDamageFlash(true);
        const t = setTimeout(() => setDamageFlash(false), 200);
        return () => clearTimeout(t);
    }
  }, [player.action]);

  // Simplify Gesture Display
  const getGestureIcon = (gesture: string) => {
      switch(gesture) {
          case "GRAB": return "✊ HEAVY";
          case "POINT": return "☝️ LIGHT";
          case "PALM_OPEN": return "🖐️ SPECIAL";
          case "VICTORY": return "✌️ BLOCK";
          case "PINCH": return "🤏 JAB";
          default: return "READY";
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 md:p-8 font-mono">
      {/* Damage Flash Overlay */}
      <div className={clsx(
          "absolute inset-0 bg-red-600/20 pointer-events-none transition-opacity duration-150",
          damageFlash ? "opacity-100" : "opacity-0"
      )} />

      {/* --- TOP BAR: ENEMY STATUS --- */}
      <div className="w-full flex justify-center items-start pt-2">
        <div className="w-full max-w-2xl flex flex-col gap-2 relative">
            <div className="flex justify-between text-red-400 text-xs md:text-sm tracking-widest font-bold items-center">
                <span>ENEMY UNIT</span>
                {enemy.action === "ATTACK" && <span className="text-red-500 animate-pulse flex items-center gap-1"><AlertTriangle size={14}/> ATTACKING</span>}
                {enemy.action === "BLOCK" && <span className="text-blue-400 flex items-center gap-1"><Shield size={14}/> BLOCKING</span>}
                {enemy.action === "STUNNED" && <span className="text-yellow-400 animate-bounce">STUNNED</span>}
                <span>{Math.ceil(enemy.hp)}%</span>
            </div>
            
            {/* Enemy Health Bar */}
            <div className="h-3 md:h-5 bg-gray-900/90 border border-red-900/50 rounded-sm relative overflow-hidden shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                <div 
                    className="h-full bg-red-600 transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(0, enemy.hp)}%` }}
                />
            </div>
        </div>
      </div>

      {/* --- CENTER: MESSAGES & ALERTS --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl px-4">
          {message && (
              <div className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-200">
                  {message}
              </div>
          )}
          
          {/* Dodge/Movement Indicators */}
          <div className="flex justify-between w-full max-w-lg mx-auto mt-12 opacity-80 text-sm md:text-base font-bold tracking-widest">
              <div className={clsx("transition-all duration-200 flex items-center gap-2", handPosition.x < -0.3 ? "text-cyan-400 scale-110 opacity-100 shadow-glow" : "text-gray-600")}>
                  <span>◀ MOVE LEFT</span>
              </div>
              <div className={clsx("transition-all duration-200 flex items-center gap-2", handPosition.x > 0.3 ? "text-cyan-400 scale-110 opacity-100 shadow-glow" : "text-gray-600")}>
                  <span>MOVE RIGHT ▶</span>
              </div>
          </div>
      </div>

      {/* --- BOTTOM BAR: PLAYER STATUS --- */}
      <div className="w-full flex flex-col-reverse md:flex-row justify-between items-end gap-4 md:gap-8 pb-4">
          
          {/* Left: Player Health */}
          <div className="w-full md:w-80 flex flex-col gap-1">
               <div className="flex justify-between text-cyan-400 text-xs font-bold tracking-widest mb-1">
                   <div className="flex items-center gap-2">
                       <Heart size={16} className="fill-current" />
                       <span>SYSTEM INTEGRITY</span>
                   </div>
                   <span>{Math.ceil(player.hp)}%</span>
               </div>
               <div className="h-4 md:h-6 bg-gray-900/90 border border-cyan-900/50 rounded-sm relative overflow-hidden shadow-[0_0_10px_rgba(8,145,178,0.3)]">
                    <div 
                        className={clsx(
                            "h-full transition-all duration-300 ease-out",
                            player.hp < 30 ? "bg-red-500 animate-pulse" : "bg-cyan-500"
                        )}
                        style={{ width: `${Math.max(0, player.hp)}%` }}
                    />
               </div>
          </div>

          {/* Center: Action Feedback */}
          <div className="hidden md:flex flex-col items-center gap-2 mb-2">
               <div className={clsx(
                   "px-6 py-2 rounded-full border-2 backdrop-blur-md transition-all duration-200 font-bold tracking-wider text-xl",
                   player.action === "ATTACK" ? "border-red-500 bg-red-900/40 text-red-100" :
                   player.action === "BLOCK" ? "border-blue-500 bg-blue-900/40 text-blue-100" :
                   "border-cyan-500/30 bg-black/60 text-cyan-100"
               )}>
                   {getGestureIcon(detectedGesture)}
               </div>
          </div>

          {/* Right: Energy */}
          <div className="w-full md:w-80 flex flex-col gap-1 items-end">
               <div className="flex justify-between w-full text-yellow-400 text-xs font-bold tracking-widest mb-1">
                   <span>ENERGY</span>
                   <div className="flex items-center gap-2">
                       <span>{Math.floor(player.energy)}%</span>
                       <Zap size={16} className="fill-current" />
                   </div>
               </div>
               <div className="h-4 md:h-6 w-full bg-gray-900/90 border border-yellow-900/50 rounded-sm relative overflow-hidden shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                    <div 
                        className="h-full bg-yellow-500 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, player.energy)}%` }}
                    />
               </div>
          </div>
      </div>
      
      {/* Mobile-friendly Action Feedback (replaces center block on small screens) */}
      <div className="md:hidden absolute bottom-24 left-1/2 -translate-x-1/2">
           <div className={clsx(
               "px-4 py-1 rounded-full border backdrop-blur-md text-sm font-bold",
               player.action === "ATTACK" ? "border-red-500 bg-red-900/60 text-red-100" :
               player.action === "BLOCK" ? "border-blue-500 bg-blue-900/60 text-blue-100" :
               "border-cyan-500/30 bg-black/60 text-cyan-100"
           )}>
               {getGestureIcon(detectedGesture)}
           </div>
      </div>
      
      {/* Quick Guide */}
      <div className="absolute top-24 left-6 hidden xl:flex flex-col gap-3 text-[10px] font-mono text-cyan-600/70 pointer-events-none bg-black/40 p-4 rounded-lg border border-cyan-900/30 backdrop-blur-sm">
          <div className="font-bold text-cyan-400 mb-1 border-b border-cyan-900/50 pb-1">COMBAT MANUAL</div>
          <div className="grid grid-cols-[20px_1fr] gap-1 items-center">
              <span className="text-center text-lg">✊</span> <span>HEAVY STRIKE</span>
              <span className="text-center text-lg">☝️</span> <span>LIGHT JAB</span>
              <span className="text-center text-lg">🖐️</span> <span>SPECIAL ART</span>
              <span className="text-center text-lg">✌️</span> <span>DEFLECT</span>
              <span className="text-center text-lg">↔</span> <span>EVASION</span>
          </div>
      </div>

    </div>
  );
}
