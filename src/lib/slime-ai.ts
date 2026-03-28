import type { GameState, PlayerInput } from "./slime-engine";
import {
  CANVAS_W,
  GROUND_Y,
  SLIME_RADIUS,
  BALL_RADIUS,
  NET_X,
  NET_WIDTH,
  NET_HEIGHT,
  GRAVITY,
} from "./slime-engine";

// ── AI Difficulty Levels ──────────────────────────────────
export interface AILevel {
  name: string;
  subtitle: string;
  /** Slime body color */
  color: string;
  /** Slime dark edge color */
  colorDark: string;
  /** Background gradient top */
  bgTop: string;
  /** Background gradient bottom */
  bgBottom: string;
  /** Ground color */
  groundColor: string;
  /** How many frames of delay before AI reacts (lower = harder) */
  reactionDelay: number;
  /** 0-1: how accurately AI predicts ball landing (higher = harder) */
  prediction: number;
  /** 0-1: how aggressively AI positions to spike (higher = harder) */
  aggression: number;
  /** Horizontal speed multiplier (0-1) */
  speedFactor: number;
  /** How often AI makes mistakes (0-1, lower = harder) */
  errorRate: number;
}

export const AI_LEVELS: AILevel[] = [
  {
    name: "Slimey Jr.",
    subtitle: "Just learning the ropes",
    color: "#7BC67E",
    colorDark: "#5a9e5d",
    bgTop: "#0a1a0a",
    bgBottom: "#1a2e1a",
    groundColor: "#1a2e1a",
    reactionDelay: 20,
    prediction: 0.2,
    aggression: 0.05,
    speedFactor: 0.55,
    errorRate: 0.3,
  },
  {
    name: "Sunny",
    subtitle: "A cheerful competitor",
    color: "#F4D35E",
    colorDark: "#c4a63a",
    bgTop: "#1a150a",
    bgBottom: "#2e2510",
    groundColor: "#2e2510",
    reactionDelay: 15,
    prediction: 0.35,
    aggression: 0.15,
    speedFactor: 0.65,
    errorRate: 0.22,
  },
  {
    name: "Blaze",
    subtitle: "Things are heating up",
    color: "#F97316",
    colorDark: "#c45a10",
    bgTop: "#1a0f0a",
    bgBottom: "#2e1a0e",
    groundColor: "#2e1a0e",
    reactionDelay: 12,
    prediction: 0.5,
    aggression: 0.3,
    speedFactor: 0.75,
    errorRate: 0.15,
  },
  {
    name: "Tempest",
    subtitle: "Fast and furious",
    color: "#38BDF8",
    colorDark: "#2196c4",
    bgTop: "#0a0f1a",
    bgBottom: "#0e1a2e",
    groundColor: "#0e1a2e",
    reactionDelay: 9,
    prediction: 0.6,
    aggression: 0.4,
    speedFactor: 0.82,
    errorRate: 0.1,
  },
  {
    name: "Shadow",
    subtitle: "Silent and deadly",
    color: "#A855F7",
    colorDark: "#7e3bc4",
    bgTop: "#10061a",
    bgBottom: "#1e0e2e",
    groundColor: "#1e0e2e",
    reactionDelay: 6,
    prediction: 0.72,
    aggression: 0.55,
    speedFactor: 0.88,
    errorRate: 0.06,
  },
  {
    name: "Inferno",
    subtitle: "Born from fire",
    color: "#EF4444",
    colorDark: "#b82e2e",
    bgTop: "#1a0808",
    bgBottom: "#2e0e0e",
    groundColor: "#2e0e0e",
    reactionDelay: 4,
    prediction: 0.82,
    aggression: 0.7,
    speedFactor: 0.93,
    errorRate: 0.03,
  },
  {
    name: "King Slime",
    subtitle: "The ultimate champion",
    color: "#FBBF24",
    colorDark: "#d4a017",
    bgTop: "#0d0d1a",
    bgBottom: "#1a1024",
    groundColor: "#1a1024",
    reactionDelay: 2,
    prediction: 0.92,
    aggression: 0.85,
    speedFactor: 0.97,
    errorRate: 0.01,
  },
];

// ── AI Brain ──────────────────────────────────────────────

/** Predict where the ball will land on the AI's side */
function predictBallLandingX(state: GameState): number {
  let bx = state.ball.x;
  let by = state.ball.y;
  let bvx = state.ball.vx;
  let bvy = state.ball.vy;

  // Simulate up to 180 frames ahead
  for (let i = 0; i < 180; i++) {
    bvy += GRAVITY;
    bx += bvx;
    by += bvy;

    // Wall bounces
    if (bx - BALL_RADIUS < 0) {
      bx = BALL_RADIUS;
      bvx = Math.abs(bvx) * 0.9;
    }
    if (bx + BALL_RADIUS > CANVAS_W) {
      bx = CANVAS_W - BALL_RADIUS;
      bvx = -Math.abs(bvx) * 0.9;
    }

    // Net collision (simplified)
    const netLeft = NET_X - NET_WIDTH / 2;
    const netRight = NET_X + NET_WIDTH / 2;
    const netTop = GROUND_Y - NET_HEIGHT;
    if (by + BALL_RADIUS > netTop && bx + BALL_RADIUS > netLeft && bx - BALL_RADIUS < netRight) {
      if (bvx > 0 && bx < NET_X) {
        bx = netLeft - BALL_RADIUS;
        bvx = -Math.abs(bvx) * 0.9;
      } else if (bvx < 0 && bx > NET_X) {
        bx = netRight + BALL_RADIUS;
        bvx = Math.abs(bvx) * 0.9;
      }
    }

    // Hit ground
    if (by + BALL_RADIUS >= GROUND_Y) {
      return bx;
    }
  }

  return bx;
}

// Store AI state between frames
let aiReactionCounter = 0;
let aiTargetX = CANVAS_W * 0.75;
let aiShouldJump = false;
let aiErrorOffset = 0;

export function resetAIState(): void {
  aiReactionCounter = 0;
  aiTargetX = CANVAS_W * 0.75;
  aiShouldJump = false;
  aiErrorOffset = 0;
}

export function computeAIInput(state: GameState, level: AILevel): PlayerInput {
  const ai = state.p2;
  const ball = state.ball;
  const input: PlayerInput = { left: false, right: false, jump: false };

  // Reaction delay: only update target every N frames
  aiReactionCounter++;
  if (aiReactionCounter >= level.reactionDelay) {
    aiReactionCounter = 0;

    // Determine error offset for this decision cycle
    if (Math.random() < level.errorRate) {
      aiErrorOffset = (Math.random() - 0.5) * 120;
    } else {
      aiErrorOffset = (Math.random() - 0.5) * 20 * (1 - level.prediction);
    }

    const ballOnMySide = ball.x > NET_X;
    const ballHeadingToMe = ball.vx > 0;
    const ballInAir = ball.y < GROUND_Y - 30;

    if (ballOnMySide || ballHeadingToMe) {
      // Ball is coming to AI's side - try to hit it
      const predictedX = predictBallLandingX(state);
      const blended =
        ball.x * (1 - level.prediction) + predictedX * level.prediction;

      // Aggressive positioning: try to get under the ball to spike it over
      if (level.aggression > 0 && ballInAir && ballOnMySide) {
        // Position slightly behind the ball to hit it forward
        const spikeOffset = (ball.vx > 0 ? -20 : 20) * level.aggression;
        aiTargetX = blended + spikeOffset + aiErrorOffset;
      } else {
        aiTargetX = blended + aiErrorOffset;
      }

      // Jump decision
      const distToBall = Math.sqrt(
        (ai.x - ball.x) ** 2 + (ai.y - ball.y) ** 2
      );
      const ballDescending = ball.vy > 0;
      const ballClose = distToBall < SLIME_RADIUS + BALL_RADIUS + 60;

      aiShouldJump =
        ballClose &&
        ballDescending &&
        ball.y < GROUND_Y - SLIME_RADIUS &&
        ballOnMySide;

      // Aggressive jump: jump early to spike
      if (
        level.aggression > 0.3 &&
        ballOnMySide &&
        ball.y < GROUND_Y - 80 &&
        Math.abs(ai.x - ball.x) < 50 &&
        Math.random() < level.aggression
      ) {
        aiShouldJump = true;
      }
    } else {
      // Ball is on opponent's side - return to defensive position
      aiTargetX = CANVAS_W * 0.75 + aiErrorOffset;
      aiShouldJump = false;
    }

    // Keep in bounds
    const minX = NET_X + NET_WIDTH / 2 + SLIME_RADIUS;
    const maxX = CANVAS_W - SLIME_RADIUS;
    aiTargetX = Math.max(minX, Math.min(maxX, aiTargetX));
  }

  // Move toward target
  const moveThreshold = 4 * level.speedFactor;
  if (ai.x < aiTargetX - moveThreshold) {
    input.right = true;
  } else if (ai.x > aiTargetX + moveThreshold) {
    input.left = true;
  }

  // Jump
  if (aiShouldJump && ai.y >= GROUND_Y) {
    input.jump = true;
  }

  return input;
}
