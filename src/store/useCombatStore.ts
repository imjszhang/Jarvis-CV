import { create } from "zustand";
import { GestureType } from "./useStore";

export type CombatAction = "IDLE" | "ATTACK" | "BLOCK" | "DODGE" | "HIT" | "STUNNED" | "WIN" | "LOSE";
export type AttackType = "LIGHT" | "HEAVY" | "SPECIAL" | "NONE";

export interface FighterState {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  action: CombatAction;
  attackType: AttackType;
  gesture: GestureType;
  position: { x: number; y: number }; // -1 to 1 range
  lastActionTime: number;
}

export interface CombatState {
  status: "MENU" | "PLAYING" | "VICTORY" | "DEFEAT";
  
  player: FighterState;
  enemy: FighterState;
  
  difficulty: "EASY" | "NORMAL" | "HARD";
  
  // Input tracking
  detectedGesture: GestureType;
  handPosition: { x: number; y: number };
  
  // Messages
  message: string;
  messageTimer: number;

  // Actions
  startGame: (difficulty?: "EASY" | "NORMAL" | "HARD") => void;
  resetGame: () => void;
  updateInput: (gesture: GestureType, x: number, y: number) => void;
  
  // Combat Logic (called from game loop)
  performPlayerAction: (action: CombatAction, attackType?: AttackType) => void;
  updateEnemyAI: (deltaTime: number) => void;
  resolveCombat: () => void; // Check hits/blocks
  
  setMessage: (msg: string, duration?: number) => void;
}

const INITIAL_FIGHTER: FighterState = {
  hp: 100,
  maxHp: 100,
  energy: 0,
  maxEnergy: 100,
  action: "IDLE",
  attackType: "NONE",
  gesture: "IDLE",
  position: { x: 0, y: 0 },
  lastActionTime: 0,
};

export const useCombatStore = create<CombatState>((set, get) => ({
  status: "MENU",
  player: { ...INITIAL_FIGHTER },
  enemy: { ...INITIAL_FIGHTER },
  difficulty: "NORMAL",
  detectedGesture: "IDLE",
  handPosition: { x: 0, y: 0 },
  message: "",
  messageTimer: 0,

  startGame: (difficulty = "NORMAL") => {
    set({
      status: "PLAYING",
      difficulty,
      player: { ...INITIAL_FIGHTER, hp: 100, energy: 0 },
      enemy: { ...INITIAL_FIGHTER, hp: 100, energy: 0 },
      message: "FIGHT!",
      messageTimer: 2000,
    });
  },

  resetGame: () => {
    set({
      status: "MENU",
      player: { ...INITIAL_FIGHTER },
      enemy: { ...INITIAL_FIGHTER },
    });
  },

  updateInput: (gesture, x, y) => {
    const { status, player } = get();
    if (status !== "PLAYING") {
        set({ detectedGesture: gesture, handPosition: { x, y } });
        return;
    }

    // Map gesture to action
    let newAction: CombatAction = "IDLE";
    let newAttackType: AttackType = "NONE";

    // Dodge threshold (move left/right)
    if (Math.abs(x) > 0.4) {
        newAction = "DODGE";
    } else {
        switch (gesture) {
            case "VICTORY":
                newAction = "BLOCK";
                break;
            case "POINT":
                newAction = "ATTACK";
                newAttackType = "LIGHT";
                break;
            case "GRAB":
                newAction = "ATTACK";
                newAttackType = "HEAVY";
                break;
            case "PALM_OPEN":
                newAction = "ATTACK";
                newAttackType = "SPECIAL";
                break;
            case "PINCH":
                 // Maybe a quick jab or grab?
                 newAction = "ATTACK";
                 newAttackType = "LIGHT";
                 break;
            default:
                newAction = "IDLE";
                break;
        }
    }

    // Only update if changed or significant
    // Rate limit attack spamming handled in performPlayerAction or cooldowns
    
    // Direct update for position and gesture
    set((state) => ({
        detectedGesture: gesture,
        handPosition: { x, y },
        player: {
            ...state.player,
            position: { x, y },
            gesture: gesture,
            // We update action logic via performPlayerAction usually, but here we can update 'intent'
            // However, animations lock states. Let's let the loop handle state transitions based on intent?
            // For now, let's just update the "input" side.
        }
    }));
  },

  performPlayerAction: (action, attackType = "NONE") => {
    const { player, status } = get();
    if (status !== "PLAYING") return;
    
    // Simple state machine: Can't act if HIT, STUNNED, or already ATTACKING (animation lock)
    if (player.action === "HIT" || player.action === "STUNNED") return;
    if (player.action === "ATTACK" && Date.now() - player.lastActionTime < 500) return; // Cooldown
    if (player.action === "DODGE" && Date.now() - player.lastActionTime < 500) return;

    set((state) => ({
        player: {
            ...state.player,
            action: action,
            attackType: attackType,
            lastActionTime: Date.now(),
        }
    }));
  },

  updateEnemyAI: (deltaTime) => {
    const { enemy, player, status, difficulty } = get();
    if (status !== "PLAYING") return;

    const now = Date.now();
    const timeSinceLastAction = now - enemy.lastActionTime;
    
    // Difficulty tuning
    let attackInterval = 2000;
    let reactionChance = 0.5;
    
    if (difficulty === "HARD") {
        attackInterval = 1000;
        reactionChance = 0.8;
    } else if (difficulty === "EASY") {
        attackInterval = 3000;
        reactionChance = 0.2;
    }

    // Recovery
    if ((enemy.action === "HIT" || enemy.action === "STUNNED") && timeSinceLastAction > 500) {
        set((state) => ({ enemy: { ...state.enemy, action: "IDLE", attackType: "NONE" } }));
        return;
    }
    
    // Cooldown reset
    if ((enemy.action === "ATTACK" || enemy.action === "DODGE" || enemy.action === "BLOCK") && timeSinceLastAction > 800) {
        set((state) => ({ enemy: { ...state.enemy, action: "IDLE", attackType: "NONE" } }));
    }

    if (enemy.action === "IDLE" && timeSinceLastAction > attackInterval) {
        // AI Decision
        const dist = Math.abs(player.position.x - enemy.position.x); // Hypothetical 1D distance
        const roll = Math.random();

        if (roll < 0.6) {
            // Attack
            const attackRoll = Math.random();
            const type: AttackType = attackRoll > 0.7 ? "HEAVY" : "LIGHT";
            set((state) => ({
                enemy: {
                    ...state.enemy,
                    action: "ATTACK",
                    attackType: type,
                    lastActionTime: now
                },
                message: "ENEMY ATTACKS!",
                messageTimer: 1000
            }));
        } else if (roll < 0.8) {
            // Block
            set((state) => ({
                 enemy: { ...state.enemy, action: "BLOCK", lastActionTime: now }
            }));
        } else {
            // Idle/Wait
             set((state) => ({
                 enemy: { ...state.enemy, lastActionTime: now } // Just reset timer
            }));
        }
    }
  },

  resolveCombat: () => {
      const { player, enemy, status } = get();
      if (status !== "PLAYING") return;

      const now = Date.now();

      // Check Player Hits Enemy
      if (player.action === "ATTACK" && (now - player.lastActionTime) < 100 && (now - player.lastActionTime) > 0) {
          // Hit window (very simple frame check, should be called once per attack start ideally)
          // Actually, let's rely on component to call "hit" or check overlap. 
          // For now, let's assume if player attacks and enemy is not blocking/dodging, it hits.
          
          let damage = 0;
          switch (player.attackType) {
              case "LIGHT": damage = 5; break;
              case "HEAVY": damage = 15; break;
              case "SPECIAL": damage = 25; break;
          }

          if (enemy.action === "BLOCK") {
              damage *= 0.1; // Chip damage
              // Spark effect?
          } else if (enemy.action === "DODGE") {
              damage = 0;
              set({ message: "ENEMY DODGED!", messageTimer: 1000 });
          } else {
              // Clean hit
              set((state) => ({
                  enemy: { ...state.enemy, action: "HIT", lastActionTime: now, hp: Math.max(0, state.enemy.hp - damage) },
                  player: { ...state.player, energy: Math.min(100, state.player.energy + 5) }
              }));
          }
          
          // Apply damage if blocked (chip)
          if (damage > 0 && enemy.action === "BLOCK") {
             set((state) => ({
                  enemy: { ...state.enemy, hp: Math.max(0, state.enemy.hp - damage) }
             }));
          }
      }

      // Check Enemy Hits Player
      if (enemy.action === "ATTACK" && (now - enemy.lastActionTime) < 100 && (now - enemy.lastActionTime) > 0) {
           let damage = 10;
           if (enemy.attackType === "HEAVY") damage = 20;

           if (player.action === "BLOCK") {
               damage *= 0.2;
           } else if (player.action === "DODGE") {
               damage = 0;
               set({ message: "DODGE!", messageTimer: 1000 });
           } else {
               set((state) => ({
                   player: { ...state.player, action: "HIT", lastActionTime: now, hp: Math.max(0, state.player.hp - damage) }
               }));
           }
           
           if (damage > 0 && player.action === "BLOCK") {
                set((state) => ({
                   player: { ...state.player, hp: Math.max(0, state.player.hp - damage) }
                }));
           }
      }

      // Check Win/Loss
      if (enemy.hp <= 0) {
          set({ status: "VICTORY", message: "K.O. - YOU WIN!", messageTimer: 5000 });
      } else if (player.hp <= 0) {
          set({ status: "DEFEAT", message: "K.O. - YOU LOSE...", messageTimer: 5000 });
      }
      
      // Timer update for message
      if (get().messageTimer > 0) {
          set((state) => ({ messageTimer: Math.max(0, state.messageTimer - 16) })); // Assuming ~60fps
          if (get().messageTimer <= 0) {
               set({ message: "" });
          }
      }
  },

  setMessage: (msg, duration = 1000) => set({ message: msg, messageTimer: duration }),

}));

