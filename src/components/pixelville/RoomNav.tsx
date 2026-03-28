"use client";

import type { PixelVilleEngine } from "@/lib/pixelville/engine";
import { PUBLIC_ROOMS } from "@/lib/pixelville/items";

interface RoomNavProps {
  engine: PixelVilleEngine;
  currentRoomId: string | null;
  homeRoomId: string | null;
}

const PUBLIC_ROOM_LIST = [
  { id: PUBLIC_ROOMS.TOWN_SQUARE, name: "Town Square", icon: "\u{1F3DB}\u{FE0F}" },
  { id: PUBLIC_ROOMS.MARKET, name: "Market", icon: "\u{1F6D2}" },
  { id: PUBLIC_ROOMS.PARK, name: "Park", icon: "\u{1F333}" },
];

export default function RoomNav({ engine, currentRoomId, homeRoomId }: RoomNavProps) {
  const handleNavigate = async (roomId: string) => {
    if (roomId === currentRoomId) return;
    engine.leaveRoom();
    await engine.enterRoom(roomId);
  };

  return (
    <div className="absolute top-3 right-3 z-10">
      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3 space-y-1 border border-white/10 min-w-[160px]">
        <p className="text-[10px] uppercase text-white/30 font-semibold tracking-wider px-2 mb-2">
          Rooms
        </p>
        {PUBLIC_ROOM_LIST.map((room) => (
          <button
            key={room.id}
            onClick={() => handleNavigate(room.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
              currentRoomId === room.id
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-white/50 hover:bg-white/10 hover:text-white border border-transparent"
            }`}
          >
            <span className="text-base">{room.icon}</span>
            <span className="font-medium">{room.name}</span>
          </button>
        ))}
        {homeRoomId && (
          <>
            <div className="border-t border-white/10 my-1" />
            <button
              onClick={() => handleNavigate(homeRoomId)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                currentRoomId === homeRoomId
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-white/50 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-base">{"\u{1F3E0}"}</span>
              <span className="font-medium">My Home</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
