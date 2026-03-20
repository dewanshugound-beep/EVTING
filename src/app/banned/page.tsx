"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Terminal } from "lucide-react";

export default function BannedPage() {
  const [code, setCode] = useState<string[]>([]);

  useEffect(() => {
    // Generate falling code characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&*%";
    const generateLine = () => {
      let line = "";
      for (let i = 0; i < 50; i++) {
        line += chars[Math.floor(Math.random() * chars.length)];
      }
      return line;
    };

    const interval = setInterval(() => {
      setCode((prev) => [generateLine(), ...prev.slice(0, 30)]);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* Falling Code Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden flex flex-col items-center">
        {code.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-600 text-xs tracking-[1em] whitespace-nowrap"
          >
            {line}
          </motion.div>
        ))}
      </div>

      {/* Alert Content */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full p-8 rounded-3xl bg-black border-2 border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
          <ShieldAlert className="text-red-500 animate-pulse" size={40} />
        </div>

        <h1 className="text-4xl font-black text-red-500 tracking-tighter mb-4 uppercase">
          Access Denied
        </h1>
        
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/50 to-transparent mb-6" />

        <p className="text-red-400 text-lg font-bold mb-8 leading-relaxed italic">
          "YOU HAVE BEEN DISCONNECTED FROM THE MATRIX."
        </p>

        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 text-[10px] font-black text-red-600 tracking-widest uppercase mb-2">
            <Terminal size={12} /> System Log
          </div>
          <p className="text-red-700 text-xs text-left">
            [FATAL] Error 403: Signal terminated by Root. <br />
            [INFO] IP: [REDACTED] <br />
            [INFO] Status: PERMANENT_EXCLUSION
          </p>
        </div>

        <p className="text-zinc-500 text-sm">
          If you believe this is a signal error, contact the Architect.
        </p>
      </motion.div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_100%),linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,100%_100%,3px_100%]" />
    </div>
  );
}
