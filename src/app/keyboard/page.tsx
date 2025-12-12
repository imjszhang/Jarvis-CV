"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import KeyboardWebcamProcessor from "@/components/keyboard/KeyboardWebcamProcessor";
import VirtualKeypad from "@/components/keyboard/VirtualKeypad";
import AccessPanel from "@/components/keyboard/AccessPanel";
import FingerCursor from "@/components/keyboard/FingerCursor";
import { useKeyboardStore } from "@/store/useKeyboardStore";
import { useEffect } from "react";

export default function KeyboardPage() {
  const resetAll = useKeyboardStore((state) => state.resetAll);

  // Reset state when component mounts
  useEffect(() => {
    resetAll();
  }, [resetAll]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Background: Webcam Feed with hand tracking */}
      <KeyboardWebcamProcessor />

      {/* Overlay gradient for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none z-10" />

      {/* Scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.1) 2px, rgba(0, 255, 136, 0.1) 4px)",
        }}
      />

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-[0.3em] mb-2">
            GESTURE INPUT
          </h1>
          <p className="text-emerald-600/70 text-xs sm:text-sm font-mono tracking-wider">
            AIR HOLOGRAPHIC KEYBOARD INTERFACE
          </p>
        </motion.div>

        {/* Main panel layout */}
        <motion.div
          className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Access Panel */}
          <AccessPanel />

          {/* Divider */}
          <div className="hidden lg:block w-px h-64 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
          <div className="lg:hidden h-px w-64 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

          {/* Virtual Keypad */}
          <VirtualKeypad />
        </motion.div>
      </div>

      {/* Finger cursor overlay */}
      <FingerCursor />

      {/* Instructions */}
      <motion.div
        className="absolute bottom-6 left-6 z-30 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="bg-black/70 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4 max-w-xs">
          <h3 className="text-emerald-400 font-mono text-xs font-bold mb-3 tracking-wider border-b border-emerald-500/30 pb-2">
            CONTROL GUIDE
          </h3>
          <ul className="space-y-2 text-xs font-mono">
            <li className="flex items-start gap-3 text-emerald-300/80">
              <span className="text-lg">👆</span>
              <div>
                <span className="text-emerald-400 font-bold">INDEX FINGER</span>
                <p className="text-[10px] text-emerald-500/60">Move to aim cursor</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-emerald-300/80">
              <span className="text-lg">🤏</span>
              <div>
                <span className="text-emerald-400 font-bold">PINCH</span>
                <p className="text-[10px] text-emerald-500/60">Touch thumb to index to select</p>
              </div>
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Back navigation */}
      <motion.div
        className="absolute top-6 left-6 z-30"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Link href="/">
          <button className="px-4 py-2 bg-black/60 border border-emerald-500/50 text-emerald-400 rounded-lg font-mono text-sm tracking-wider hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-300 backdrop-blur-md flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>EXIT</span>
          </button>
        </Link>
      </motion.div>

      {/* Title badge */}
      <motion.div
        className="absolute top-6 right-6 z-30 text-right pointer-events-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-lg font-bold text-emerald-400 tracking-widest font-mono">
          JARVIS_INPUT
        </h2>
        <p className="text-emerald-600/70 text-[10px] mt-1 tracking-[0.2em]">
          GESTURE RECOGNITION ACTIVE
        </p>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-emerald-500/30 pointer-events-none z-20" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-emerald-500/30 pointer-events-none z-20" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-emerald-500/30 pointer-events-none z-20" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-emerald-500/30 pointer-events-none z-20" />
    </main>
  );
}

