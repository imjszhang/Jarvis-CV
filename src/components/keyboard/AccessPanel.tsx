"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardStore } from "@/store/useKeyboardStore";
import { useEffect } from "react";
import { playEngageSound, playErrorSound } from "@/utils/audio";

export default function AccessPanel() {
  const inputCode = useKeyboardStore((state) => state.inputCode);
  const accessStatus = useKeyboardStore((state) => state.accessStatus);
  const isUnlocked = useKeyboardStore((state) => state.isUnlocked);
  const handDetected = useKeyboardStore((state) => state.handDetected);
  const clearInput = useKeyboardStore((state) => state.clearInput);

  // Play sound effects on status change
  useEffect(() => {
    if (accessStatus === "success") {
      playEngageSound();
    } else if (accessStatus === "error") {
      playErrorSound();
    }
  }, [accessStatus]);

  // Generate display code with placeholders
  const displayCode = inputCode.padEnd(4, "_").split("");

  return (
    <div className="relative">
      {/* Main panel container */}
      <div className="bg-black/70 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-6 sm:p-8 min-w-[320px]">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h2
            className="text-emerald-400 font-mono text-sm tracking-[0.3em] mb-1"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            SECURITY ACCESS
          </motion.h2>
          <div className="text-emerald-600/60 text-xs font-mono">
            AUTHENTICATION REQUIRED
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <motion.div
            className={`w-2 h-2 rounded-full ${
              handDetected ? "bg-emerald-400" : "bg-red-500"
            }`}
            animate={{
              opacity: handDetected ? [1, 0.5, 1] : 1,
              scale: handDetected ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-emerald-500/70">
            {handDetected ? "HAND DETECTED" : "AWAITING INPUT"}
          </span>
        </div>

        {/* Code display */}
        <div className="flex justify-center gap-3 sm:gap-4 mb-6">
          {displayCode.map((digit, index) => (
            <motion.div
              key={index}
              className={`
                w-12 h-14 sm:w-14 sm:h-16
                flex items-center justify-center
                border-2 rounded-lg
                font-mono text-2xl sm:text-3xl font-bold
                ${
                  digit !== "_"
                    ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                    : "border-emerald-700/50 text-emerald-700/50 bg-black/30"
                }
              `}
              initial={{ scale: 1 }}
              animate={{
                scale: digit !== "_" ? [1, 1.1, 1] : 1,
                boxShadow:
                  digit !== "_"
                    ? "0 0 20px rgba(16, 185, 129, 0.4)"
                    : "none",
              }}
              transition={{ duration: 0.2 }}
            >
              {digit === "_" ? (
                <motion.span
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  _
                </motion.span>
              ) : (
                digit
              )}
            </motion.div>
          ))}
        </div>

        {/* Status message */}
        <AnimatePresence mode="wait">
          {accessStatus === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-emerald-500/60 text-xs font-mono tracking-wider"
            >
              PINCH TO SELECT • DEFAULT CODE: 1234
            </motion.div>
          )}

          {accessStatus === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                className="text-emerald-400 text-xl font-mono font-bold tracking-[0.2em]"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(16, 185, 129, 0.5)",
                    "0 0 30px rgba(16, 185, 129, 0.8)",
                    "0 0 10px rgba(16, 185, 129, 0.5)",
                  ],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ACCESS GRANTED
              </motion.div>
              <div className="text-emerald-500/70 text-xs mt-2 font-mono">
                WELCOME, OPERATOR
              </div>
            </motion.div>
          )}

          {accessStatus === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -5, 5, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="text-red-500 text-xl font-mono font-bold tracking-[0.2em]">
                ACCESS DENIED
              </div>
              <div className="text-red-500/70 text-xs mt-2 font-mono">
                INVALID CREDENTIALS
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset button (only shown when unlocked) */}
        {isUnlocked && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={clearInput}
            className="mt-4 w-full py-2 border border-emerald-500/50 rounded-lg text-emerald-400 font-mono text-sm hover:bg-emerald-500/20 transition-colors"
          >
            RESET SYSTEM
          </motion.button>
        )}

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>

      {/* Success particle effect */}
      <AnimatePresence>
        {accessStatus === "success" && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-emerald-400"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 12) * 100,
                  y: Math.sin((i * Math.PI * 2) / 12) * 100,
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

