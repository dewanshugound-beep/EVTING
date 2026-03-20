"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Users,
  Swords,
  Send,
  Smile,
} from "lucide-react";
import { sendMessage, markAsRead } from "@/app/chat/actions";
import { createBrowserSupabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type Message = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  users: { id: string; display_name: string; avatar_url: string | null; username: string };
};

type Channel = {
  id: string;
  name: string;
  type: string;
};

const channelIcons: Record<string, any> = {
  public: Hash,
  dm: Users,
  squad: Swords,
};

const REACTION_EMOJIS = ["🔥", "💀", "❤️", "👍", "🚀", "😂"];

export default function ChatClient({
  channels,
  initialMessages,
  initialChannelId,
  currentUserId,
}: {
  channels: Channel[];
  initialMessages: Message[];
  initialChannelId: string;
  currentUserId: string | null;
}) {
  const [activeChannel, setActiveChannel] = useState(initialChannelId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserSupabase();

    const subscription = supabase
      .channel(`chat:${activeChannel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${activeChannel}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Avoid duplicate if we sent it
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const userId = payload.payload?.userId;
        const name = payload.payload?.name;
        if (userId && userId !== currentUserId) {
          setTypingUsers((prev) =>
            prev.includes(name) ? prev : [...prev, name]
          );
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((n) => n !== name));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeChannel, currentUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;

    startTransition(async () => {
      const result = await sendMessage(activeChannel, input);
      if (result.success && result.message) {
        setMessages((prev) => [...prev, result.message]);
        setInput("");
      }
    });
  };

  const handleTyping = () => {
    if (!currentUserId) return;
    const supabase = createBrowserSupabase();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    supabase.channel(`chat:${activeChannel}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, name: "You" },
    });
    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const switchChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setMessages([]);
    // Mark as read
    if (currentUserId) markAsRead(channelId);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Channel List */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface overflow-y-auto">
        <div className="p-3">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Channels
          </h3>
          <div className="space-y-0.5">
            {channels.map((ch) => {
              const Icon = channelIcons[ch.type] || Hash;
              const isActive = ch.id === activeChannel;
              return (
                <button
                  key={ch.id}
                  onClick={() => switchChannel(ch.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                    isActive
                      ? "bg-neon-blue/10 text-neon-blue"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Message Pane */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <Hash className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-semibold text-white">
            {channels.find((c) => c.id === activeChannel)?.name ?? "Chat"}
          </span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.user_id === currentUserId;
              return (
                <motion.div
                  key={msg.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                >
                  {/* Avatar */}
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                    {msg.users?.avatar_url ? (
                      <img src={msg.users.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500">
                        {msg.users?.display_name?.[0] ?? "?"}
                      </div>
                    )}
                  </div>

                  <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-zinc-300">
                        {msg.users?.display_name ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {msg.created_at
                          ? formatDistanceToNow(new Date(msg.created_at), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2 text-sm ${
                        isOwn
                          ? "bg-neon-blue text-white rounded-tr-sm"
                          : "bg-surface-light border border-border text-zinc-300 rounded-tl-sm"
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-600">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-5 py-1">
            <p className="text-[10px] text-zinc-500 animate-pulse">
              {typingUsers.join(", ")} typing...
            </p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            placeholder={currentUserId ? "Type a message..." : "Sign in to chat"}
            disabled={!currentUserId}
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-neon-blue/50 focus:outline-none transition-colors disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!currentUserId || isPending || !input.trim()}
            className="flex items-center justify-center rounded-xl bg-neon-blue px-4 py-2.5 text-white disabled:opacity-30 cursor-pointer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
