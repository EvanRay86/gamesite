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

  // Also stop keyup propagation to prevent engine from clearing keys
  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-2xl px-2 pb-2">
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 mb-1 px-4 py-1.5 rounded-t-xl bg-black/70 text-white/60 text-xs font-medium hover:bg-black/80 hover:text-white transition-colors border border-b-0 border-white/10"
        >
          {isExpanded ? "Hide Chat" : "Show Chat"}
        </button>

        {isExpanded && (
          <div className="bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
            {/* Message list */}
            <div
              ref={scrollRef}
              className="h-32 overflow-y-auto px-4 py-3 space-y-1.5 scrollbar-thin"
            >
              {messages.length === 0 && (
                <p className="text-white/30 text-sm italic">
                  No messages yet. Say hello!
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm leading-relaxed">
                  {msg.messageType === "system" ? (
                    <span className="text-yellow-300/70 italic text-xs">
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
                      <span className="text-white/30">: </span>
                      <span className="text-white/90">{msg.content}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex gap-2 px-3 py-2.5 border-t border-white/10">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onFocus={(e) => e.stopPropagation()}
                placeholder="Type a message... (Enter to send)"
                maxLength={200}
                autoComplete="off"
                className="flex-1 bg-white/10 text-white placeholder:text-white/25 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400/40 border border-white/5 focus:border-teal-400/30 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:bg-white/5 disabled:text-white/20 text-white text-sm font-medium rounded-lg transition-colors"
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
