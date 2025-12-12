"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { Heart, Zap, Pause } from "lucide-react";

export default function GameHUD() {
  const score = useGameStore((state) => state.score);
  const combo = useGameStore((state) => state.combo);
  const maxCombo = useGameStore((state) => state.maxCombo);
  const lives = useGameStore((state) => state.lives);
  const maxLives = useGameStore((state) => state.maxLives);
  const lastJudge = useGameStore((state) => state.lastJudge);
  const detectedGesture = useGameStore((state) => state.detectedGesture);
  const pauseGame = useGameStore((state) => state.pauseGame);
  
  // Judge result display
  const judgeDisplayRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (lastJudge && judgeDisplayRef.current) {
      judgeDisplayRef.current.classList.remove("animate-judge");
      // Trigger reflow
      void judgeDisplayRef.current.offsetWidth;
      judgeDisplayRef.current.classList.add("animate-judge");
    }
  }, [lastJudge]);

  const getJudgeColor = (judge: string | null) => {
    switch (judge) {
      case "perfect":
        return "text-emerald-400";
      case "great":
        return "text-cyan-400";
      case "good":
        return "text-yellow-400";
      case "miss":
        return "text-red-500";
      default:
        return "text-white";
    }
  };

  const getGestureColor = (gesture: string) => {
    switch (gesture) {
      case "PALM_OPEN":
        return "text-cyan-400 border-cyan-400";
      case "GRAB":
        return "text-red-400 border-red-400";
      case "VICTORY":
        return "text-green-400 border-green-400";
      case "POINT":
        return "text-yellow-400 border-yellow-400";
      case "PINCH":
        return "text-purple-400 border-purple-400";
      default:
        return "text-gray-500 border-gray-500";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Top Bar */}
      <div className="absolute top-20 left-0 right-0 flex justify-between items-start px-8">
        {/* Score */}
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg px-6 py-3">
          <div className="text-cyan-500 text-xs font-mono tracking-widest mb-1">SCORE</div>
          <motion.div
            key={score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-white font-mono tracking-wider"
          >
            {score.toLocaleString()}
          </motion.div>
        </div>

        {/* Lives */}
        <div className="flex gap-2">
          {Array.from({ length: maxLives }).map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < lives ? 1 : 0.8,
                opacity: i < lives ? 1 : 0.3,
              }}
            >
              <Heart
                size={28}
                className={i < lives ? "text-red-500 fill-red-500" : "text-gray-600"}
              />
            </motion.div>
          ))}
        </div>

        {/* Combo */}
        <div className="bg-black/60 backdrop-blur-md border border-purple-500/30 rounded-lg px-6 py-3 text-right">
          <div className="text-purple-400 text-xs font-mono tracking-widest mb-1">COMBO</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={combo}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-3xl font-bold text-white font-mono tracking-wider"
            >
              {combo > 0 ? `${combo}x` : "-"}
            </motion.div>
          </AnimatePresence>
          {maxCombo > 0 && (
            <div className="text-purple-500/60 text-[10px] font-mono">
              MAX: {maxCombo}x
            </div>
          )}
        </div>
      </div>

      {/* Center Judge Result */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
        <AnimatePresence>
          {lastJudge && (
            <motion.div
              ref={judgeDisplayRef}
              key={lastJudge + Date.now()}
              initial={{ scale: 2, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`text-4xl font-bold font-mono tracking-widest uppercase ${getJudgeColor(lastJudge)}`}
              style={{
                textShadow: lastJudge === "perfect" 
                  ? "0 0 20px rgba(16, 185, 129, 0.8)"
                  : lastJudge === "miss"
                  ? "0 0 20px rgba(239, 68, 68, 0.8)"
                  : "0 0 10px currentColor",
              }}
            >
              {lastJudge}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Current Gesture Indicator */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{
            scale: detectedGesture !== "IDLE" ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
          className={`px-6 py-3 bg-black/60 backdrop-blur-md border-2 rounded-full font-mono tracking-widest ${getGestureColor(detectedGesture)}`}
        >
          <div className="flex items-center gap-3">
            <Zap size={16} className={detectedGesture !== "IDLE" ? "animate-pulse" : "opacity-30"} />
            <span className="text-sm">{detectedGesture}</span>
          </div>
        </motion.div>
      </div>

      {/* Pause Button */}
      <button
        onClick={pauseGame}
        className="absolute top-20 right-8 p-3 bg-black/60 backdrop-blur-md border border-gray-500/30 rounded-full text-gray-400 hover:text-white hover:border-cyan-500/50 transition-all pointer-events-auto"
      >
        <Pause size={20} />
      </button>

      {/* Combo Milestone Effect */}
      <AnimatePresence>
        {combo > 0 && combo % 10 === 0 && (
          <motion.div
            key={`milestone-${combo}`}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-purple-500 rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

