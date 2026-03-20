"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, Rocket } from "lucide-react";

export default function ProUpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neon-blue/20 bg-surface-light p-8">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple">
                <Crown className="h-8 w-8 text-white" />
              </div>

              <h2 className="mb-2 text-2xl font-bold text-white">
                Upgrade to Pro
              </h2>
              <p className="mb-6 text-sm text-zinc-400">
                You&apos;ve hit the free limit of <strong>2 projects</strong>.
                Upgrade to Pro for unlimited uploads and premium features.
              </p>

              {/* Features */}
              <div className="mb-6 space-y-3">
                {[
                  { icon: Rocket, text: "Unlimited project uploads" },
                  { icon: Zap, text: "Priority in search results" },
                  { icon: Crown, text: "Pro badge on your profile" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-blue/10">
                        <Icon className="h-4 w-4 text-neon-blue" />
                      </div>
                      {item.text}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.button
                className="w-full rounded-2xl bg-gradient-to-r from-neon-blue to-neon-purple py-3 text-sm font-bold text-white shadow-lg shadow-neon-blue/25 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Upgrade for $9/mo
              </motion.button>

              <p className="mt-3 text-center text-xs text-zinc-600">
                Cancel anytime. No questions asked.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
