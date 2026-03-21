"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { addComment, deleteComment } from "@/app/project/actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Comment = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  users: { display_name: string; avatar_url: string | null; username: string };
};

export default function CommentSection({
  projectId,
  initialComments,
  currentUserId,
}: {
  projectId: string;
  initialComments: Comment[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    if (!currentUserId) {
      toast.error("Sign in to comment");
      return;
    }

    startTransition(async () => {
      const result = await addComment(projectId, body);
      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment]);
        setBody("");
        toast.success("Comment posted!");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      await deleteComment(commentId, projectId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    });
  };

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
        Discussion ({comments.length})
      </h2>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={currentUserId ? "Write a comment..." : "Sign in to comment"}
          disabled={!currentUserId || isPending}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-neon-blue/50 focus:outline-none transition-colors disabled:opacity-50"
        />
        <motion.button
          type="submit"
          disabled={!currentUserId || isPending || !body.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-neon-blue px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-30 cursor-pointer"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Send className="h-3.5 w-3.5" />
        </motion.button>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="flex gap-3 rounded-xl border border-border bg-surface-light p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
            >
              {/* Avatar */}
              <Link href={comment.users?.username ? `/u/${comment.users.username}` : `/profile/${comment.user_id}`} className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800 hover:opacity-80 transition-opacity">
                {comment.users?.avatar_url ? (
                  <img
                    src={comment.users.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500">
                    {comment.users?.display_name?.[0] ?? "?"}
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                  <Link href={comment.users?.username ? `/u/${comment.users.username}` : `/profile/${comment.user_id}`} className="flex items-center gap-2 group">
                    <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                      {comment.users?.display_name}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </Link>
                <p className="mt-1 text-sm text-zinc-400">{comment.body}</p>
              </div>

              {/* Delete (own comments) */}
              {currentUserId === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-600">
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
