// PixelVille — Core game engine
// Manages game loop, input, state, and multiplayer sync.

import type {
  Direction,
  AnimState,
  RemotePlayer,
  Player,
  Room,
  RoomItem,
  ChatMessage,
  InventorySlot,
  GameState,
  GameScreen,
  PositionPayload,
  ChatPayload,
  AvatarConfig,
  TileMapData,
} from "@/types/pixelville";
import { DEFAULT_AVATAR } from "@/types/pixelville";
import { isWalkable, generateRoomMap, renderGroundCache, TILE } from "./tilemap";
import { drawTile, drawFurniture, drawCrop, TILE as TILE_SIZE } from "./sprites";
import { drawAvatarAt, drawChatBubble, drawNameTag } from "./avatar";
import { getCropStage, getCropBySeedId } from "./items";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TICK_MS = 100;       // Physics tick: 10 Hz
const MOVE_SPEED = 3;      // Pixels per tick
const CHAT_BUBBLE_DURATION = 5000; // ms
const CAM_LERP = 0.12;
const STALE_PLAYER_MS = 3000;

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

export class PixelVilleEngine {
  // State
  state: GameState;
  tileMap: TileMapData | null = null;
  groundCache: OffscreenCanvas | null = null;

  // Camera (smooth)
  camX = 0;
  camY = 0;
  targetCamX = 0;
  targetCamY = 0;

  // Input
  keys: Set<string> = new Set();
  clickTarget: { x: number; y: number } | null = null;

  // Rendering
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  animFrame = 0;
  walkFrame = 0;
  walkTimer = 0;
  frame = 0; // for animated tiles

  // Network
  supabase: SupabaseClient | null = null;
  channel: RealtimeChannel | null = null;

  // Timers
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private rafId: number = 0;
  private lastTickTime = 0;

  // Callbacks
  onStateChange?: () => void;

  constructor() {
    this.state = {
      screen: "loading",
      player: null,
      room: null,
      roomItems: [],
      remotePlayers: new Map(),
      messages: [],
      inventory: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  init(canvas: HTMLCanvasElement, supabase: SupabaseClient) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.supabase = supabase;

    // Input listeners
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    canvas.addEventListener("click", this.handleClick);
  }

  destroy() {
    this.stopGameLoop();
    this.leaveRoom();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas?.removeEventListener("click", this.handleClick);
  }

  // ---------------------------------------------------------------------------
  // Input handlers
  // ---------------------------------------------------------------------------

  private handleKeyDown = (e: KeyboardEvent) => {
    // Don't capture input when typing in chat
    if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
    this.keys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private handleClick = (e: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    // Convert screen to world tile
    const worldX = screenX + this.camX;
    const worldY = screenY + this.camY;
    this.clickTarget = {
      x: Math.floor(worldX / TILE_SIZE),
      y: Math.floor(worldY / TILE_SIZE),
    };
  };

  // ---------------------------------------------------------------------------
  // Room management
  // ---------------------------------------------------------------------------

  async enterRoom(roomId: string) {
    if (!this.supabase || !this.state.player) return;

    // Fetch room data
    const { data: room } = await this.supabase
      .from("pixelville_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (!room) return;

    this.state.room = {
      id: room.id,
      ownerId: room.owner_id,
      name: room.name,
      type: room.type,
      width: room.width,
      height: room.height,
      background: room.background,
      isPublic: room.is_public,
      maxOccupants: room.max_occupants,
    };

    // Fetch room items
    const { data: items } = await this.supabase
      .from("pixelville_room_items")
      .select("*")
      .eq("room_id", roomId);

    this.state.roomItems = (items ?? []).map((i: Record<string, unknown>) => ({
      id: i.id as string,
      roomId: i.room_id as string,
      itemId: i.item_id as string,
      x: i.x as number,
      y: i.y as number,
      rotation: i.rotation as number,
      state: (i.state ?? {}) as Record<string, unknown>,
    }));

    // Fetch recent messages
    const { data: msgs } = await this.supabase
      .from("pixelville_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(50);

    this.state.messages = (msgs ?? []).reverse().map((m: Record<string, unknown>) => ({
      id: m.id as string,
      roomId: m.room_id as string,
      playerId: m.player_id as string,
      playerName: m.player_name as string,
      content: m.content as string,
      messageType: m.message_type as ChatMessage["messageType"],
      createdAt: m.created_at as string,
    }));

    // Generate tile map
    this.tileMap = generateRoomMap(
      this.state.room.type,
      this.state.room.width,
      this.state.room.height,
      this.state.room.background,
    );

    // Cache ground layer
    this.groundCache = renderGroundCache(this.tileMap, drawTile, 0);

    // Update player position in DB
    await this.supabase
      .from("pixelville_players")
      .update({ current_room_id: roomId, x: 5, y: 5 })
      .eq("id", this.state.player.id);

    this.state.player.currentRoomId = roomId;
    this.state.player.x = 5;
    this.state.player.y = 5;
    this.state.remotePlayers.clear();

    // Join realtime channel
    this.joinChannel(roomId);

    // Start game loop
    this.startGameLoop();
    this.state.screen = "playing";
    this.onStateChange?.();
  }

  leaveRoom() {
    if (this.channel) {
      this.supabase?.removeChannel(this.channel);
      this.channel = null;
    }
    this.stopGameLoop();
  }

  // ---------------------------------------------------------------------------
  // Realtime multiplayer
  // ---------------------------------------------------------------------------

  private joinChannel(roomId: string) {
    if (!this.supabase || !this.state.player) return;

    this.channel = this.supabase.channel(`pixelville:room:${roomId}`, {
      config: { presence: { key: this.state.player.id } },
    });

    // Position updates
    this.channel.on("broadcast", { event: "position" }, ({ payload }: { payload: PositionPayload }) => {
      if (payload.pid === this.state.player?.id) return;
      this.updateRemotePlayer(payload);
    });

    // Chat messages
    this.channel.on("broadcast", { event: "chat" }, ({ payload }: { payload: ChatPayload }) => {
      if (!this.state.room) return;
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        roomId: this.state.room.id,
        playerId: payload.pid,
        playerName: payload.name,
        content: payload.content,
        messageType: payload.type,
        createdAt: new Date().toISOString(),
      };
      this.state.messages.push(msg);
      if (this.state.messages.length > 200) this.state.messages.shift();

      // Update bubble on remote player
      const rp = this.state.remotePlayers.get(payload.pid);
      if (rp) {
        rp.lastMessage = payload.content;
        rp.lastMessageAt = Date.now();
      }
      this.onStateChange?.();
    });

    // Presence for join/leave
    this.channel.on("presence", { event: "join" }, ({ newPresences }: { newPresences: Array<{ id: string; name: string; avatar: AvatarConfig }> }) => {
      for (const p of newPresences) {
        if (p.id === this.state.player?.id) continue;
        if (!this.state.remotePlayers.has(p.id)) {
          this.state.remotePlayers.set(p.id, {
            id: p.id,
            displayName: p.name ?? "Villager",
            avatarConfig: p.avatar ?? DEFAULT_AVATAR,
            x: 5,
            y: 5,
            prevX: 5,
            prevY: 5,
            dir: 0,
            anim: "idle",
            lastMessage: null,
            lastMessageAt: 0,
            lastUpdateAt: Date.now(),
          });
        }
      }
      this.onStateChange?.();
    });

    this.channel.on("presence", { event: "leave" }, ({ leftPresences }: { leftPresences: Array<{ id: string }> }) => {
      for (const p of leftPresences) {
        this.state.remotePlayers.delete(p.id);
      }
      this.onStateChange?.();
    });

    this.channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED" && this.state.player) {
        await this.channel?.track({
          id: this.state.player.id,
          name: this.state.player.displayName,
          avatar: this.state.player.avatarConfig,
        });
      }
    });
  }

  private updateRemotePlayer(payload: PositionPayload) {
    let rp = this.state.remotePlayers.get(payload.pid);
    if (!rp) {
      rp = {
        id: payload.pid,
        displayName: "Villager",
        avatarConfig: DEFAULT_AVATAR,
        x: payload.x,
        y: payload.y,
        prevX: payload.x,
        prevY: payload.y,
        dir: payload.dir,
        anim: payload.anim,
        lastMessage: null,
        lastMessageAt: 0,
        lastUpdateAt: Date.now(),
      };
      this.state.remotePlayers.set(payload.pid, rp);
    } else {
      rp.prevX = rp.x;
      rp.prevY = rp.y;
      rp.x = payload.x;
      rp.y = payload.y;
      rp.dir = payload.dir;
      rp.anim = payload.anim;
      rp.lastUpdateAt = Date.now();
    }
  }

  broadcastPosition() {
    if (!this.channel || !this.state.player) return;
    const p = this.state.player;
    this.channel.send({
      type: "broadcast",
      event: "position",
      payload: {
        pid: p.id,
        x: p.x,
        y: p.y,
        dir: this.getPlayerDir(),
        anim: this.keys.size > 0 ? "walk" : "idle",
      } satisfies PositionPayload,
    });
  }

  sendChat(content: string) {
    if (!this.channel || !this.state.player || !this.state.room) return;
    const payload: ChatPayload = {
      pid: this.state.player.id,
      name: this.state.player.displayName,
      content,
      type: "chat",
    };
    this.channel.send({ type: "broadcast", event: "chat", payload });

    // Persist to DB (fire and forget)
    this.supabase?.from("pixelville_messages").insert({
      room_id: this.state.room.id,
      player_id: this.state.player.id,
      player_name: this.state.player.displayName,
      content,
      message_type: "chat",
    });

    // Add to local messages
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      roomId: this.state.room.id,
      playerId: this.state.player.id,
      playerName: this.state.player.displayName,
      content,
      messageType: "chat",
      createdAt: new Date().toISOString(),
    };
    this.state.messages.push(msg);
    if (this.state.messages.length > 200) this.state.messages.shift();
    this.onStateChange?.();
  }

  // ---------------------------------------------------------------------------
  // Game loop
  // ---------------------------------------------------------------------------

  private startGameLoop() {
    this.lastTickTime = performance.now();

    // Physics tick at 10 Hz
    this.tickInterval = setInterval(() => {
      this.tick();
      this.lastTickTime = performance.now();
    }, TICK_MS);

    // Render at 60fps
    const render = () => {
      this.render();
      this.rafId = requestAnimationFrame(render);
    };
    this.rafId = requestAnimationFrame(render);
  }

  private stopGameLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Physics tick (10 Hz)
  // ---------------------------------------------------------------------------

  private tick() {
    if (!this.state.player || !this.tileMap) return;

    const p = this.state.player;
    let dx = 0;
    let dy = 0;

    if (this.keys.has("w") || this.keys.has("arrowup")) dy -= MOVE_SPEED;
    if (this.keys.has("s") || this.keys.has("arrowdown")) dy += MOVE_SPEED;
    if (this.keys.has("a") || this.keys.has("arrowleft")) dx -= MOVE_SPEED;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += MOVE_SPEED;

    if (dx !== 0 || dy !== 0) {
      // Try to move
      const newPixelX = p.x * TILE + TILE / 2 + dx;
      const newPixelY = p.y * TILE + TILE / 2 + dy;
      const newTileX = Math.floor(newPixelX / TILE);
      const newTileY = Math.floor(newPixelY / TILE);

      // Sub-tile movement: store position in pixels for smooth movement
      const newX = newPixelX / TILE;
      const newY = newPixelY / TILE;

      // Check collision at the new tile
      if (isWalkable(this.tileMap, Math.floor(newX), Math.floor(newY))) {
        p.x = Math.max(0.5, Math.min(this.tileMap.width - 0.5, newX));
        p.y = Math.max(0.5, Math.min(this.tileMap.height - 0.5, newY));
      }

      // Walk animation
      this.walkTimer += TICK_MS;
      if (this.walkTimer >= 200) {
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
        this.walkTimer = 0;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    // Handle click target (interaction)
    if (this.clickTarget) {
      this.handleInteraction(this.clickTarget.x, this.clickTarget.y);
      this.clickTarget = null;
    }

    // Remove stale remote players
    const now = Date.now();
    for (const [id, rp] of this.state.remotePlayers) {
      if (now - rp.lastUpdateAt > STALE_PLAYER_MS * 3) {
        this.state.remotePlayers.delete(id);
      }
    }

    // Broadcast position
    this.broadcastPosition();
  }

  private getPlayerDir(): Direction {
    if (this.keys.has("w") || this.keys.has("arrowup")) return 3;
    if (this.keys.has("s") || this.keys.has("arrowdown")) return 0;
    if (this.keys.has("a") || this.keys.has("arrowleft")) return 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) return 2;
    return 0;
  }

  // ---------------------------------------------------------------------------
  // Interaction handler
  // ---------------------------------------------------------------------------

  private handleInteraction(tileX: number, tileY: number) {
    // Check if there's a room item at this tile
    const item = this.state.roomItems.find(
      (ri) => ri.x === tileX && ri.y === tileY,
    );
    if (!item) return;

    // Check for harvestable crops
    const planted = item.state as { plantedAt?: number; cropType?: string; growTimeMs?: number };
    if (planted.plantedAt && planted.cropType && planted.growTimeMs) {
      const stage = getCropStage(planted.plantedAt, planted.growTimeMs);
      if (stage === 3) {
        this.harvestCrop(item);
      }
    }
  }

  private async harvestCrop(item: RoomItem) {
    if (!this.supabase || !this.state.player) return;
    const planted = item.state as { cropType: string; growTimeMs: number };
    const crop = getCropBySeedId(planted.cropType + "_seed");
    if (!crop) return;

    // Add coins and XP
    this.state.player.coins += crop.sellPrice;
    this.state.player.xp += crop.xpReward;

    // Remove crop from room
    this.state.roomItems = this.state.roomItems.filter((ri) => ri.id !== item.id);

    // Update DB
    await this.supabase.from("pixelville_room_items").delete().eq("id", item.id);
    await this.supabase
      .from("pixelville_players")
      .update({ coins: this.state.player.coins, xp: this.state.player.xp })
      .eq("id", this.state.player.id);

    this.onStateChange?.();
  }

  // ---------------------------------------------------------------------------
  // Farming
  // ---------------------------------------------------------------------------

  async plantCrop(seedItemId: string, tileX: number, tileY: number) {
    if (!this.supabase || !this.state.player || !this.state.room) return;
    if (!this.tileMap) return;

    // Check the tile is dirt and empty
    if (this.tileMap.tiles[tileY]?.[tileX] !== "dirt") return;
    if (this.state.roomItems.some((ri) => ri.x === tileX && ri.y === tileY)) return;

    const crop = getCropBySeedId(seedItemId);
    if (!crop) return;

    // Check inventory has the seed
    const slot = this.state.inventory.find((s) => s.itemId === seedItemId);
    if (!slot || slot.quantity < 1) return;

    // Deduct seed
    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      this.state.inventory = this.state.inventory.filter((s) => s.id !== slot.id);
      await this.supabase.from("pixelville_inventory").delete().eq("id", slot.id);
    } else {
      await this.supabase
        .from("pixelville_inventory")
        .update({ quantity: slot.quantity })
        .eq("id", slot.id);
    }

    // Place crop in room
    const { data: newItem } = await this.supabase
      .from("pixelville_room_items")
      .insert({
        room_id: this.state.room.id,
        item_id: seedItemId,
        x: tileX,
        y: tileY,
        state: {
          plantedAt: Date.now(),
          cropType: crop.cropItemId,
          growTimeMs: crop.growTimeMs,
        },
      })
      .select()
      .single();

    if (newItem) {
      this.state.roomItems.push({
        id: newItem.id,
        roomId: newItem.room_id,
        itemId: newItem.item_id,
        x: newItem.x,
        y: newItem.y,
        rotation: newItem.rotation,
        state: newItem.state,
      });
    }

    this.onStateChange?.();
  }

  // ---------------------------------------------------------------------------
  // Shop
  // ---------------------------------------------------------------------------

  async buyItem(itemId: string, price: number) {
    if (!this.supabase || !this.state.player) return false;
    if (this.state.player.coins < price) return false;

    this.state.player.coins -= price;

    // Update or insert inventory
    const existing = this.state.inventory.find((s) => s.itemId === itemId);
    if (existing) {
      existing.quantity += 1;
      await this.supabase
        .from("pixelville_inventory")
        .update({ quantity: existing.quantity })
        .eq("id", existing.id);
    } else {
      const { data } = await this.supabase
        .from("pixelville_inventory")
        .upsert({ player_id: this.state.player.id, item_id: itemId, quantity: 1 }, { onConflict: "player_id,item_id" })
        .select()
        .single();
      if (data) {
        this.state.inventory.push({
          id: data.id,
          playerId: data.player_id,
          itemId: data.item_id,
          quantity: data.quantity,
          metadata: data.metadata ?? {},
        });
      }
    }

    // Update coins in DB
    await this.supabase
      .from("pixelville_players")
      .update({ coins: this.state.player.coins })
      .eq("id", this.state.player.id);

    this.onStateChange?.();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Render (60fps)
  // ---------------------------------------------------------------------------

  private render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas || !this.state.player || !this.tileMap) return;

    const p = this.state.player;
    const renderT = Math.min(1, (performance.now() - this.lastTickTime) / TICK_MS);
    this.frame++;

    // Update camera (smooth lerp)
    this.targetCamX = p.x * TILE - canvas.width / 2;
    this.targetCamY = p.y * TILE - canvas.height / 2;
    this.camX += (this.targetCamX - this.camX) * CAM_LERP;
    this.camY += (this.targetCamY - this.camY) * CAM_LERP;

    // Clamp camera
    const maxCamX = this.tileMap.width * TILE - canvas.width;
    const maxCamY = this.tileMap.height * TILE - canvas.height;
    this.camX = Math.max(0, Math.min(maxCamX, this.camX));
    this.camY = Math.max(0, Math.min(maxCamY, this.camY));

    // Round to prevent sub-pixel blur
    const drawX = Math.round(this.camX);
    const drawY = Math.round(this.camY);

    // Clear
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw ground layer (cached)
    if (this.groundCache) {
      ctx.drawImage(this.groundCache, -drawX, -drawY);
    }

    // Determine visible tile range for culling
    const startTileX = Math.max(0, Math.floor(drawX / TILE) - 1);
    const startTileY = Math.max(0, Math.floor(drawY / TILE) - 1);
    const endTileX = Math.min(this.tileMap.width, Math.ceil((drawX + canvas.width) / TILE) + 1);
    const endTileY = Math.min(this.tileMap.height, Math.ceil((drawY + canvas.height) / TILE) + 1);

    // 2. Draw room items (furniture, crops) — viewport culled
    for (const item of this.state.roomItems) {
      if (item.x < startTileX || item.x > endTileX || item.y < startTileY || item.y > endTileY) continue;
      const sx = item.x * TILE - drawX;
      const sy = item.y * TILE - drawY;

      // Check if it's a growing crop
      const planted = item.state as { plantedAt?: number; cropType?: string; growTimeMs?: number };
      if (planted.plantedAt && planted.cropType && planted.growTimeMs) {
        const stage = getCropStage(planted.plantedAt, planted.growTimeMs);
        drawCrop(ctx, planted.cropType, stage, sx, sy);
      } else {
        drawFurniture(ctx, item.itemId.startsWith("furn_") ? item.itemId : `furn_${item.itemId.replace(/^(wooden_|cozy_|table_|single_|stone_|garden_|wooden )/, "")}`, sx, sy);
      }
    }

    // 3. Draw remote players with interpolation
    const now = Date.now();
    for (const rp of this.state.remotePlayers.values()) {
      // Interpolate position
      const elapsed = now - rp.lastUpdateAt;
      const t = Math.min(1, elapsed / TICK_MS);
      const ix = rp.prevX + (rp.x - rp.prevX) * t;
      const iy = rp.prevY + (rp.y - rp.prevY) * t;

      const sx = ix * TILE - drawX;
      const sy = iy * TILE - drawY;

      // Viewport cull
      if (sx < -TILE * 2 || sx > canvas.width + TILE || sy < -TILE * 2 || sy > canvas.height + TILE) continue;

      const wf = rp.anim === "walk" ? (Math.floor(now / 200) % 2) : 0;
      drawAvatarAt(ctx, rp.avatarConfig, sx, sy, rp.dir, rp.anim, wf);
      drawNameTag(ctx, rp.displayName, sx, sy);

      // Chat bubble
      if (rp.lastMessage && now - rp.lastMessageAt < CHAT_BUBBLE_DURATION) {
        const alpha = 1 - Math.max(0, (now - rp.lastMessageAt - CHAT_BUBBLE_DURATION + 1000) / 1000);
        drawChatBubble(ctx, rp.lastMessage, sx, sy, alpha);
      }
    }

    // 4. Draw local player
    const dir = this.getPlayerDir();
    const anim: AnimState = this.keys.size > 0 &&
      (this.keys.has("w") || this.keys.has("s") || this.keys.has("a") || this.keys.has("d") ||
       this.keys.has("arrowup") || this.keys.has("arrowdown") || this.keys.has("arrowleft") || this.keys.has("arrowright"))
      ? "walk" : "idle";
    const localSx = p.x * TILE - drawX;
    const localSy = p.y * TILE - drawY;
    drawAvatarAt(ctx, p.avatarConfig, localSx, localSy, dir, anim, this.walkFrame);
    drawNameTag(ctx, p.displayName, localSx, localSy);

    // 5. Draw interaction highlight on hovered tile
    if (this.clickTarget) {
      const hx = this.clickTarget.x * TILE - drawX;
      const hy = this.clickTarget.y * TILE - drawY;
      ctx.strokeStyle = "rgba(255,235,59,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(hx, hy, TILE, TILE);
      ctx.setLineDash([]);
    }

    // 6. Draw energy bar (top-left HUD)
    this.drawHUD(ctx);
  }

  private drawHUD(ctx: CanvasRenderingContext2D) {
    if (!this.state.player || !this.canvas) return;
    const p = this.state.player;

    ctx.save();

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath();
    ctx.roundRect(8, 8, 180, 60, 8);
    ctx.fill();

    // Coins
    ctx.fillStyle = "#FDD835";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Coins: ${p.coins}`, 16, 24);

    // Level & XP
    ctx.fillStyle = "#A5D6A7";
    ctx.fillText(`Lv.${p.level}`, 16, 44);

    // Energy bar
    const barX = 70;
    const barY = 38;
    const barW = 108;
    const barH = 12;
    ctx.fillStyle = "#424242";
    ctx.fillRect(barX, barY, barW, barH);
    const energyPct = p.energy / p.maxEnergy;
    const color = energyPct > 0.5 ? "#4CAF50" : energyPct > 0.25 ? "#FFC107" : "#F44336";
    ctx.fillStyle = color;
    ctx.fillRect(barX, barY, barW * energyPct, barH);
    ctx.strokeStyle = "#757575";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = "white";
    ctx.font = "10px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${p.energy}/${p.maxEnergy}`, barX + barW / 2, barY + barH / 2 + 1);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Player data loading
  // ---------------------------------------------------------------------------

  async loadPlayer(userId: string) {
    if (!this.supabase) return;

    const { data: player } = await this.supabase
      .from("pixelville_players")
      .select("*")
      .eq("id", userId)
      .single();

    if (player) {
      this.state.player = {
        id: player.id,
        displayName: player.display_name,
        coins: player.coins,
        xp: player.xp,
        level: player.level,
        energy: player.energy,
        maxEnergy: player.max_energy,
        energyRechargedAt: player.energy_recharged_at,
        avatarConfig: player.avatar_config as AvatarConfig,
        currentRoomId: player.current_room_id,
        x: player.x ?? 5,
        y: player.y ?? 5,
      };
      this.state.screen = "playing";
    } else {
      this.state.screen = "avatar_create";
    }

    // Load inventory
    const { data: inv } = await this.supabase
      .from("pixelville_inventory")
      .select("*")
      .eq("player_id", userId);

    this.state.inventory = (inv ?? []).map((i: Record<string, unknown>) => ({
      id: i.id as string,
      playerId: i.player_id as string,
      itemId: i.item_id as string,
      quantity: i.quantity as number,
      metadata: (i.metadata ?? {}) as Record<string, unknown>,
    }));

    this.onStateChange?.();
  }

  async createPlayer(userId: string, displayName: string, avatarConfig: AvatarConfig) {
    if (!this.supabase) return;

    // Create player record
    const { data } = await this.supabase
      .from("pixelville_players")
      .insert({
        id: userId,
        display_name: displayName,
        avatar_config: avatarConfig,
      })
      .select()
      .single();

    if (data) {
      this.state.player = {
        id: data.id,
        displayName: data.display_name,
        coins: data.coins,
        xp: data.xp,
        level: data.level,
        energy: data.energy,
        maxEnergy: data.max_energy,
        energyRechargedAt: data.energy_recharged_at,
        avatarConfig: data.avatar_config as AvatarConfig,
        currentRoomId: null,
        x: 5,
        y: 5,
      };

      // Create personal home room
      const { data: room } = await this.supabase
        .from("pixelville_rooms")
        .insert({
          owner_id: userId,
          name: `${displayName}'s Home`,
          type: "home",
          width: 12,
          height: 10,
          background: "grass",
          is_public: false,
        })
        .select()
        .single();

      // Give starter items
      const starterItems = [
        { item_id: "tomato_seed", quantity: 5 },
        { item_id: "corn_seed", quantity: 3 },
        { item_id: "basic_hoe", quantity: 1 },
      ];
      for (const item of starterItems) {
        await this.supabase.from("pixelville_inventory").insert({
          player_id: userId,
          ...item,
        });
      }

      // Reload inventory
      const { data: inv } = await this.supabase
        .from("pixelville_inventory")
        .select("*")
        .eq("player_id", userId);

      this.state.inventory = (inv ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        playerId: i.player_id as string,
        itemId: i.item_id as string,
        quantity: i.quantity as number,
        metadata: (i.metadata ?? {}) as Record<string, unknown>,
      }));

      this.state.screen = "playing";
      this.onStateChange?.();
    }
  }

  // ---------------------------------------------------------------------------
  // Furniture placement
  // ---------------------------------------------------------------------------

  async placeFurniture(itemId: string, tileX: number, tileY: number) {
    if (!this.supabase || !this.state.player || !this.state.room) return false;
    if (this.state.room.ownerId !== this.state.player.id) return false;

    // Check inventory
    const slot = this.state.inventory.find((s) => s.itemId === itemId);
    if (!slot || slot.quantity < 1) return false;

    // Check tile is free
    if (this.state.roomItems.some((ri) => ri.x === tileX && ri.y === tileY)) return false;

    // Deduct from inventory
    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      this.state.inventory = this.state.inventory.filter((s) => s.id !== slot.id);
      await this.supabase.from("pixelville_inventory").delete().eq("id", slot.id);
    } else {
      await this.supabase.from("pixelville_inventory").update({ quantity: slot.quantity }).eq("id", slot.id);
    }

    // Place item
    const { data } = await this.supabase
      .from("pixelville_room_items")
      .insert({
        room_id: this.state.room.id,
        item_id: itemId,
        x: tileX,
        y: tileY,
      })
      .select()
      .single();

    if (data) {
      this.state.roomItems.push({
        id: data.id,
        roomId: data.room_id,
        itemId: data.item_id,
        x: data.x,
        y: data.y,
        rotation: data.rotation,
        state: data.state ?? {},
      });
    }

    this.onStateChange?.();
    return true;
  }
}
