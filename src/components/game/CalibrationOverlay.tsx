import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { GestureType } from "@/store/useStore";
import { ChevronRight } from "lucide-react";

const TUTORIAL_STEPS: GestureType[] = ["PALM_OPEN", "GRAB", "VICTORY", "POINT", "PINCH"];

const GESTURE_INSTRUCTIONS: Record<GestureType, { title: string; desc: string; icon: string }> = {
  PALM_OPEN: { title: "OPEN HAND", desc: "Show your open palm to the camera", icon: "🖐️" },
  GRAB: { title: "FIST", desc: "Clench your hand into a fist", icon: "✊" },
  VICTORY: { title: "VICTORY", desc: "Show a peace sign", icon: "✌️" },
  POINT: { title: "POINT", desc: "Point your index finger", icon: "☝️" },
  PINCH: { title: "PINCH", desc: "Pinch your thumb and index finger", icon: "🤏" },
  IDLE: { title: "RELAX", desc: "Relax your hand", icon: "👋" },
};

export default function CalibrationOverlay() {
  const detectedGesture = useGameStore((state) => state.detectedGesture);
  const tutorialStep = useGameStore((state) => state.tutorialStep);
  const setTutorialStep = useGameStore((state) => state.setTutorialStep);
  const startGame = useGameStore((state) => state.startGame);
  
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (tutorialStep !== "COMPLETE" && detectedGesture === tutorialStep) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5; // Fill up in ~1 second (5 * 20ms = 100)
        });
      }, 50);
    } else {
      setProgress(0);
    }
    
    return () => clearInterval(interval);
  }, [detectedGesture, tutorialStep]);

  useEffect(() => {
    if (progress >= 100) {
      const currentIndex = TUTORIAL_STEPS.indexOf(tutorialStep as GestureType);
      if (currentIndex !== -1 && currentIndex < TUTORIAL_STEPS.length - 1) {
        // Next step after a brief pause
        setTimeout(() => {
          setTutorialStep(TUTORIAL_STEPS[currentIndex + 1]);
          setProgress(0);
        }, 500);
      } else if (currentIndex === TUTORIAL_STEPS.length - 1) {
        // Complete
        setTimeout(() => {
          setTutorialStep("COMPLETE");
        }, 500);
      }
    }
  }, [progress, tutorialStep, setTutorialStep]);

  if (tutorialStep === "COMPLETE") {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-2 font-mono">CALIBRATION COMPLETE</h2>
          <p className="text-gray-400 mb-8">System is synced with your neural patterns.</p>
          
          <button
            onClick={() => startGame()}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xl rounded-full transition-all flex items-center gap-2 mx-auto pointer-events-auto"
          >
            START MISSION <ChevronRight />
          </button>
        </motion.div>
      </div>
    );
  }

  const currentInfo = GESTURE_INSTRUCTIONS[tutorialStep as GestureType];

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-cyan-400 font-mono mb-4 animate-pulse tracking-widest">SYSTEM CALIBRATION IN PROGRESS...</div>
        
        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            {/* Progress Circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                    cx="96" cy="96" r="90"
                    fill="none" stroke="#334155" strokeWidth="12"
                />
                <circle
                    cx="96" cy="96" r="90"
                    fill="none" stroke="#22d3ee" strokeWidth="12"
                    strokeDasharray={565.48}
                    strokeDashoffset={565.48 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-100 ease-linear"
                />
            </svg>
            
            <div className="text-8xl animate-bounce">{currentInfo.icon}</div>
        </div>

        <h2 className="text-5xl font-bold text-white mb-2 font-mono tracking-widest">{currentInfo.title}</h2>
        <p className="text-xl text-gray-300 bg-black/60 px-6 py-2 rounded-full border border-gray-700">{currentInfo.desc}</p>
        
        <div className="mt-8 flex gap-2">
            {TUTORIAL_STEPS.map((step) => {
                const stepIndex = TUTORIAL_STEPS.indexOf(tutorialStep as GestureType);
                const myIndex = TUTORIAL_STEPS.indexOf(step);
                const isCompleted = myIndex < stepIndex;
                const isCurrent = step === tutorialStep;
                
                return (
                    <div 
                        key={step} 
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            isCompleted ? "bg-green-500 scale-100" : isCurrent ? "bg-cyan-500 scale-125 animate-pulse" : "bg-gray-700"
                        }`}
                    />
                );
            })}
        </div>
      </div>
    </div>
  );
}

