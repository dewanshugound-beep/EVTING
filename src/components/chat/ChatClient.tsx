"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Users,
  Swords,
  Send,
  Plus,
  Trash2,
  Loader2,
  Zap,
  Flag,
} from "lucide-react";
import { sendMessage, markAsRead, deleteMessage } from "@/app/chat/actions";
import { reportVaultContent } from "@/app/explore/actions";
import { createBrowserSupabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Virtuoso } from "react-virtuoso";
import Image from "next/image";

type Message = {
  id: string;
  body: string;
  user_id: string;
  is_broadcast?: boolean;
  sender_name?: string;
  created_at: string;
  users: { 
    id: string; 
    display_name: string; 
    avatar_url: string | null; 
    username: string;
    role: string;
    message_count: number;
  };
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

const RankBadge = React.memo(({ role, messageCount }: { role?: string; messageCount?: number }) => {
  if (role === 'admin') return <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-[8px] font-black text-red-500 tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)] ml-2 uppercase animate-pulse">[OVERLORD]</span>;
  if ((messageCount || 0) > 50) return <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black text-emerald-500 tracking-widest ml-2 uppercase">[HACKER]</span>;
  return <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[8px] font-black text-zinc-500 tracking-widest ml-2 uppercase">[NODE]</span>;
});
RankBadge.displayName = "RankBadge";

const MessageItem = React.memo(({ 
  msg, 
  currentUserId, 
  isImage, 
  onReport, 
  onDelete 
}: { 
  msg: Message; 
  currentUserId: string | null; 
  isImage: (url: string) => boolean; 
  onReport: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const isOwn = msg.user_id === currentUserId;
  const isBroadcast = msg.is_broadcast;
  const isImageMsg = isImage(msg.body);

  return (
    <motion.div 
      className={`flex gap-3 group px-5 mb-6 ${isOwn ? "flex-row-reverse" : ""} ${isBroadcast ? "justify-center w-full my-6 px-0" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {!isBroadcast && (
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/5 relative bg-zinc-900">
          {msg.users?.avatar_url ? (
            <Image 
              src={msg.users.avatar_url} 
              alt={msg.users.display_name || "Agent"} 
              fill 
              sizes="36px"
              className="object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-zinc-600 uppercase">
              {msg.users?.display_name?.[0]}
            </div>
          )}
        </div>
      )}

      <div className={`${isBroadcast ? "w-full max-w-2xl px-6 py-4 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative" : "max-w-[70%]"} ${isOwn && !isBroadcast ? "text-right" : ""}`}>
        <div className={`flex items-center gap-2 mb-1 flex-wrap ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className={`text-[10px] font-black tracking-widest uppercase ${isBroadcast ? "text-emerald-400" : "text-zinc-400"}`}>
            {isBroadcast ? "MATRIX SYSTEM" : (msg.users?.display_name ?? "AGENT")}
          </span>
          {!isBroadcast && <RankBadge role={msg.users?.role} messageCount={msg.users?.message_count} />}
          <span className="text-[10px] text-zinc-700 font-mono">
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
          {!isBroadcast && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {!isOwn && (
                <button 
                  onClick={() => onReport(msg.id)} 
                  className="p-1 text-zinc-700 hover:text-orange-500 cursor-pointer transition-colors"
                >
                  <Flag size={10} />
                </button>
              )}
              {isOwn && (
                <button 
                  onClick={() => onDelete(msg.id)} 
                  className="p-1 text-zinc-700 hover:text-red-500 cursor-pointer transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`text-sm ${
          isBroadcast ? "text-emerald-50 font-medium" : isOwn ? "inline-block rounded-2xl px-4 py-2 bg-neon-blue text-white rounded-tr-sm shadow-lg shadow-neon-blue/10" : "inline-block rounded-2xl px-4 py-2 bg-surface-light border border-border text-zinc-300 rounded-tl-sm"
        } ${isImageMsg ? "!bg-transparent !p-0" : ""}`}>
          {isImageMsg ? (
            <div className="relative max-w-md w-full aspect-auto rounded-xl border-2 border-emerald-500/20 shadow-xl overflow-hidden group/img">
              <img 
                src={msg.body} 
                className="w-full h-auto object-contain transition-transform group-hover/img:scale-[1.02]" 
                alt="Archive Signal" 
                loading="lazy"
              />
            </div>
          ) : (
            msg.body
          )}
        </div>
      </div>
    </motion.div>
  );
});
MessageItem.displayName = "MessageItem";

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
  const { user } = useUser();
  const [activeChannel, setActiveChannel] = useState(initialChannelId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const virtuosoRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSound = useCallback((type: 'click' | 'typing') => {
    const isMuted = localStorage.getItem("matrix_sound_muted") === "true";
    if (isMuted) return;
    const audio = new Audio(type === 'click' ? '/click.mp3' : '/typing.mp3');
    audio.play().catch(() => {});
  }, []);

  const isImage = useCallback((url: string) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/.test(url.toLowerCase());
  }, []);

  // Auto-scroll logic handled by Virtuoso's initialTopMostItemIndex or followOutput
  useEffect(() => {
    if (messages.length > 0) {
      virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages.length]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!currentUserId || !user) return;

    const channel = supabase.channel(`chat:${activeChannel}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannel}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        supabase.from("users").select("id, display_name, avatar_url, username, role, message_count").eq("id", newMsg.user_id).single()
          .then(({ data }) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              playSound('typing');
              return [...prev, { ...newMsg, users: data }];
            });
          });
      })
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannel}`,
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const typing: string[] = [];
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.isTyping && p.userId !== currentUserId) {
              typing.push(p.userName || "Unknown Hacker");
            }
          });
        });
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUserId,
            userName: user.firstName || user.username || "Guest",
            isTyping: false,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel, currentUserId, user, playSound]);

  const handleSend = (e?: React.FormEvent, bodyOverride?: string) => {
    e?.preventDefault();
    const bodyText = bodyOverride || input;
    if (!bodyText.trim() || !currentUserId) return;

    playSound('click');
    startTransition(async () => {
      const result = await sendMessage(activeChannel, bodyText);
      if (result.success && result.message) {
        setMessages((prev) => [...prev, result.message]);
        if (!bodyOverride) setInput("");
      }
    });
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const supabase = createBrowserSupabase();
      const firstMsgDate = messages[0]?.created_at || new Date().toISOString();
      const { data } = await supabase.from("messages").select("*, users(id, display_name, avatar_url, username, role, message_count)").eq("channel_id", activeChannel)
        .lt("created_at", firstMsgDate).order("created_at", { ascending: false }).limit(50);
      if (data && data.length > 0) {
        setMessages((prev) => [...(data.reverse() as Message[]), ...prev]);
        if (data.length < 50) setHasMore(false);
      } else { setHasMore(false); }
    } catch (err) { toast.error("Failed to load history."); } finally { setLoadingMore(false); }
  };

  const handleDelete = useCallback(async (msgId: string) => {
    try {
      const result = await deleteMessage(msgId);
      if (result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        toast.success("Message terminated.");
      }
    } catch (err) { toast.error("Failed to delete message."); }
  }, []);

  const handleReport = useCallback(async (msgId: string) => {
    try {
      await reportVaultContent(msgId, "message", "User Flag");
      toast.success("Signal sent to the Oracle.");
    } catch (err) { toast.error("Failed to alert the Oracle."); }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    setUploading(true);
    setUploadProgress(10);
    const supabase = createBrowserSupabase();
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat/${fileName}`;
      setUploadProgress(30);
      const { error } = await supabase.storage.from('matrix-files').upload(filePath, file);
      if (error) throw error;
      setUploadProgress(70);
      const { data: { publicUrl } } = supabase.storage.from('matrix-files').getPublicUrl(filePath);
      setUploadProgress(100);
      setTimeout(() => {
        handleSend(undefined, publicUrl);
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
      setUploading(false); setUploadProgress(0);
    }
  };

  const handleTyping = () => {
    if (!currentUserId || !user) return;
    const supabase = createBrowserSupabase();
    const channel = supabase.channel(`chat:${activeChannel}`);
    channel.track({ userId: currentUserId, userName: user.firstName || user.username || "Guest", isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ userId: currentUserId, userName: user.firstName || user.username || "Guest", isTyping: false });
    }, 3000);
  };

  const switchChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setMessages([]);
    setHasMore(true);
    if (currentUserId) markAsRead(channelId);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <aside className="w-56 shrink-0 border-r border-border bg-surface overflow-y-auto hidden md:block">
        <div className="p-3">
          <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-600">Channels</h3>
          <div className="space-y-0.5">
            {channels.map((ch) => {
              const Icon = channelIcons[ch.type] || Hash;
              const isActive = ch.id === activeChannel;
              return (
                <button key={ch.id} onClick={() => switchChannel(ch.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${isActive ? "bg-neon-blue/10 text-neon-blue font-bold" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"}`}>
                  <Icon className="h-4 w-4 shrink-0" /> <span className="truncate uppercase tracking-tighter">{ch.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col bg-black/40 relative">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3 bg-surface/50 z-10">
          <Hash className="h-4 w-4 text-neon-blue" />
          <span className="text-sm font-black text-white uppercase tracking-widest">
            {channels.find((c) => c.id === activeChannel)?.name ?? "Chat"}
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            followOutput="smooth"
            components={{
              Header: () => (
                <div className="pt-5">
                  {hasMore && (
                    <button 
                      onClick={handleLoadMore} 
                      className="w-full py-4 text-[10px] font-black tracking-[0.3em] text-zinc-600 hover:text-emerald-400 transition-all uppercase flex items-center justify-center gap-2 border-b border-white/5"
                    >
                      {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <Zap size={10} />} MATRIX REWIND
                    </button>
                  )}
                </div>
              ),
              Footer: () => <div className="pb-5" />
            }}
            itemContent={(_, msg) => (
              <MessageItem 
                key={msg.id} 
                msg={msg} 
                currentUserId={currentUserId} 
                isImage={isImage} 
                onReport={handleReport} 
                onDelete={handleDelete} 
              />
            )}
            style={{ height: '100%', scrollbarWidth: 'none' }}
          />
        </div>

        {uploading && (
           <div className="px-5 py-2 bg-black/20 backdrop-blur-md absolute bottom-20 left-0 right-0 z-20">
             <div className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mb-1 animate-pulse">Uploading to the Matrix... {uploadProgress}%</div>
             <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
             </div>
           </div>
        )}

        <div className="px-5 py-1 z-10">
          {typingUsers.length > 0 ? (
            <p className="text-[9px] text-emerald-500 font-black tracking-widest uppercase animate-pulse">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? 'is hacking...' : 'are hacking...'}
            </p>
          ) : <div className="h-3" />}
        </div>

        <div className="border-t border-border p-4 bg-surface/30 z-10">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white transition-all cursor-pointer"><Plus size={18} /></button>
            <input type="text" value={input} onChange={(e) => { setInput(e.target.value); handleTyping(); }} placeholder="Transmit signal..." className="flex-1 h-10 rounded-xl bg-black/50 border border-border px-4 text-sm text-white focus:border-neon-blue/50 outline-none" />
            <button type="submit" disabled={!input.trim() || isPending} className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-blue text-white shadow-lg shadow-neon-blue/20 disabled:opacity-20 cursor-pointer"><Send size={18} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
