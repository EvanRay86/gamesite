"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { PixelVilleEngine } from "@/lib/pixelville/engine";
import type { ChatMessage } from "@/types/pixelville";
import { filterMessage, isValidMessage } from "@/lib/pixelville/chat-filter";

interface ChatPanelProps {
  engine: PixelVilleEngine;
  messages: ChatMessage[];
}

export default function ChatPanel({ engine, messages }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!isValidMessage(trimmed)) {
      setInput("");
      return;
    }
    const filtered = filterMessage(trimmed);
    engine.sendChat(filtered);
    setInput("");
    inputRef.current?.focus();
  }, [input, engine]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
      // Stop propagation so game engine doesn't capture typing
      e.stopPropagation();
    },
    [handleSend],
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-2xl">
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 mb-1 px-3 py-1 rounded-t-lg bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors"
        >
          {isExpanded ? "Hide Chat" : "Show Chat"}
        </button>

        {isExpanded && (
          <div className="bg-black/60 backdrop-blur-sm rounded-t-lg overflow-hidden">
            {/* Message list */}
            <div
              ref={scrollRef}
              className="h-36 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin"
            >
              {messages.length === 0 && (
                <p className="text-white/40 text-sm italic">
                  No messages yet. Say hello!
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm leading-tight">
                  {msg.messageType === "system" ? (
                    <span className="text-yellow-300/80 italic">
                      {msg.content}
                    </span>
                  ) : msg.messageType === "emote" ? (
                    <span className="text-purple-300/80 italic">
                      * {msg.playerName} {msg.content}
                    </span>
                  ) : (
                    <>
                      <span className="text-teal-300 font-semibold">
                        {msg.playerName}
                      </span>
                      <span className="text-white/50">: </span>
                      <span className="text-white/90">{msg.content}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex gap-2 px-3 py-2 border-t border-white/10">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 bg-white/10 text-white placeholder:text-white/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-400/50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
