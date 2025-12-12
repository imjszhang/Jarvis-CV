"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useKeyboardStore } from "@/store/useKeyboardStore";
import { playSelectSound, playHoverSound } from "@/utils/audio";

interface KeyButtonProps {
  value: string;
  onPress: (value: string) => void;
}

function KeyButton({ value, onPress }: KeyButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cursor = useKeyboardStore((state) => state.cursor);
  const accessStatus = useKeyboardStore((state) => state.accessStatus);

  // Track previous hover state for sound
  const wasHovered = useRef(false);

  useEffect(() => {
    if (!btnRef.current || !cursor.active) {
      setIsHovered(false);
      return;
    }

    const rect = btnRef.current.getBoundingClientRect();
    const screenX = cursor.x * window.innerWidth;
    const screenY = cursor.y * window.innerHeight;

    const hovering =
      screenX >= rect.left &&
      screenX <= rect.right &&
      screenY >= rect.top &&
      screenY <= rect.bottom;

    setIsHovered(hovering);

    // Play hover sound on enter
    if (hovering && !wasHovered.current) {
      playHoverSound();
    }
    wasHovered.current = hovering;

    // Trigger click on pinch while hovering
    if (hovering && cursor.isClicking && accessStatus === "idle") {
      onPress(value);
      playSelectSound();
    }
  }, [cursor, value, onPress, accessStatus]);

  return (
    <motion.button
      ref={btnRef}
      className={`
        relative w-20 h-20 sm:w-24 sm:h-24
        flex items-center justify-center
        border-2 rounded-xl
        text-3xl sm:text-4xl font-bold font-mono
        transition-colors duration-100
        pointer-events-none select-none
        ${
          isHovered
            ? "bg-emerald-500/40 border-emerald-400 text-white"
            : "bg-black/30 border-emerald-700/50 text-emerald-500/80"
        }
      `}
      animate={{
        scale: isHovered ? 1.1 : 1,
        boxShadow: isHovered
          ? "0 0 30px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)"
          : "0 0 10px rgba(16, 185, 129, 0.1)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {value}
      {/* Corner decorations */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-emerald-500/50" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-emerald-500/50" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-emerald-500/50" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-emerald-500/50" />
    </motion.button>
  );
}

export default function VirtualKeypad() {
  const appendInput = useKeyboardStore((state) => state.appendInput);
  const accessStatus = useKeyboardStore((state) => state.accessStatus);

  const handlePress = useCallback(
    (value: string) => {
      if (accessStatus === "idle") {
        appendInput(value);
      }
    },
    [appendInput, accessStatus]
  );

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="relative">
      {/* Keypad frame */}
      <div className="relative bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 sm:p-8">
        {/* Top bar decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {keys.map((key) => (
            <KeyButton key={key} value={key} onPress={handlePress} />
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="mt-4 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-500/30"
            />
          ))}
        </div>
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none"
        animate={{ top: ["0%", "100%"] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

