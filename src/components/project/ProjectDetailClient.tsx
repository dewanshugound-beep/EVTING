"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Star,
  Eye,
  Link as LinkIcon,
  Share2,
  Download,
  Pencil,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toggleStar, updateProject } from "@/app/project/actions";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import CommentSection from "./CommentSection";
import DownloadModal from "./DownloadModal";
import CodeSnippet from "./CodeSnippet";

type ProjectDetailClientProps = {
  project: any;
  comments: any[];
  isOwner: boolean;
  isStarred: boolean;
  currentUserId: string | null;
};

export default function ProjectDetailClient({
  project,
  comments: initialComments,
  isOwner,
  isStarred: initialStarred,
  currentUserId,
}: ProjectDetailClientProps) {
  const [starred, setStarred] = useState(initialStarred);
  const [starCount, setStarCount] = useState(project.star_count);
  const [showDownload, setShowDownload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStar = () => {
    if (!currentUserId) {
      toast.error("Sign in to star projects");
      return;
    }
    startTransition(async () => {
      const result = await toggleStar(project.id);
      setStarred(result.starred);
      setStarCount((c: number) => (result.starred ? c + 1 : c - 1));
      toast.success(result.starred ? "Project starred!" : "Star removed");
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const creator = project.users;

  return (
    <div className="relative min-h-screen w-full">
      <div className="gradient-mesh" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-6 pb-20">
        {/* Back */}
        <Link
          href="/vault"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Vault
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{project.description}</p>

            {/* Creator */}
            {creator && (
              <Link
                href={`/profile/${creator.id}`}
                className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {creator.avatar_url && (
                  <img
                    src={creator.avatar_url}
                    className="h-5 w-5 rounded-full"
                    alt=""
                  />
                )}
                {creator.display_name} (@{creator.username})
              </Link>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neon-blue/10 px-2.5 py-1 text-[10px] font-medium text-neon-blue"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={handleStar}
              disabled={isPending}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                starred
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10"
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Star
                className="h-3.5 w-3.5"
                fill={starred ? "currentColor" : "none"}
              />
              {starCount}
            </motion.button>

            <button
              onClick={() => setShowDownload(true)}
              className="flex items-center gap-1.5 rounded-xl bg-neon-blue text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-neon-blue/25 cursor-pointer hover:shadow-neon-blue/40 transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 cursor-pointer transition-colors"
            >
              {linkCopied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              {linkCopied ? "Copied!" : "Share"}
            </button>

            {isOwner && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEdit && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEdit(false)}
              />
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface-light p-6 max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={() => setShowEdit(false)}
                    className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h2 className="mb-4 text-xl font-bold text-white">
                    Edit Project
                  </h2>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      startTransition(async () => {
                        const result = await updateProject(
                          project.id,
                          formData
                        );
                        if (result.error) {
                          toast.error(result.error);
                        } else {
                          toast.success("Project updated!");
                          setShowEdit(false);
                          router.refresh();
                        }
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Title
                      </label>
                      <input
                        name="title"
                        defaultValue={project.title}
                        required
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Description
                      </label>
                      <input
                        name="description"
                        defaultValue={project.description}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        README (Markdown)
                      </label>
                      <textarea
                        name="readme_md"
                        defaultValue={project.readme_md}
                        rows={6}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white font-mono focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Tags
                      </label>
                      <input
                        name="tags"
                        defaultValue={project.tags?.join(", ")}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        External Links (JSON)
                      </label>
                      <textarea
                        name="external_links"
                        defaultValue={JSON.stringify(
                          project.external_links || []
                        )}
                        rows={3}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white font-mono focus:border-neon-blue/50 focus:outline-none"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isPending}
                      className="w-full rounded-xl bg-neon-blue py-3 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isPending ? "Updating..." : "Save Changes"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stats Bar */}
        <div className="mb-6 flex items-center gap-6 rounded-xl border border-border bg-surface-light px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Star className="h-3.5 w-3.5" /> {starCount} stars
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Eye className="h-3.5 w-3.5" /> {project.view_count} views
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <LinkIcon className="h-3.5 w-3.5" />{" "}
            {project.external_links?.length ?? 0} links
          </div>
        </div>

        {/* Install Command */}
        {project.install_command && (
          <CodeSnippet code={project.install_command} />
        )}

        {/* README Markdown */}
        <div className="mt-6 rounded-2xl border border-border bg-surface-light p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">
            About
          </h2>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-zinc-400 prose-a:text-neon-blue prose-code:text-neon-blue prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-border">
            {project.readme_md ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {project.readme_md}
              </ReactMarkdown>
            ) : (
              <p className="text-zinc-600 italic">
                No README written yet.
              </p>
            )}
          </div>
        </div>

        {/* Comments */}
        <CommentSection
          projectId={project.id}
          initialComments={initialComments}
          currentUserId={currentUserId}
        />

        {/* Download Modal */}
        <DownloadModal
          open={showDownload}
          onClose={() => setShowDownload(false)}
          links={project.external_links ?? []}
          projectTitle={project.title}
        />
      </div>
    </div>
  );
}
