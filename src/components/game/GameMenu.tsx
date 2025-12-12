"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, Difficulty } from "@/store/useGameStore";
import { Play, RotateCcw, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { playStartSound, playCountdownSound, playGameOverSound } from "@/utils/gameAudio";

export default function GameMenu() {
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);
  const maxCombo = useGameStore((state) => state.maxCombo);
  const perfectCount = useGameStore((state) => state.perfectCount);
  const greatCount = useGameStore((state) => state.greatCount);
  const goodCount = useGameStore((state) => state.goodCount);
  const missCount = useGameStore((state) => state.missCount);
  
  const startGame = useGameStore((state) => state.startGame);
  const startCalibration = useGameStore((state) => state.startCalibration);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const resetGame = useGameStore((state) => state.resetGame);
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Play game over sound when game ends
  useEffect(() => {
    if (status === "gameover") {
      playGameOverSound();
    }
  }, [status]);

  const handleStart = async () => {
    setIsCountingDown(true);
    setCountdown(3);
    
    // Countdown
    for (let i = 3; i >= 0; i--) {
      setCountdown(i);
      playCountdownSound(i);
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    
    setIsCountingDown(false);
    playStartSound();
    startCalibration(selectedDifficulty);
  };

  const handleResume = () => {
    resumeGame();
  };

  const handleRestart = () => {
    resetGame();
    handleStart();
  };

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: "easy", label: "EASY", desc: "80 BPM | 3 Gestures" },
    { value: "normal", label: "NORMAL", desc: "120 BPM | 4 Gestures" },
    { value: "hard", label: "HARD", desc: "160 BPM | 5 Gestures" },
  ];

  // Calculate grade
  const getGrade = () => {
    const total = perfectCount + greatCount + goodCount + missCount;
    if (total === 0) return "-";
    const accuracy = ((perfectCount * 100 + greatCount * 75 + goodCount * 50) / (total * 100)) * 100;
    if (accuracy >= 95) return "S";
    if (accuracy >= 90) return "A";
    if (accuracy >= 80) return "B";
    if (accuracy >= 70) return "C";
    if (accuracy >= 60) return "D";
    return "F";
  };

  return (
    <AnimatePresence mode="wait">
      {/* Countdown Overlay */}
      {isCountingDown && (
        <motion.div
          key="countdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-9xl font-bold text-cyan-400 font-mono"
            style={{ textShadow: "0 0 40px rgba(0, 255, 255, 0.8)" }}
          >
            {countdown === 0 ? "GO!" : countdown}
          </motion.div>
        </motion.div>
      )}

      {/* Main Menu */}
      {status === "menu" && !isCountingDown && (
        <motion.div
          key="menu"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute inset-0 z-40 flex items-center justify-center"
        >
          <div className="bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,255,255,0.1)]">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-mono tracking-widest mb-2">
              GESTURE RHYTHM
            </h2>
            <p className="text-center text-cyan-500/60 text-sm font-mono tracking-wider mb-8">
              MASTER YOUR MOVES
            </p>

            {/* Difficulty Selection */}
            <div className="space-y-3 mb-8">
              <div className="text-xs text-cyan-500/80 font-mono tracking-widest mb-2">
                SELECT DIFFICULTY
              </div>
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setSelectedDifficulty(diff.value)}
                  className={`w-full p-4 rounded-lg border transition-all flex items-center justify-between group ${
                    selectedDifficulty === diff.value
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-black/40 border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold font-mono tracking-wider">{diff.label}</div>
                    <div className="text-xs opacity-60">{diff.desc}</div>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`transition-transform ${
                      selectedDifficulty === diff.value ? "translate-x-1" : "group-hover:translate-x-1"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]"
            >
              <Play size={24} />
              START GAME
            </button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-black/40 rounded-lg border border-gray-800">
              <div className="text-xs text-cyan-500/80 font-mono tracking-widest mb-2">
                HOW TO PLAY
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>Match gestures when targets hit the line</li>
                <li>Build combos for bonus points</li>
                <li>Perfect timing = Maximum score</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pause Menu */}
      {status === "paused" && (
        <motion.div
          key="paused"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 max-w-sm w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-center text-cyan-400 font-mono tracking-widest mb-8">
              PAUSED
            </h2>

            <div className="space-y-4">
              <button
                onClick={handleResume}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Play size={20} />
                RESUME
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                RESTART
              </button>

              <Link href="/" className="block">
                <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2">
                  <Home size={20} />
                  EXIT TO MENU
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Game Over Screen */}
      {status === "gameover" && (
        <motion.div
          key="gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-3xl font-bold text-center text-red-500 font-mono tracking-widest mb-2">
              GAME OVER
            </h2>

            {/* Grade */}
            <div className="flex justify-center my-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold font-mono ${
                  getGrade() === "S"
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    : getGrade() === "A"
                    ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                    : getGrade() === "B"
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                    : "bg-gradient-to-br from-gray-400 to-gray-600 text-white"
                }`}
                style={{ boxShadow: "0 0 30px currentColor" }}
              >
                {getGrade()}
              </motion.div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 rounded-lg p-4 text-center">
                <div className="text-xs text-cyan-500/60 font-mono mb-1">SCORE</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {score.toLocaleString()}
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 text-center">
                <div className="text-xs text-purple-500/60 font-mono mb-1">MAX COMBO</div>
                <div className="text-2xl font-bold text-white font-mono">{maxCombo}x</div>
              </div>
            </div>

            {/* Hit Breakdown */}
            <div className="bg-black/40 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div>
                  <div className="text-emerald-400">PERFECT</div>
                  <div className="text-white text-lg">{perfectCount}</div>
                </div>
                <div>
                  <div className="text-cyan-400">GREAT</div>
                  <div className="text-white text-lg">{greatCount}</div>
                </div>
                <div>
                  <div className="text-yellow-400">GOOD</div>
                  <div className="text-white text-lg">{goodCount}</div>
                </div>
                <div>
                  <div className="text-red-400">MISS</div>
                  <div className="text-white text-lg">{missCount}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                PLAY AGAIN
              </button>

              <Link href="/" className="block">
                <button
                  onClick={resetGame}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold font-mono tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Home size={20} />
                  EXIT
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

