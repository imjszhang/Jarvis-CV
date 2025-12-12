import WebcamProcessorNeural from "@/components/WebcamProcessorNeural";
import HandUI from "@/components/HandUI";
import Link from "next/link";
import NeuralScene from "@/components/NeuralScene";
import { SocialLinks } from "@/components/SocialLinks";

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden ">
      {/* Background: Webcam Feed */}
      <WebcamProcessorNeural />

      {/* Middle Layer:  NeuralScene  */}
      <NeuralScene />

      {/* 3. Hand Interactions Layer */}
       <HandUI />

      <SocialLinks className="top-6 left-10" />

      {/* Navigation Buttons */}
      <div className="absolute bottom-10 right-10 z-50 flex flex-col gap-4 items-end pointer-events-auto">
        <Link href="/keyboard">
          <button className="px-6 py-3 bg-emerald-900/60 border-2 border-emerald-400 text-emerald-200 rounded-lg font-mono text-sm tracking-[0.2em] hover:bg-emerald-700/80 hover:text-white hover:border-emerald-300 transition-all duration-300 backdrop-blur-md group w-64 text-right flex shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)]">
            <span className="mr-2 group-hover:animate-pulse text-xl">⌨️</span>
            <span className="font-bold">GESTURE_INPUT</span>
          </button>
        </Link>
        <Link href="/game">
          <button className="px-6 py-3 bg-purple-900/60 border-2 border-purple-400 text-purple-200 rounded-lg font-mono text-sm tracking-[0.2em] hover:bg-purple-700/80 hover:text-white hover:border-purple-300 transition-all duration-300 backdrop-blur-md group w-64 text-right flex shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)]">
            <span className="mr-2 group-hover:animate-pulse text-xl">🎮</span>
            <span className="font-bold">GESTURE_RHYTHM</span>
          </button>
        </Link>
        <Link href="/overwatch">
          <button className="px-6 py-3 bg-blue-900/60 border-2 border-blue-400 text-blue-200 rounded-lg font-mono text-sm tracking-[0.2em] hover:bg-blue-700/80 hover:text-white hover:border-blue-300 transition-all duration-300 backdrop-blur-md group w-64 text-right flex shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)]">
            <span className="mr-2 group-hover:animate-pulse text-xl">🌍</span>
            <span className="font-bold">GLOBAL_OVERWATCH</span>
          </button>
        </Link>
        <Link href="/combat">
          <button className="px-6 py-3 bg-red-900/60 border-2 border-red-400 text-red-200 rounded-lg font-mono text-sm tracking-[0.2em] hover:bg-red-700/80 hover:text-white hover:border-red-300 transition-all duration-300 backdrop-blur-md group w-64 text-right flex shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]">
            <span className="mr-2 group-hover:animate-pulse text-xl">🥊</span>
            <span className="font-bold">HAND_COMBAT</span>
          </button>
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-50 text-right pointer-events-none">
        <h1 className="text-2xl font-bold text-white tracking-widest opacity-80 font-mono text-glow">
          NEURAL_INTERFACE
        </h1>
        <p className="text-cyan-400 text-xs mt-1 tracking-[0.3em] opacity-70">
          SYNAPTIC LINK ESTABLISHED
        </p>
      </div>
    </main>
  );
}
