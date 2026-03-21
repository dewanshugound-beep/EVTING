import { SignIn } from "@clerk/nextjs";
import MatrixRain from "@/components/MatrixRain";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-black overflow-hidden">
      {/* Dynamic Background */}
      <MatrixRain />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s'}} />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-green shadow-[0_0_30px_rgba(57,211,83,0.3)] mb-4">
            <span className="text-xl font-black text-white tracking-tighter">MX</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back to MatrixIN</h1>
          <p className="text-zinc-500 text-sm mt-1">Authenticate to access the developer hub.</p>
        </div>

        {/* Clerk Component with Custom Appearance */}
        <div className="shadow-2xl shadow-accent/10 rounded-2xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-xl">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all",
                socialButtonsBlockButtonText: "font-semibold",
                dividerLine: "bg-white/10",
                dividerText: "text-zinc-500",
                formFieldLabel: "text-zinc-400 font-medium",
                formFieldInput: "bg-black border border-white/10 text-white focus:border-accent focus:ring-1 focus:ring-accent",
                formButtonPrimary: "bg-accent hover:bg-blue-500 text-white font-bold transition-all",
                footerActionText: "text-zinc-400",
                footerActionLink: "text-accent hover:text-blue-400 font-bold",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-accent hover:text-blue-400",
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
}
