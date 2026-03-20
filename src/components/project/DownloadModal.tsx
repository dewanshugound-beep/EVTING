"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

type Link = { label: string; url: string };

export default function DownloadModal({
  open,
  onClose,
  links,
  projectTitle,
}: {
  open: boolean;
  onClose: () => void;
  links: Link[];
  projectTitle: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="relative w-full max-w-sm rounded-3xl border border-border bg-surface-light p-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="mb-1 text-lg font-bold text-white">Download</h3>
              <p className="mb-5 text-xs text-zinc-500">
                External links for &quot;{projectTitle}&quot;
              </p>

              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-300 transition-all hover:border-neon-blue/40 hover:bg-neon-blue/5"
                    >
                      <span className="font-medium">{link.label || link.url}</span>
                      <ExternalLink className="h-4 w-4 text-zinc-500" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-600">
                  No download links provided by the creator.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
