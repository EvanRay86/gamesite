"use client";

import { useState, useRef, useEffect } from "react";
import type { Faction } from "@/types/rift";
import { FACTION_COLORS, FACTION_NAMES } from "@/types/rift";
import type { ChatMessage } from "@/lib/rift-net";

interface RiftChatProps {
  faction: Faction;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function RiftChat({ faction, messages, onSendMessage }: RiftChatProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.length > 200) return;
    onSendMessage(trimmed);
    setInput("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg px-4 py-3
                   flex items-center gap-2 hover:shadow-xl transition-shadow z-40"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: FACTION_COLORS[faction] }}
        />
        <span className="text-sm font-bold">Faction Chat</span>
        {messages.length > 0 && (
          <span className="bg-coral text-white text-xs font-bold rounded-full w-5 h-5
                           flex items-center justify-center">
            {Math.min(messages.length, 9)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-2xl shadow-2xl z-40
                    flex flex-col overflow-hidden"
         style={{ maxHeight: "400px" }}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: FACTION_COLORS[faction] + "15" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: FACTION_COLORS[faction] }}
          />
          <span className="text-sm font-bold" style={{ color: FACTION_COLORS[faction] }}>
            {FACTION_NAMES[faction]} Chat
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-text-muted hover:text-text-primary text-lg leading-none"
        >
          \u2715
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-xs text-text-dim italic text-center py-8">
            No messages yet. Be the first!
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-bold" style={{ color: FACTION_COLORS[msg.faction] }}>
              {msg.playerName}
            </span>
            <span className="text-text-secondary ml-1">{msg.message}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={200}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-coral/30"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="rounded-lg bg-coral px-4 py-2 text-white text-sm font-bold
                       hover:bg-coral-dark transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
