import { GestureType } from "@/store/useStore";
import { Lane, Difficulty } from "@/store/useGameStore";

export interface Beat {
  time: number; // Target hit time in ms from song start
  gesture: GestureType;
  lane: Lane;
}

export interface BeatMap {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  difficulty: Difficulty;
  duration: number; // Total duration in ms
  beats: Beat[];
}

// Generate a procedural beat map based on difficulty and BPM
export function generateBeatMap(
  difficulty: Difficulty,
  duration: number = 60000 // 60 seconds default
): BeatMap {
  const config = {
    easy: {
      bpm: 80,
      gestures: ["PALM_OPEN", "GRAB", "VICTORY"] as GestureType[],
      density: 0.5, // Beats per beat
    },
    normal: {
      bpm: 120,
      gestures: ["PALM_OPEN", "GRAB", "VICTORY", "POINT"] as GestureType[],
      density: 0.7,
    },
    hard: {
      bpm: 160,
      gestures: ["PALM_OPEN", "GRAB", "VICTORY", "POINT", "PINCH"] as GestureType[],
      density: 0.9,
    },
  };

  const { bpm, gestures, density } = config[difficulty];
  const beatInterval = (60 / bpm) * 1000; // ms per beat
  const totalBeats = Math.floor(duration / beatInterval);
  
  const beats: Beat[] = [];
  const lanes: Lane[] = ["left", "center", "right"];
  
  // Start after 2 seconds to give player time to prepare
  const startDelay = 2000;
  
  for (let i = 0; i < totalBeats; i++) {
    // Skip some beats based on density
    if (Math.random() > density) continue;
    
    const time = startDelay + i * beatInterval;
    const gesture = gestures[Math.floor(Math.random() * gestures.length)];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    
    beats.push({ time, gesture, lane });
  }
  
  return {
    id: `procedural-${difficulty}`,
    name: "Cyber Beats",
    artist: "J.A.R.V.I.S.",
    bpm,
    difficulty,
    duration,
    beats,
  };
}

// Pre-designed easy tutorial beat map
export const TUTORIAL_BEATMAP: BeatMap = {
  id: "tutorial",
  name: "Tutorial",
  artist: "System",
  bpm: 60,
  difficulty: "easy",
  duration: 30000,
  beats: [
    { time: 2000, gesture: "PALM_OPEN", lane: "center" },
    { time: 4000, gesture: "GRAB", lane: "center" },
    { time: 6000, gesture: "PALM_OPEN", lane: "left" },
    { time: 8000, gesture: "GRAB", lane: "right" },
    { time: 10000, gesture: "VICTORY", lane: "center" },
    { time: 12000, gesture: "PALM_OPEN", lane: "center" },
    { time: 14000, gesture: "GRAB", lane: "left" },
    { time: 16000, gesture: "VICTORY", lane: "right" },
    { time: 18000, gesture: "PALM_OPEN", lane: "center" },
    { time: 20000, gesture: "GRAB", lane: "center" },
    { time: 22000, gesture: "VICTORY", lane: "left" },
    { time: 24000, gesture: "PALM_OPEN", lane: "right" },
    { time: 26000, gesture: "GRAB", lane: "center" },
    { time: 28000, gesture: "VICTORY", lane: "center" },
  ],
};

// Pre-designed beat patterns for variety
export const BEAT_PATTERNS = {
  // Simple alternating pattern
  alternating: (startTime: number, bpm: number): Beat[] => {
    const interval = (60 / bpm) * 1000;
    return [
      { time: startTime, gesture: "PALM_OPEN", lane: "left" },
      { time: startTime + interval, gesture: "GRAB", lane: "right" },
      { time: startTime + interval * 2, gesture: "PALM_OPEN", lane: "left" },
      { time: startTime + interval * 3, gesture: "GRAB", lane: "right" },
    ];
  },
  
  // Center focus pattern
  centerFocus: (startTime: number, bpm: number): Beat[] => {
    const interval = (60 / bpm) * 1000;
    return [
      { time: startTime, gesture: "VICTORY", lane: "center" },
      { time: startTime + interval, gesture: "PALM_OPEN", lane: "center" },
      { time: startTime + interval * 2, gesture: "GRAB", lane: "center" },
      { time: startTime + interval * 3, gesture: "VICTORY", lane: "center" },
    ];
  },
  
  // Sweep pattern (left to right)
  sweep: (startTime: number, bpm: number): Beat[] => {
    const interval = (60 / bpm) * 1000 / 2; // Half-beat timing
    return [
      { time: startTime, gesture: "PALM_OPEN", lane: "left" },
      { time: startTime + interval, gesture: "PALM_OPEN", lane: "center" },
      { time: startTime + interval * 2, gesture: "PALM_OPEN", lane: "right" },
    ];
  },
};

// Timing windows for hit judgment (in ms)
export const TIMING_WINDOWS = {
  perfect: 100,
  great: 200,
  good: 350,
};

