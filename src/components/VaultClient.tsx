"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FolderLock,
  Trash2,
  X,
  Upload,
  Star,
  Eye,
} from "lucide-react";
import { createProject, deleteProject } from "@/app/project/actions";
import ProUpgradeModal from "./ProUpgradeModal";
import ProjectCard from "./project/ProjectCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const FREE_PROJECT_LIMIT = 2;

export default function VaultClient({
  projects: initialProjects,
  isAdmin,
  userId,
}: {
  projects: any[];
  isAdmin: boolean;
  userId: string;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [showCreate, setShowCreate] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canCreate = isAdmin || projects.length < FREE_PROJECT_LIMIT;
  const usagePercent = Math.min(
    (projects.length / FREE_PROJECT_LIMIT) * 100,
    100
  );

  const handleCreate = () => {
    if (!canCreate) {
      setShowProModal(true);
      return;
    }
    setShowCreate(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProject(formData);
      if (result.error === "PROJECT_LIMIT_REACHED") {
        setShowCreate(false);
        setShowProModal(true);
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Project created!");
      setShowCreate(false);
      router.refresh();
    });
  };

  const handleDelete = (projectId: string) => {
    startTransition(async () => {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted");
    });
  };

  return (
    <div className="relative min-h-screen w-full">
      <div className="gradient-mesh" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-6 pb-20">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderLock className="h-6 w-6 text-neon-blue" /> Your Vault
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <motion.button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-neon-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon-blue/25 cursor-pointer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Plus className="h-4 w-4" /> New Project
          </motion.button>
        </div>

        {/* Usage Bar (free users) */}
        {!isAdmin && (
          <div className="mb-6 rounded-xl border border-border bg-surface-light p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">
                Free Plan: {projects.length}/{FREE_PROJECT_LIMIT} projects
              </span>
              <button
                onClick={() => setShowProModal(true)}
                className="text-[10px] font-bold text-neon-blue cursor-pointer hover:underline"
              >
                Upgrade to Pro →
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple"
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="relative group">
                <ProjectCard project={project} />
                <button
                  onClick={() => handleDelete(project.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center h-8 w-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-zinc-800 bg-surface-light/50">
            <Upload className="h-10 w-10 text-zinc-700 mb-4" />
            <p className="text-sm text-zinc-500 mb-4">
              Your vault is empty. Start by creating a project.
            </p>
            <motion.button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl bg-neon-blue px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Plus className="h-4 w-4" /> Create First Project
            </motion.button>
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreate(false)}
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
                    onClick={() => setShowCreate(false)}
                    className="absolute right-4 top-4 text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <h2 className="mb-4 text-xl font-bold text-white">
                    New Project
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Title *
                      </label>
                      <input
                        name="title"
                        required
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                        placeholder="My Awesome Project"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Short Description
                      </label>
                      <input
                        name="description"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                        placeholder="A brief description of your project"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        README (Markdown)
                      </label>
                      <textarea
                        name="readme_md"
                        rows={6}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white font-mono focus:border-neon-blue/50 focus:outline-none resize-none"
                        placeholder="# My Project&#10;&#10;Describe your project here..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Tags (comma-separated)
                      </label>
                      <input
                        name="tags"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white focus:border-neon-blue/50 focus:outline-none"
                        placeholder="react, typescript, ui-kit"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        Install Command
                      </label>
                      <input
                        name="install_command"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white font-mono focus:border-neon-blue/50 focus:outline-none"
                        placeholder="npx create-my-app@latest"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-zinc-500">
                        External Links (JSON)
                      </label>
                      <textarea
                        name="external_links"
                        rows={3}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white font-mono focus:border-neon-blue/50 focus:outline-none resize-none"
                        placeholder='[{"label":"Google Drive","url":"https://..."},{"label":"TeraBox","url":"https://..."}]'
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isPending}
                      className="w-full rounded-xl bg-neon-blue py-3 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isPending ? "Creating..." : "Create Project"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Pro Upgrade Modal */}
        <ProUpgradeModal
          open={showProModal}
          onClose={() => setShowProModal(false)}
        />
      </div>
    </div>
  );
}
