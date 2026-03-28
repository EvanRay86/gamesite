// PixelVille — Avatar renderer with compositing and caching
// Avatars are 16x24 pixels rendered at 2x scale (32x48 on canvas).

import type { AvatarConfig, Direction, AnimState } from "@/types/pixelville";
import { SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS, SHOE_COLORS } from "./sprites";

const AW = 32; // avatar width on canvas
const AH = 48; // avatar height on canvas

// Cache composited avatars by config+dir+anim key
const avatarCache = new Map<string, OffscreenCanvas>();

function cacheKey(config: AvatarConfig, dir: Direction, anim: AnimState, walkFrame: number): string {
  return `${config.body}_${config.hair}_${config.hairColor}_${config.shirt}_${config.pants}_${config.shoes}_${config.hat}_${config.accessory}_${dir}_${anim}_${walkFrame}`;
}

export function getAvatarSprite(
  config: AvatarConfig,
  dir: Direction,
  anim: AnimState,
  walkFrame: number,
): OffscreenCanvas {
  const key = cacheKey(config, dir, anim, walkFrame);
  let cached = avatarCache.get(key);
  if (cached) return cached;

  cached = new OffscreenCanvas(AW, AH);
  const ctx = cached.getContext("2d")!;
  renderAvatar(ctx, config, dir, anim, walkFrame);
  avatarCache.set(key, cached);

  // Evict old entries if cache gets too large
  if (avatarCache.size > 500) {
    const first = avatarCache.keys().next().value;
    if (first !== undefined) avatarCache.delete(first);
  }

  return cached;
}

function renderAvatar(
  ctx: OffscreenCanvasRenderingContext2D,
  config: AvatarConfig,
  dir: Direction,
  anim: AnimState,
  walkFrame: number,
) {
  const skin = SKIN_TONES[config.body] ?? SKIN_TONES[0];
  const hairCol = HAIR_COLORS[config.hairColor] ?? HAIR_COLORS[0];
  const shirtCol = SHIRT_COLORS[config.shirt] ?? SHIRT_COLORS[0];
  const pantsCol = PANTS_COLORS[config.pants] ?? PANTS_COLORS[0];
  const shoeCol = SHOE_COLORS[config.shoes] ?? SHOE_COLORS[0];

  const isWalking = anim === "walk";
  const legOffset = isWalking ? (walkFrame === 0 ? 2 : -2) : 0;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(16, 46, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Shoes ---
  ctx.fillStyle = shoeCol;
  ctx.fillRect(8 + legOffset, 40, 6, 4);
  ctx.fillRect(18 - legOffset, 40, 6, 4);

  // --- Pants (legs) ---
  ctx.fillStyle = pantsCol;
  ctx.fillRect(9 + legOffset, 32, 5, 9);
  ctx.fillRect(18 - legOffset, 32, 5, 9);

  // --- Body / Shirt ---
  ctx.fillStyle = shirtCol;
  ctx.fillRect(8, 18, 16, 15);
  // Sleeves
  ctx.fillRect(4, 19, 5, 8);
  ctx.fillRect(23, 19, 5, 8);

  // --- Hands ---
  ctx.fillStyle = skin;
  ctx.fillRect(4, 27, 5, 4);
  ctx.fillRect(23, 27, 5, 4);

  // --- Neck ---
  ctx.fillStyle = skin;
  ctx.fillRect(13, 14, 6, 5);

  // --- Head ---
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(16, 10, 8, 0, Math.PI * 2);
  ctx.fill();

  // --- Eyes ---
  ctx.fillStyle = "#2C1B0E";
  if (dir === 0) {
    // Facing down
    ctx.fillRect(12, 10, 2, 2);
    ctx.fillRect(18, 10, 2, 2);
  } else if (dir === 3) {
    // Facing up — no eyes visible
  } else if (dir === 1) {
    // Facing left
    ctx.fillRect(10, 10, 2, 2);
    ctx.fillRect(14, 10, 2, 2);
  } else {
    // Facing right
    ctx.fillRect(16, 10, 2, 2);
    ctx.fillRect(20, 10, 2, 2);
  }

  // --- Hair ---
  if (config.hair > 0) {
    ctx.fillStyle = hairCol;
    drawHair(ctx, config.hair, dir);
  }

  // --- Hat ---
  if (config.hat > 0) {
    drawHat(ctx, config.hat, hairCol);
  }

  // --- Accessory ---
  if (config.accessory > 0) {
    drawAccessory(ctx, config.accessory, dir);
  }
}

function drawHair(ctx: OffscreenCanvasRenderingContext2D, style: number, dir: Direction) {
  switch (style) {
    case 1: // Short
      ctx.fillRect(8, 2, 16, 6);
      if (dir !== 3) ctx.fillRect(8, 6, 3, 4); // sides
      if (dir !== 3) ctx.fillRect(21, 6, 3, 4);
      break;
    case 2: // Long
      ctx.fillRect(8, 2, 16, 6);
      ctx.fillRect(6, 6, 4, 12);
      ctx.fillRect(22, 6, 4, 12);
      break;
    case 3: // Curly
      ctx.beginPath();
      ctx.arc(10, 5, 4, 0, Math.PI * 2);
      ctx.arc(16, 3, 4, 0, Math.PI * 2);
      ctx.arc(22, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 4: // Spiky
      ctx.fillRect(8, 2, 16, 5);
      ctx.fillRect(10, 0, 3, 4);
      ctx.fillRect(15, -1, 3, 5);
      ctx.fillRect(20, 0, 3, 4);
      break;
    case 5: // Bun
      ctx.fillRect(8, 2, 16, 6);
      ctx.beginPath();
      ctx.arc(16, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function drawHat(ctx: OffscreenCanvasRenderingContext2D, style: number, _color: string) {
  switch (style) {
    case 1: // Cap
      ctx.fillStyle = "#1565C0";
      ctx.fillRect(6, 1, 20, 6);
      ctx.fillRect(4, 6, 10, 3);
      break;
    case 2: // Cowboy
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(4, 4, 24, 4);
      ctx.fillRect(8, 0, 16, 6);
      break;
    case 3: // Beanie
      ctx.fillStyle = "#E57373";
      ctx.fillRect(7, 0, 18, 8);
      ctx.fillStyle = "#EF5350";
      ctx.fillRect(7, 6, 18, 3);
      // Pom
      ctx.beginPath();
      ctx.arc(16, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 4: // Crown
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(8, 2, 16, 6);
      ctx.fillRect(8, 0, 3, 4);
      ctx.fillRect(14, -1, 4, 5);
      ctx.fillRect(21, 0, 3, 4);
      // Gems
      ctx.fillStyle = "#E74C3C";
      ctx.fillRect(15, 3, 2, 2);
      break;
  }
}

function drawAccessory(ctx: OffscreenCanvasRenderingContext2D, style: number, dir: Direction) {
  if (dir === 3) return; // not visible from back
  switch (style) {
    case 1: // Glasses
      ctx.fillStyle = "#263238";
      ctx.fillRect(10, 9, 5, 4);
      ctx.fillRect(17, 9, 5, 4);
      ctx.fillRect(15, 10, 2, 1);
      // Lenses
      ctx.fillStyle = "rgba(144,202,249,0.5)";
      ctx.fillRect(11, 10, 3, 2);
      ctx.fillRect(18, 10, 3, 2);
      break;
    case 2: // Scarf
      ctx.fillStyle = "#E53935";
      ctx.fillRect(8, 16, 16, 4);
      ctx.fillRect(8, 20, 4, 6);
      break;
    case 3: // Necklace
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(16, 19, 6, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(16, 25, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

// ---------------------------------------------------------------------------
// Draw avatar onto main canvas at world position
// ---------------------------------------------------------------------------

export function drawAvatarAt(
  ctx: CanvasRenderingContext2D,
  config: AvatarConfig,
  screenX: number,
  screenY: number,
  dir: Direction,
  anim: AnimState,
  walkFrame: number,
) {
  const sprite = getAvatarSprite(config, dir, anim, walkFrame);
  // Center avatar horizontally on tile, offset vertically so feet align with tile bottom
  ctx.drawImage(sprite, screenX - AW / 2 + 16, screenY - AH + 32);
}

// ---------------------------------------------------------------------------
// Chat bubble drawing
// ---------------------------------------------------------------------------

export function drawChatBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  screenX: number,
  screenY: number,
  alpha: number,
) {
  if (!text || alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "12px 'Outfit', sans-serif";
  const metrics = ctx.measureText(text);
  const textW = Math.min(metrics.width, 160);
  const padX = 8;
  const padY = 4;
  const bubbleW = textW + padX * 2;
  const bubbleH = 20;
  const bx = screenX + 16 - bubbleW / 2;
  const by = screenY - 56;

  // Bubble background
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = "#E0E0E0";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Triangle pointer
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(screenX + 12, by + bubbleH);
  ctx.lineTo(screenX + 16, by + bubbleH + 6);
  ctx.lineTo(screenX + 20, by + bubbleH);
  ctx.fill();

  // Text
  ctx.fillStyle = "#212121";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, screenX + 16, by + bubbleH / 2, 160);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Name tag drawing
// ---------------------------------------------------------------------------

export function drawNameTag(
  ctx: CanvasRenderingContext2D,
  name: string,
  screenX: number,
  screenY: number,
) {
  ctx.save();
  ctx.font = "bold 10px 'Outfit', sans-serif";
  const metrics = ctx.measureText(name);
  const w = metrics.width + 8;
  const bx = screenX + 16 - w / 2;
  const by = screenY - 20;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.roundRect(bx, by, w, 14, 3);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, screenX + 16, by + 7);
  ctx.restore();
}

export { AW, AH };
