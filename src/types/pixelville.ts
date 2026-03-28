// PixelVille — Community Sim Game Types

// ---------------------------------------------------------------------------
// Direction & Animation
// ---------------------------------------------------------------------------

export type Direction = 0 | 1 | 2 | 3; // 0=down, 1=left, 2=right, 3=up
export type AnimState = "idle" | "walk";

// ---------------------------------------------------------------------------
// Avatar Configuration
// ---------------------------------------------------------------------------

export interface AvatarConfig {
  body: number;       // skin tone index 0-5
  hair: number;       // hair style 0-5 (0=none)
  hairColor: number;  // hair color index 0-7
  shirt: number;      // shirt color index 0-9
  pants: number;      // pants color index 0-9
  shoes: number;      // shoe color index 0-5
  hat: number;        // hat style 0-4 (0=none)
  accessory: number;  // accessory 0-3 (0=none)
}

export const DEFAULT_AVATAR: AvatarConfig = {
  body: 0,
  hair: 1,
  hairColor: 0,
  shirt: 2,
  pants: 4,
  shoes: 0,
  hat: 0,
  accessory: 0,
};

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface Player {
  id: string;
  displayName: string;
  coins: number;
  xp: number;
  level: number;
  energy: number;
  maxEnergy: number;
  energyRechargedAt: string; // ISO timestamp
  avatarConfig: AvatarConfig;
  currentRoomId: string | null;
  x: number;
  y: number;
}

/** Lightweight representation of another player in the same room. */
export interface RemotePlayer {
  id: string;
  displayName: string;
  avatarConfig: AvatarConfig;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  dir: Direction;
  anim: AnimState;
  lastMessage: string | null;
  lastMessageAt: number; // timestamp for bubble fade
  lastUpdateAt: number;  // for stale detection
}

// ---------------------------------------------------------------------------
// Room
// ---------------------------------------------------------------------------

export type RoomType =
  | "town_square"
  | "market"
  | "park"
  | "arcade"
  | "farm"
  | "home";

export interface Room {
  id: string;
  ownerId: string | null;
  name: string;
  type: RoomType;
  width: number;
  height: number;
  background: string;
  isPublic: boolean;
  maxOccupants: number;
}

// ---------------------------------------------------------------------------
// Items & Inventory
// ---------------------------------------------------------------------------

export type ItemCategory =
  | "seed"
  | "crop"
  | "furniture"
  | "clothing"
  | "tool"
  | "animal"
  | "material";

export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  buyPrice: number | null;
  sellPrice: number | null;
  premium: boolean;
  rarity: ItemRarity;
  properties: Record<string, unknown>;
  spriteKey: string;
}

export interface InventorySlot {
  id: string;
  playerId: string;
  itemId: string;
  quantity: number;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Room Items (placed furniture, crops, etc.)
// ---------------------------------------------------------------------------

export interface RoomItem {
  id: string;
  roomId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: number;
  state: Record<string, unknown>; // e.g. { plantedAt, cropType }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type MessageType = "chat" | "emote" | "system" | "trade";

export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Farming
// ---------------------------------------------------------------------------

export interface CropDef {
  seedItemId: string;
  cropItemId: string;
  name: string;
  growTimeMs: number;
  sellPrice: number;
  xpReward: number;
  energyCost: number;
  stages: number; // typically 4
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export interface Quest {
  id: string;
  playerId: string;
  questDate: string;
  questType: string;
  progress: number;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export type FriendStatus = "pending" | "accepted" | "blocked";

export interface Friend {
  id: string;
  playerId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Network Payloads (compact for Realtime broadcast)
// ---------------------------------------------------------------------------

export interface PositionPayload {
  pid: string;
  x: number;
  y: number;
  dir: Direction;
  anim: AnimState;
}

export interface ChatPayload {
  pid: string;
  name: string;
  content: string;
  type: MessageType;
}

// ---------------------------------------------------------------------------
// Game State
// ---------------------------------------------------------------------------

export type GameScreen =
  | "loading"
  | "avatar_create"
  | "playing"
  | "shop"
  | "inventory"
  | "room_editor";

export interface GameState {
  screen: GameScreen;
  player: Player | null;
  room: Room | null;
  roomItems: RoomItem[];
  remotePlayers: Map<string, RemotePlayer>;
  messages: ChatMessage[];
  inventory: InventorySlot[];
}

// ---------------------------------------------------------------------------
// Tile Map
// ---------------------------------------------------------------------------

export type TileType =
  | "grass"
  | "dirt"
  | "stone"
  | "water"
  | "wood"
  | "sand"
  | "wall";

export interface TileMapData {
  width: number;
  height: number;
  tiles: TileType[][];
  collisions: boolean[][]; // true = blocked
}
