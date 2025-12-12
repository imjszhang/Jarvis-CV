import { create } from "zustand";

export interface CursorState {
  x: number;
  y: number;
  active: boolean;
  isClicking: boolean;
}

export type AccessStatus = "idle" | "success" | "error";

interface KeyboardStoreState {
  // Cursor tracking (finger tip position)
  cursor: CursorState;
  
  // Input state
  inputCode: string;
  targetCode: string;
  isUnlocked: boolean;
  accessStatus: AccessStatus;
  
  // Hand visibility
  handDetected: boolean;
  
  // Actions
  setCursor: (data: Partial<CursorState>) => void;
  appendInput: (digit: string) => void;
  clearInput: () => void;
  resetAll: () => void;
  setHandDetected: (detected: boolean) => void;
}

export const useKeyboardStore = create<KeyboardStoreState>((set, get) => ({
  // Initial state
  cursor: { x: 0.5, y: 0.5, active: false, isClicking: false },
  inputCode: "",
  targetCode: "1234",
  isUnlocked: false,
  accessStatus: "idle",
  handDetected: false,

  // Actions
  setCursor: (data) =>
    set((state) => ({
      cursor: { ...state.cursor, ...data, active: true },
    })),

  appendInput: (digit) => {
    const { inputCode, targetCode } = get();
    
    // Max 4 digits
    if (inputCode.length >= 4) return;
    
    const newCode = inputCode + digit;
    
    set({ inputCode: newCode });
    
    // Auto-verify when 4 digits entered
    if (newCode.length === 4) {
      const isCorrect = newCode === targetCode;
      set({
        isUnlocked: isCorrect,
        accessStatus: isCorrect ? "success" : "error",
      });
      
      // Reset after error
      if (!isCorrect) {
        setTimeout(() => {
          set({ inputCode: "", accessStatus: "idle" });
        }, 1500);
      }
    }
  },

  clearInput: () =>
    set({ inputCode: "", accessStatus: "idle", isUnlocked: false }),

  resetAll: () =>
    set({
      inputCode: "",
      isUnlocked: false,
      accessStatus: "idle",
      cursor: { x: 0.5, y: 0.5, active: false, isClicking: false },
    }),

  setHandDetected: (detected) => set({ handDetected: detected }),
}));

