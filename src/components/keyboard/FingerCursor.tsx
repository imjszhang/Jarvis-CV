"use client";

import { motion } from "framer-motion";
import { useKeyboardStore } from "@/store/useKeyboardStore";

export default function FingerCursor() {
  const cursor = useKeyboardStore((state) => state.cursor);

  if (!cursor.active) return null;

  const x = cursor.x * 100;
  const y = cursor.y * 100;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Main cursor */}
      <motion.div
        className="absolute"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 -m-8 w-16 h-16 rounded-full border-2 border-emerald-400/60"
          animate={{
            scale: cursor.isClicking ? 0.8 : 1,
            borderColor: cursor.isClicking
              ? "rgba(52, 211, 153, 1)"
              : "rgba(52, 211, 153, 0.6)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            boxShadow: cursor.isClicking
              ? "0 0 30px rgba(52, 211, 153, 0.8), inset 0 0 20px rgba(52, 211, 153, 0.3)"
              : "0 0 15px rgba(52, 211, 153, 0.4)",
          }}
        />

        {/* Inner rotating ring */}
        <motion.div
          className="absolute inset-0 -m-5 w-10 h-10 rounded-full border border-dashed border-emerald-300/50"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 -m-1.5 w-3 h-3 rounded-full bg-emerald-400"
          animate={{
            scale: cursor.isClicking ? 1.5 : 1,
            backgroundColor: cursor.isClicking ? "#10b981" : "#34d399",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          style={{
            boxShadow: "0 0 10px rgba(52, 211, 153, 0.8)",
          }}
        />

        {/* Click ripple effect */}
        {cursor.isClicking && (
          <motion.div
            className="absolute inset-0 -m-8 w-16 h-16 rounded-full border-2 border-emerald-300"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-400/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-400/50" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-emerald-400/50" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-2 bg-emerald-400/50" />
        </div>
      </motion.div>

      {/* Coordinate display */}
      <motion.div
        className="absolute font-mono text-[10px] text-emerald-400/70 tracking-wider"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(20px, -30px)",
        }}
      >
        <div>X: {(cursor.x * 100).toFixed(1)}%</div>
        <div>Y: {(cursor.y * 100).toFixed(1)}%</div>
      </motion.div>
    </div>
  );
}

