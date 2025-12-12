import { create } from "zustand";
import { GestureType } from "./useStore";

export type Difficulty = "easy" | "normal" | "hard";
export type GameStatus = "menu" | "calibration" | "playing" | "paused" | "gameover";
export type JudgeResult = "perfect" | "great" | "good" | "miss";
export type Lane = "left" | "center" | "right";

export interface GestureTarget {
  id: string;
  gesture: GestureType;
  lane: Lane;
  spawnTime: number; // When it was spawned (ms)
  targetTime: number; // When it should be hit (ms)
  hit: boolean;
  result?: JudgeResult;
}

export interface GameState {
  // Game Status
  status: GameStatus;
  difficulty: Difficulty;
  tutorialStep: GestureType | "COMPLETE";
  
  // Score System
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  
  // Life System
  lives: number;
  maxLives: number;
  
  // Beat System
  gameStartTime: number;
  currentTime: number;
  bpm: number;
  activeTargets: GestureTarget[];
  
  // Gesture Detection
  detectedGesture: GestureType;
  lastHitTime: number;
  lastJudge: JudgeResult | null;
  
  // Actions
  startCalibration: (difficulty?: Difficulty) => void;
  setTutorialStep: (step: GestureType | "COMPLETE") => void;
  startGame: (difficulty?: Difficulty) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Game Loop Actions
  updateTime: (time: number) => void;
  spawnTarget: (target: GestureTarget) => void;
  removeTarget: (id: string) => void;
  setDetectedGesture: (gesture: GestureType) => void;
  
  // Scoring Actions
  judgeHit: (targetId: string, result: JudgeResult) => void;
  registerMiss: (targetId: string) => void;
}

const DIFFICULTY_CONFIG = {
  easy: { bpm: 40, maxLives: 100 },
  normal: { bpm: 60, maxLives: 100 },
  hard: { bpm: 80, maxLives: 100 },
};

const SCORE_VALUES = {
  perfect: 100,
  great: 75,
  good: 50,
  miss: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial State
  status: "menu",
  difficulty: "normal",
  tutorialStep: "PALM_OPEN",
  
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  greatCount: 0,
  goodCount: 0,
  missCount: 0,
  
  lives: 10,
  maxLives: 10,
  
  gameStartTime: 0,
  currentTime: 0,
  bpm: 120,
  activeTargets: [],
  
  detectedGesture: "IDLE",
  lastHitTime: 0,
  lastJudge: null,
  
  // Actions
  startCalibration: (difficulty?: Difficulty) => {
    // Skip calibration directly to playing for faster restart
    const state = get();
    const finalDifficulty = difficulty || state.difficulty;
    const config = DIFFICULTY_CONFIG[finalDifficulty];
    set({
      status: "playing",
      difficulty: finalDifficulty,
      bpm: config.bpm,
      lives: config.maxLives,
      maxLives: config.maxLives,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      gameStartTime: Date.now(),
      currentTime: 0,
      activeTargets: [],
      lastJudge: null,
    });
  },
  
  setTutorialStep: (step) => set({ tutorialStep: step }),

  startGame: (difficulty) => {
    const state = get();
    const finalDifficulty = difficulty || state.difficulty;
    const config = DIFFICULTY_CONFIG[finalDifficulty];
    set({
      status: "playing",
      difficulty: finalDifficulty,
      bpm: config.bpm,
      lives: config.maxLives,
      maxLives: config.maxLives,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      gameStartTime: Date.now(),
      currentTime: 0,
      activeTargets: [],
      lastJudge: null,
    });
  },
  
  pauseGame: () => set({ status: "paused" }),
  
  resumeGame: () => set({ status: "playing" }),
  
  endGame: () => set({ status: "gameover" }),
  
  resetGame: () =>     set({
    status: "menu",
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    lives: 10,
    activeTargets: [],
    lastJudge: null,
  }),
  
  updateTime: (time) => set({ currentTime: time }),
  
  spawnTarget: (target) => set((state) => ({
    activeTargets: [...state.activeTargets, target],
  })),
  
  removeTarget: (id) => set((state) => ({
    activeTargets: state.activeTargets.filter((t) => t.id !== id),
  })),
  
  setDetectedGesture: (gesture) => set({ detectedGesture: gesture }),
  
  judgeHit: (targetId, result) => {
    const state = get();
    const target = state.activeTargets.find((t) => t.id === targetId);
    if (!target || target.hit) return;
    
    const baseScore = SCORE_VALUES[result];
    const comboBonus = result !== "miss" ? Math.floor(state.combo * 0.1) : 0;
    const newScore = state.score + baseScore + comboBonus;
    
    const newCombo = result === "miss" ? 0 : state.combo + 1;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);
    
    set((state) => ({
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      perfectCount: state.perfectCount + (result === "perfect" ? 1 : 0),
      greatCount: state.greatCount + (result === "great" ? 1 : 0),
      goodCount: state.goodCount + (result === "good" ? 1 : 0),
      missCount: state.missCount + (result === "miss" ? 1 : 0),
      lastHitTime: Date.now(),
      lastJudge: result,
      activeTargets: state.activeTargets.map((t) =>
        t.id === targetId ? { ...t, hit: true, result } : t
      ),
    }));
  },
  
  registerMiss: (targetId) => {
    const state = get();
    const target = state.activeTargets.find((t) => t.id === targetId);
    if (!target || target.hit) return;
    
    const newLives = state.lives - 1;
    
    set((state) => ({
      combo: 0,
      missCount: state.missCount + 1,
      lives: newLives,
      lastJudge: "miss",
      activeTargets: state.activeTargets.map((t) =>
        t.id === targetId ? { ...t, hit: true, result: "miss" } : t
      ),
    }));
    
    // Check game over
    if (newLives <= 0) {
      get().endGame();
    }
  },
}));

