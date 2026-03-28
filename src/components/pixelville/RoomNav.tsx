"use client";

import type { PixelVilleEngine } from "@/lib/pixelville/engine";
import { PUBLIC_ROOMS } from "@/lib/pixelville/items";

interface RoomNavProps {
  engine: PixelVilleEngine;
  currentRoomId: string | null;
  homeRoomId: string | null;
}

const PUBLIC_ROOM_LIST = [
  { id: PUBLIC_ROOMS.TOWN_SQUARE, name: "Town Square", icon: "🏛️" },
  { id: PUBLIC_ROOMS.MARKET, name: "Market", icon: "🛒" },
  { id: PUBLIC_ROOMS.PARK, name: "Park", icon: "🌳" },
];

export default function RoomNav({ engine, currentRoomId, homeRoomId }: RoomNavProps) {
  const handleNavigate = async (roomId: string) => {
    if (roomId === currentRoomId) return;
    engine.leaveRoom();
    await engine.enterRoom(roomId);
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <div className="bg-black/60 backdrop-blur-sm rounded-xl p-2 space-y-1">
        <p className="text-[10px] uppercase text-white/40 font-semibold px-2">
          Rooms
        </p>
        {PUBLIC_ROOM_LIST.map((room) => (
          <button
            key={room.id}
            onClick={() => handleNavigate(room.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              currentRoomId === room.id
                ? "bg-teal-500/20 text-teal-300"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{room.icon}</span>
            <span>{room.name}</span>
          </button>
        ))}
        {homeRoomId && (
          <button
            onClick={() => handleNavigate(homeRoomId)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              currentRoomId === homeRoomId
                ? "bg-teal-500/20 text-teal-300"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>My Home</span>
          </button>
        )}
      </div>
    </div>
  );
}
